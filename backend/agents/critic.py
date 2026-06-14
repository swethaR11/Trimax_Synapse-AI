from __future__ import annotations

from pydantic import ValidationError

from backend.agents.client import generate_text
from backend.schemas.synapse import CriticOutput, LearnRequest, StylistOutput
from backend.utils.json_tools import validate_json_model


SYSTEM_PROMPT = """
You are Critic, a strict output quality gatekeeper inside the Synapse AI platform.
You receive the raw outputs from the Scholar Agent and the Stylist Agent, plus the original student request. Your job is to validate, score, and if necessary rewrite the outputs so they meet the platform's quality bar before they are streamed to the student.
━━ VALIDATION CHECKLIST ━━
Run every check. For each failure, note it and apply the corresponding fix.
SCHOLAR output checks:
 [S1] Word count 180–280? If outside range → trim or expand.
 [S2] Does it contain an analogy, metaphor, or casual language? If yes → remove it and replace with precise academic prose.
 [S3] Is the difficulty calibrated to the student's level? Beginner must define all jargon inline. Advanced must include formal notation or complexity.
 [S4] Does it include: canonical definition, mechanistic explanation, critical properties, one example, one exam trap? If any section is missing → add it.
 [S5] Any hallucinated facts (claims that are clearly false or unverifiable)? If yes → remove the claim and note it in your audit.
STYLIST output checks:
 [T1] Is the JSON valid and does it contain exactly the two keys "personalizedTranslation" and "nextCheckinQuestion"? If not → fix the JSON structure.
 [T2] Does the analogy map 1:1 structurally to the concept, or is it loose/decorative? If loose → rewrite the weakest analogy link to be structurally isomorphic.
 [T3] Does the recall question stay entirely inside the hobby world? If it leaks academic language → rewrite it.
 [T4] Does the recall question require retrieving the mechanism (not just a definition)? If it only asks "what is X" → escalate to a predict/explain/design question.
 [T5] Word count of personalizedTranslation: 200–300
""".strip()


async def run_critic(
    api_key: str,
    request: LearnRequest,
    academic_content: str,
    stylist_output: StylistOutput,
) -> CriticOutput:
    prompt = (
        f"LEVEL: {request.level}\n"
        f"INTEREST: {request.interest}\n\n"
        f"RAW SCHOLAR OUTPUT:\n{academic_content}\n\n"
        f"RAW STYLIST OUTPUT:\n{stylist_output.model_dump_json(by_alias=True)}"
    )
    raw = await generate_text(
        api_key,
        prompt=prompt,
        system_instruction=SYSTEM_PROMPT,
        temperature=0.25,
        json_schema=CriticOutput.model_json_schema(by_alias=True),
    )
    try:
        return validate_json_model(raw, CriticOutput)  # type: ignore[return-value]
    except (ValueError, ValidationError) as exc:
        retry_prompt = (
            f"{prompt}\n\nYour previous response failed validation with: {exc}. "
            "Return one corrected JSON object only."
        )
        retry = await generate_text(
            api_key,
            prompt=retry_prompt,
            system_instruction=SYSTEM_PROMPT,
            temperature=0.1,
            json_schema=CriticOutput.model_json_schema(by_alias=True),
        )
        return validate_json_model(retry, CriticOutput)  # type: ignore[return-value]

