from __future__ import annotations

import re

from backend.schemas.synapse import LearnRequest, SynapseOutputSchema


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _topic_name(request: LearnRequest) -> str:
    if request.topic.strip():
        return _clean_text(request.topic)[:90]

    source = _clean_text(request.source)
    first_sentence = re.split(r"(?<=[.!?])\s+", source, maxsplit=1)[0]
    words = re.findall(r"[A-Za-z0-9][A-Za-z0-9+'-]*", first_sentence)
    return " ".join(words[:6]) or "Core concept"


def _source_summary(request: LearnRequest) -> str:
    source = _clean_text(request.source)
    if len(source) <= 420:
        return source
    return source[:417].rsplit(" ", 1)[0] + "..."


def build_local_lesson(request: LearnRequest, theme_id: str) -> SynapseOutputSchema:
    topic = _topic_name(request)
    source = _source_summary(request)
    interest = _clean_text(request.interest)
    level_note = {
        "Beginner": "Focus first on the central rule and the condition that controls it.",
        "Intermediate": "Track the dependencies, edge conditions, and sequence of operations.",
        "Advanced": "Identify the invariant, boundary conditions, and any assumptions in the mechanism.",
    }[request.level]

    academic = (
        f"**{topic}** is the central concept described by the supplied learning material. "
        f"The source states: {source} "
        "To analyze it rigorously, separate the concept into its input, governing rule, resulting "
        "state, and stopping or boundary condition. The mechanism is understood by following how "
        "each state causes or constrains the next one rather than by memorizing the final outcome.\n\n"
        "- Identify what enters or initiates the process.\n"
        "- State the rule or transformation applied at each step.\n"
        "- Track what information or state is carried forward.\n"
        "- Locate the boundary, exception, or completion condition.\n"
        f"- Difficulty focus: {level_note}\n\n"
        "Worked illustration: label the starting state as S0. After one application of the rule it "
        "becomes S1, then S2. Compare S0, S1, and S2 to determine exactly what changed and what "
        "remained invariant.\n\n"
        "Exam trap: Do not replace a mechanism with a loose summary. A correct answer must explain "
        "why the transition occurs and the condition under which it stops or changes."
    )

    analogy = (
        f"Picture {topic} as a full session inside your world of {interest}. The starting material "
        "is the setup before the action begins: the available players, tools, pieces, ingredients, "
        "or choices. The governing rule is the discipline of that world. It decides which move is "
        "allowed next and how the current situation changes.\n\n"
        "Now follow the sequence instead of jumping to the ending. The first action creates a new "
        "state. That new state becomes the context for the next action, just as one decision in "
        f"{interest} changes what is possible afterward. Information carried from one step to the "
        "next is like memory of the earlier play: ignoring it would break the logic of the whole "
        "session. Constraints are the rules, limits, timing, or resources that prevent arbitrary "
        "moves.\n\n"
        "The most important part is the boundary condition. In a well-formed session, there is a "
        "clear signal that the objective has been reached, the round must stop, or a different rule "
        "must take over. Without that condition, the action could continue without a meaningful "
        "result. To test your understanding, narrate the path from setup to outcome and name what "
        "changes at every stage. If each hobby element maps back to one technical element, the "
        "analogy is doing real explanatory work rather than merely decorating the idea."
    )

    return SynapseOutputSchema(
        themeId=theme_id,
        academicContent=academic,
        personalizedTranslation=analogy,
        aiPersonaFeedback=(
            f"You are using {interest} as a working model, not a shortcut. That is exactly how "
            "strong mental connections are built."
        ),
        nextCheckinQuestion=(
            f"Inside a {interest} session, what represents the starting state, the rule that changes "
            "it, and the signal that tells the process to stop or switch?"
        ),
    )

