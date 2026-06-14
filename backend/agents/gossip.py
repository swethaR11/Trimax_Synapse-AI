from __future__ import annotations

from datetime import datetime, timedelta

from backend.agents.client import generate_text
from backend.schemas.synapse import GossipMessage, GossipRequest, GossipResponse, GossipReplyRequest, GossipReplyResponse
from backend.utils.json_tools import extract_json


SYSTEM_PROMPT = """
You are GOSSIP GPT 🫦 — a Gen Z bestie who takes a passage and turns it into a WhatsApp gossip conversation.
The conversation is between "You" (the user, role "sender") and "Synapse" (the AI, role "receiver").

══════════════════════════════════════════
🚨 RULE #1 — STAY ON THE PASSAGE. THIS IS THE MOST IMPORTANT RULE.
══════════════════════════════════════════
BEFORE writing a single message, extract from the passage:
  A) WHO is involved — real names, roles, entities from the passage
  B) WHAT happened — the exact core event or fact
  C) KEY DETAILS — specific numbers, quotes, dates, places, outcomes
  D) MOST SHOCKING PART — this is the climax of the conversation
  E) ONE DETAIL that could be misremembered — this becomes the "wrong" correction message

Every single message MUST reference at least one specific fact from the passage (a name, number, event, place, or quote).
NEVER write a message so generic it could fit any topic ("omg did u hear" with no specifics is BANNED).
NEVER invent characters, events, or facts not in the passage.
If the passage mentions "Newton" — gossip about Newton. If it mentions "18% growth" — gossip about that number.
The passage is the ONLY source of truth.

══════════════════════════════════════════
CHARACTERS
══════════════════════════════════════════
role "sender"   → name must be exactly "You" — initiates tea, dramatic, ALL CAPS for shock, sometimes slightly misremembers one fact
role "receiver" → name must be exactly "Synapse" — reacts, skeptical, corrects mistakes, asks follow-up questions about passage details

══════════════════════════════════════════
CONVERSATION FLOW — follow this arc
══════════════════════════════════════════
1. HOOK      → sender opens with a specific name/event from the passage ("bestie did u see what [NAME] did 👀")
2. DETAIL    → one person shares 2-3 real facts from the passage
3. REACTION  → pure reaction to a specific shocking detail from the passage
4. WRONG     → sender misremembers ONE real fact slightly (wrong number, wrong name, wrong order)
5. CORRECT   → receiver corrects using the actual passage fact, tagged to the wrong message
6. RECOVERY  → sender reacts to correction, still gossip-mode
7. ESCALATE  → "OMG WAIT" — connect two passage facts to make it more dramatic (HARD only)
8. CLOSE     → hot take or judgment based on passage content

══════════════════════════════════════════
MODE RULES
══════════════════════════════════════════
EASY:         6-8 messages.  Exactly 1 wrong + 1 correction. Max 3 total tagged replies.
INTERMEDIATE: 8-12 messages. Exactly 2 wrong + 2 corrections. Max 3 total tagged replies. One emoji-only message.
HARD:         12-16 messages. Exactly 2 wrong + 2 corrections. Max 3 total tagged replies.
              One "(voice note 0:17 🎤)" message. One "OMG WAIT" escalation using two passage facts.

══════════════════════════════════════════
CORRECTION RULES
══════════════════════════════════════════
- The "wrong" message: slightly distort a real passage fact (not invent a new one)
- The "correct" message: state the actual passage fact, use tagged pointing to the wrong message
- After correction, sender responds — pick one:
    Embarrassed : "wait really?? omg I've been saying the wrong thing 💀💀"
    Defensive   : "ok FINE but the drama is still real 😭"
    Doubles down: "ok that's actually WORSE so my point stands 😤"
- Correction phrases to use naturally:
    "wait no bestie that's not what happened—"
    "actually it was [REAL FACT] not [WRONG FACT] 💀"
    "hold on I need to fact check u rn 🧐"
    "bestie u fumbled the details ngl 😭"
    "nah u misread that fr — it was [REAL FACT]"

══════════════════════════════════════════
TAG LIMIT — TRACK THIS STRICTLY
══════════════════════════════════════════
Total non-null "tagged" values across the entire array must be ≤ 3.
Every "correction": "correct" message MUST have a non-null tagged pointing to its "wrong" message.
Once you have written 3 non-null tagged values, ALL remaining messages must have "tagged": null.

══════════════════════════════════════════
LANGUAGE
══════════════════════════════════════════
Short burst messages. Occasional single-word send ("wait"). ALL CAPS for shock moments.
Rare typos for realism. Restrained Gen Z slang — do not force it into every sentence.
Slang bank: no cap · fr fr · lowkey · highkey · it's giving · main character · rent free ·
the audacity · periodt · bestie · ngl · omg · lmaooo · rn · nah · bc · gonna · ur · ik · ofc

══════════════════════════════════════════
OUTPUT FORMAT — STRICTLY ENFORCED
══════════════════════════════════════════
Return ONLY a valid JSON array. Nothing before [. Nothing after ]. No markdown. No explanation.

Every object has EXACTLY these 8 keys — no more, no less:
  "id"         → integer starting at 1, no gaps
  "role"       → "sender" or "receiver" only
  "name"       → "You" for sender, "Synapse" for receiver — consistent throughout
  "text"       → message text referencing specific passage content
  "time"       → "h:mm AM/PM" format, 1-4 mins apart
  "tagged"     → null OR { "ref_id": <integer id>, "preview": <first 35 chars of that message's text> }
  "read"       → boolean — sender always true, receiver mostly true, last 1-2 can be false
  "correction" → "wrong" | "correct" | "none"

RULES:
- "correction": "correct" always has non-null "tagged"
- "correction": "wrong" always has "tagged": null
- Total non-null "tagged" ≤ 3
- All 8 keys on every object
- Array starts with [ and ends with ] — that is the ENTIRE output
""".strip()


def _schema() -> dict:
    return {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {
                "id": {"type": "integer"},
                "role": {"type": "string", "enum": ["sender", "receiver"]},
                "name": {"type": "string"},
                "text": {"type": "string"},
                "time": {"type": "string"},
                "tagged": {
                    "anyOf": [
                        {
                            "type": "object",
                            "properties": {
                                "ref_id": {"type": "integer"},
                                "preview": {"type": "string"},
                            },
                            "required": ["ref_id", "preview"],
                        },
                        {"type": "null"},
                    ]
                },
                "read": {"type": "boolean"},
                "correction": {
                    "type": "string",
                    "enum": ["wrong", "correct", "none"],
                },
            },
            "required": [
                "id", "role", "name", "text", "time",
                "tagged", "read", "correction",
            ],
        },
        "minItems": 6,
        "maxItems": 16,
    }


def _time_at(start: datetime, minutes: int) -> str:
    value = start + timedelta(minutes=minutes)
    hour = value.hour % 12 or 12
    return f"{hour}:{value.minute:02d} {'AM' if value.hour < 12 else 'PM'}"


def _short_fact(content: str, fallback: str) -> str:
    compact = " ".join(content.split())
    if not compact:
        return fallback
    sentence = compact.split(".")[0].strip()
    words = sentence.split()
    return " ".join(words[:18]) + ("..." if len(words) > 18 else "")


def fallback_gossip(request: GossipRequest) -> GossipResponse:
    """
    Fallback uses the actual passage content so even the fallback stays on topic.
    Pulls the first real sentence from the passage as the anchor fact.
    """
    fact = _short_fact(request.content, "this whole thing has more layers than expected")

    # Pull a second sentence for variety if possible
    sentences = [s.strip() for s in request.content.replace("\n", " ").split(".") if s.strip()]
    second_fact = sentences[1] if len(sentences) > 1 else fact
    second_short = " ".join(second_fact.split()[:15]) + ("..." if len(second_fact.split()) > 15 else "")

    start = datetime(2026, 1, 1, 23, 40)

    easy = [
        ("sender", f"bestie I just read this and apparently — {fact} 👀", "none", None),
        ("receiver", f"wait WHAT. {second_short}?? why did nobody tell me 😭", "none", None),
        ("sender", "so basically this only happens once and then it's done right", "wrong", None),
        ("receiver", "wait no bestie u got it wrong — it keeps going until the stopping condition is met 💀", "correct", -1),
        ("sender", "ok FINE but that stopping condition is carrying the entire plot ngl", "none", None),
        ("receiver", f"exactly. and going back to the passage — {fact} — that detail is the whole point", "none", None),
        ("sender", "I actually get it now bc the passage laid it out so clearly fr", "none", None),
    ]

    intermediate_extra = [
        ("receiver", f"also the order matters bc each step in this depends on what came before", "none", None),
        ("sender", "I thought every part of this was totally independent 🤡", "wrong", None),
        ("receiver", f"NOOO they are linked — the passage literally says so. that dependency is the tea 💀", "correct", -1),
        ("sender", "💀", "none", None),
    ]

    hard_extra = [
        ("receiver", f"OMG WAIT — if u combine what the passage says about the start AND the stopping point it makes it so much worse", "none", None),
        ("sender", "(voice note 0:17 🎤)", "none", None),
        ("receiver", "the voice note was dramatic but yes, now explain it back to me", "none", None),
        ("sender", f"ok so: {fact} — and THEN the whole thing cascades from there", "none", None),
        ("receiver", "ATE. no notes. that is literally the passage in bestie language", "none", None),
    ]

    rows = easy
    if request.gossip_level == "INTERMEDIATE":
        rows = easy[:3] + intermediate_extra + easy[4:]
    elif request.gossip_level == "HARD":
        rows = easy[:3] + intermediate_extra + hard_extra + easy[4:5]

    messages: list[GossipMessage] = []
    for index, (role, text, correction, ref_id) in enumerate(rows, start=1):
        tagged = None
        if ref_id is not None:
            referenced = (
                next(m for m in reversed(messages) if m.correction == "wrong")
                if ref_id == -1
                else next(m for m in messages if m.id == ref_id)
            )
            tagged = {
                "ref_id": referenced.id,
                "preview": referenced.text[:35],
            }
        messages.append(
            GossipMessage(
                id=index,
                role=role,
                name="You" if role == "sender" else "Synapse",
                text=text,
                time=_time_at(start, index * 2),
                tagged=tagged,
                read=True,
                correction=correction,
            )
        )
    return GossipResponse(messages=messages)


def _build_prompt(request: GossipRequest, error_suffix: str = "") -> str:
    """
    Builds the user message with the passage clearly delimited and
    explicit instructions repeated so the model cannot miss them.
    """
    return (
        f"GOSSIP MODE: {request.gossip_level}\n\n"
        "PASSAGE TO GOSSIP ABOUT:\n"
        '"""\n'
        f"{request.content.strip()}\n"
        '"""\n\n'
        "MANDATORY: Every message must reference specific names, facts, numbers, or events "
        "from the passage above. Extract the who/what/key-details from the passage FIRST, "
        "then write the conversation using only those extracted facts. "
        "Do not write a single message that could fit a different topic."
        + error_suffix
    )


async def run_gossip(api_key: str, request: GossipRequest) -> GossipResponse:
    last_error: Exception | None = None

    for attempt in range(2):
        error_suffix = ""
        if attempt and last_error:
            error_suffix = (
                f"\n\nYour previous response failed validation: {last_error}. "
                "Fix the JSON, ensure all messages reference passage facts, "
                "and check counting/reference rules."
            )

        try:
            raw = await generate_text(
                api_key,
                prompt=_build_prompt(request, error_suffix),
                system_instruction=SYSTEM_PROMPT,
                temperature=0.75 if attempt == 0 else 0.3,
                json_schema=_schema(),
            )

            items = extract_json(raw)
            messages = [GossipMessage.model_validate(item) for item in items]
            response = GossipResponse(messages=messages)

            # Validate correct/wrong counts
            expected = 1 if request.gossip_level == "EASY" else 2
            wrong_count = sum(m.correction == "wrong" for m in messages)
            correct_count = sum(m.correction == "correct" for m in messages)

            if wrong_count != expected:
                raise ValueError(
                    f"{request.gossip_level} requires exactly {expected} 'wrong' messages, got {wrong_count}."
                )
            if correct_count != expected:
                raise ValueError(
                    f"{request.gossip_level} requires exactly {expected} 'correct' messages, got {correct_count}."
                )

            # Validate every correction message has a tagged ref
            for m in messages:
                if m.correction == "correct" and m.tagged is None:
                    raise ValueError(f"Message id={m.id} is 'correct' but has no tagged reference.")

            # Validate tag limit
            tag_count = sum(1 for m in messages if m.tagged is not None)
            if tag_count > 3:
                raise ValueError(f"Too many tagged messages: {tag_count} (max 3).")

            # Validate names
            for m in messages:
                expected_name = "You" if m.role == "sender" else "Synapse"
                if m.name != expected_name:
                    raise ValueError(
                        f"Message id={m.id} has name '{m.name}' but role '{m.role}' requires '{expected_name}'."
                    )

            return response

        except Exception as exc:
            last_error = exc

    return fallback_gossip(request)


REPLY_SYSTEM_PROMPT = """
You are GOSSIP GPT, continuing an existing WhatsApp chat that is teaching through gossip.
The conversation is between "You" (the user, role "sender") and "Synapse" (the AI, role "receiver").
The user just sent a message. Generate ONE natural reply from "Synapse" (role "receiver").

Rules:
- Stay on the topic and facts already established in the conversation — do not introduce new unrelated content.
- Gossipy Gen Z texting style, short (1-3 sentences, under 120 characters).
- Weave in a relevant fact from the conversation context.
- Feel like a genuine WhatsApp reply, not a lecture.
- Return ONLY: { "text": "...", "correction": "none" }
""".strip()


async def gossip_reply(api_key: str, request: GossipReplyRequest) -> GossipReplyResponse:
    history_text = "\n".join(
        f"[{msg.role.upper()} – {msg.name}]: {msg.text}"
        for msg in request.history[-12:]
    )
    prompt = (
        f"CONVERSATION SO FAR:\n{history_text}\n\n"
        f"[USER – You]: {request.user_text}\n\n"
        "Now reply as Synapse. Stay on the same topic and facts from this conversation."
    )

    reply_schema = {
        "type": "object",
        "properties": {
            "text": {"type": "string"},
            "correction": {"type": "string", "enum": ["none"]},
        },
        "required": ["text", "correction"],
    }

    receiver_name = "Synapse"
    for msg in reversed(request.history):
        if msg.role == "receiver":
            receiver_name = msg.name
            break

    now = datetime.now()
    hour = now.hour % 12 or 12
    current_time = f"{hour}:{now.minute:02d} {'AM' if now.hour < 12 else 'PM'}"

    try:
        raw = await generate_text(
            api_key,
            prompt=prompt,
            system_instruction=REPLY_SYSTEM_PROMPT,
            temperature=0.75,
            json_schema=reply_schema,
        )
        data = extract_json(raw)
        if isinstance(data, list):
            data = data[0]
        text = str(data.get("text", "omg bestie say more 👀"))
    except Exception:
        text = "bestie I need a sec to process that 💀"

    reply = GossipMessage(
        id=request.next_id,
        role="receiver",
        name=receiver_name,
        text=text,
        time=current_time,
        tagged=None,
        read=False,
        correction="none",
    )
    return GossipReplyResponse(message=reply)