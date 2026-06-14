from __future__ import annotations

from backend.agents.client import generate_text
from backend.schemas.synapse import RecallRequest, RecallResult
from backend.utils.json_tools import validate_json_model


SYSTEM_PROMPT = """
You grade active-recall answers for Synapse AI. Judge whether the student's answer demonstrates
the mechanism, not whether it uses exact wording. Return correct, partial, or incorrect.
Award exactly 10 XP for correct, 5 for partial, and 0 for incorrect. Give concise, encouraging
feedback in the student's interest vocabulary. For partial or incorrect answers, provide a short
hint that does not reveal the whole answer. Return only schema-valid JSON.
""".strip()


async def grade_recall(api_key: str, request: RecallRequest) -> RecallResult:
    prompt = (
        f"TOPIC: {request.topic}\n"
        f"INTEREST: {request.interest}\n"
        f"ACADEMIC REFERENCE:\n{request.academic_content}\n\n"
        f"QUESTION:\n{request.question}\n\n"
        f"STUDENT ANSWER:\n{request.answer}"
    )
    raw = await generate_text(
        api_key,
        prompt=prompt,
        system_instruction=SYSTEM_PROMPT,
        temperature=0.25,
        json_schema=RecallResult.model_json_schema(),
    )
    result = validate_json_model(raw, RecallResult)
    expected_xp = {"correct": 10, "partial": 5, "incorrect": 0}[result.result]  # type: ignore[attr-defined]
    if result.xp != expected_xp:  # type: ignore[attr-defined]
        result.xp = expected_xp  # type: ignore[attr-defined]
    return result  # type: ignore[return-value]

