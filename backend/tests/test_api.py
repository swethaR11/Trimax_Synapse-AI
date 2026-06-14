from fastapi.testclient import TestClient

from backend.agents.client import explain_gemini_error
from backend.agents.fallback import build_local_lesson
from backend.agents.gossip import fallback_gossip
from backend.agents.themes import local_theme_for
from backend.main import app
from backend.schemas.synapse import GossipRequest


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_theme_fallbacks() -> None:
    assert local_theme_for("I love cricket") == "cricket-sports"
    assert local_theme_for("high fashion and runway design") == "high-fashion"
    assert local_theme_for("something completely unexpected") == "slate-tech"


def test_learn_requires_key(monkeypatch) -> None:
    monkeypatch.setattr("backend.routes.learn._ENV_KEY", "")
    response = client.post(
        "/api/learn",
        json={
            "topic": "Recursion",
            "content": "",
            "interest": "chess",
            "level": "Beginner",
            "chat_history": [],
        },
    )
    assert response.status_code == 401


def test_gossip_fallback_is_valid_for_every_level() -> None:
    for level, expected_wrong in (("EASY", 1), ("INTERMEDIATE", 2), ("HARD", 2)):
        response = fallback_gossip(
            GossipRequest(
                content="Recursion repeats a rule until a base case stops the process.",
                gossip_level=level,
            )
        )
        assert sum(message.correction == "wrong" for message in response.messages) == expected_wrong
        assert sum(message.correction == "correct" for message in response.messages) == expected_wrong
        assert sum(message.tagged is not None for message in response.messages) <= 3


def test_gemini_error_messages_are_actionable() -> None:
    status, message = explain_gemini_error(Exception("400 API key expired. Please renew the API key."))
    assert status == 401
    assert "expired" in message.lower()

    status, message = explain_gemini_error(Exception("429 RESOURCE_EXHAUSTED quota exceeded"))
    assert status == 429
    assert "quota" in message.lower()


def test_local_lesson_fallback_is_complete() -> None:
    request = {
        "topic": "Recursion",
        "content": "",
        "interest": "Formula 1",
        "level": "Beginner",
        "chat_history": [],
    }
    from backend.schemas.synapse import LearnRequest

    result = build_local_lesson(LearnRequest.model_validate(request), "formula1-racing")
    assert result.theme_id == "formula1-racing"
    assert "Recursion" in result.academic_content
    assert "Formula 1" in result.personalized_translation
    assert result.next_checkin_question


def test_learn_stream_falls_back_on_quota(monkeypatch) -> None:
    async def fake_select_theme(interest: str, api_key: str | None = None) -> str:
        return "formula1-racing"

    async def quota_failure(*args, **kwargs):
        raise RuntimeError("429 RESOURCE_EXHAUSTED quota exceeded")

    async def no_delay(*args, **kwargs):
        return None

    monkeypatch.setattr("backend.routes.learn.select_theme", fake_select_theme)
    monkeypatch.setattr("backend.routes.learn.run_scholar", quota_failure)
    monkeypatch.setattr("backend.routes.learn.asyncio.sleep", no_delay)

    response = client.post(
        "/api/learn",
        headers={"X-Gemini-Key": "test-key"},
        json={
            "topic": "Recursion",
            "content": "",
            "interest": "Formula 1",
            "level": "Beginner",
            "chat_history": [],
        },
    )

    assert response.status_code == 200
    assert "event: notice" in response.text
    assert "local fallback mode" in response.text
    assert "event: result" in response.text
    assert "event: error" not in response.text
