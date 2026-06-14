from __future__ import annotations

import asyncio
import json
import os
from collections.abc import AsyncIterator

from dotenv import load_dotenv
from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse

load_dotenv()

# The API key is read from the .env file; the X-Gemini-Key header is accepted
# as a fallback for local development without a .env file.
_ENV_KEY: str | None = os.getenv("GEMINI_API_KEY")

from backend.agents.client import MODEL, create_client, explain_gemini_error
from backend.agents.critic import run_critic
from backend.agents.fallback import build_local_lesson
from backend.agents.gossip import run_gossip, gossip_reply
from backend.agents.recall import grade_recall
from backend.agents.scholar import run_scholar
from backend.agents.stylist import run_stylist
from backend.agents.themes import local_theme_for, select_theme
from backend.schemas.synapse import (
    GossipRequest,
    GossipResponse,
    GossipReplyRequest,
    GossipReplyResponse,
    LearnRequest,
    RecallRequest,
    RecallResult,
    SynapseOutputSchema,
    ThemePreviewRequest,
)


router = APIRouter(prefix="/api", tags=["learning"])

PHASES = {
    1: ("Analyzing input content and extracting core concepts...", 5),
    2: ("Invoking Theme Selector Agent to choose the visual aesthetic...", 18),
    3: ("Invoking Scholar Agent to generate academic content...", 30),
    4: ("Structuring textbook definitions and exam guidelines...", 43),
    5: ("Invoking Stylist Agent to draft 1:1 hobby analogies...", 57),
    6: ("Creating active recall questions in the analogy world...", 70),
    7: ("Invoking Critic Agent to validate the pedagogical links...", 84),
    8: ("Streaming final validated payload to workspace...", 96),
}


def require_key(header_key: str | None = None) -> str:
    """Return the API key from .env first, then the request header as fallback."""
    key = (_ENV_KEY or "").strip() or (header_key or "").strip()
    if not key:
        raise HTTPException(
            401,
            "No Gemini API key configured. Add GEMINI_API_KEY to backend/.env and restart the server.",
        )
    return key


def sse(event: str, payload: object) -> str:
    return f"event: {event}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


def phase(number: int) -> str:
    message, progress = PHASES[number]
    return sse("phase", {"phase": number, "message": message, "progress": progress})


@router.post("/validate-key")
async def validate_key(x_gemini_key: str | None = Header(default=None)) -> dict[str, object]:
    key = require_key(x_gemini_key)
    try:
        client = create_client(key)
        models = await client.aio.models.list(config={"page_size": 20})
        available_models: list[str] = []
        async for model in models:
            if model.name:
                available_models.append(model.name.removeprefix("models/"))
            if len(available_models) >= 20:
                break
        if not available_models:
            raise RuntimeError("Gemini returned no available models for this key.")
    except Exception as exc:
        status_code, detail = explain_gemini_error(exc)
        raise HTTPException(status_code, detail) from exc
    return {
        "valid": True,
        "model": MODEL,
        "modelAvailable": MODEL in available_models,
    }


@router.post("/preview-theme")
async def preview_theme(
    request: ThemePreviewRequest,
    x_gemini_key: str | None = Header(default=None),
) -> dict[str, str]:
    return {"themeId": await select_theme(request.interest, x_gemini_key)}


@router.post("/learn")
async def learn(
    request: LearnRequest,
    x_gemini_key: str | None = Header(default=None),
) -> StreamingResponse:
    key = require_key(x_gemini_key)

    async def stream() -> AsyncIterator[str]:
        theme_id = local_theme_for(request.interest)

        async def emit_result(result: SynapseOutputSchema) -> AsyncIterator[str]:
            yield phase(8)
            fields = result.model_dump(by_alias=True)
            for field in (
                "academicContent",
                "personalizedTranslation",
                "aiPersonaFeedback",
                "nextCheckinQuestion",
            ):
                words = fields[field].split(" ")
                for index in range(0, len(words), 5):
                    chunk = " ".join(words[index : index + 5])
                    if index + 5 < len(words):
                        chunk += " "
                    yield sse("field_delta", {"field": field, "text": chunk})
                    await asyncio.sleep(0.018)
            yield sse("result", fields)
            yield sse("done", {"ok": True, "progress": 100})

        try:
            yield phase(1)
            yield sse("agent_status", {"agent": "theme_selector", "status": "start"})
            yield phase(2)
            theme_id = await select_theme(request.interest, key)
            yield sse("theme", {"themeId": theme_id})
            yield sse("agent_status", {"agent": "theme_selector", "status": "done"})

            yield sse("agent_status", {"agent": "scholar", "status": "start"})
            yield phase(3)
            academic = await run_scholar(key, request)
            yield phase(4)
            yield sse("agent_status", {"agent": "scholar", "status": "done"})

            yield sse("agent_status", {"agent": "stylist", "status": "start"})
            yield phase(5)
            styled = await run_stylist(key, request, academic)
            yield phase(6)
            yield sse("agent_status", {"agent": "stylist", "status": "done"})

            yield sse("agent_status", {"agent": "critic", "status": "start"})
            yield phase(7)
            audited = await run_critic(key, request, academic, styled)
            yield sse("agent_status", {"agent": "critic", "status": "done"})

            result = SynapseOutputSchema(
                themeId=theme_id,
                academicContent=audited.academic_content,
                personalizedTranslation=audited.personalized_translation,
                aiPersonaFeedback=audited.ai_persona_feedback,
                nextCheckinQuestion=audited.next_checkin_question,
            )
            async for event in emit_result(result):
                yield event
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            status_code, message = explain_gemini_error(exc)
            if status_code in {429, 502, 503, 504}:
                for agent in ("theme_selector", "scholar", "stylist", "critic"):
                    yield sse("agent_status", {"agent": agent, "status": "done"})
                yield sse(
                    "notice",
                    {
                        "message": (
                            f"{message} Synapse completed this lesson with its local fallback mode."
                        ),
                        "code": "local_fallback",
                    },
                )
                result = build_local_lesson(request, theme_id)
                async for event in emit_result(result):
                    yield event
            else:
                yield sse("error", {"message": message})

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/recall", response_model=RecallResult)
async def recall(
    request: RecallRequest,
    x_gemini_key: str | None = Header(default=None),
) -> RecallResult:
    return await grade_recall(require_key(x_gemini_key), request)


@router.post("/gossip", response_model=GossipResponse)
async def gossip(
    request: GossipRequest,
    x_gemini_key: str | None = Header(default=None),
) -> GossipResponse:
    key = require_key(x_gemini_key)
    try:
        return await run_gossip(key, request)
    except Exception as exc:
        raise HTTPException(502, "Gossip Mode could not generate this conversation.") from exc


@router.post("/gossip-reply", response_model=GossipReplyResponse)
async def gossip_reply_endpoint(
    request: GossipReplyRequest,
    x_gemini_key: str | None = Header(default=None),
) -> GossipReplyResponse:
    """Interactive gossip chat: takes conversation history + user text, returns one AI reply."""
    key = require_key(x_gemini_key)
    try:
        return await gossip_reply(key, request)
    except Exception as exc:
        raise HTTPException(502, "Could not generate a gossip reply.") from exc
