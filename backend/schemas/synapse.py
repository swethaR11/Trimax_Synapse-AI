from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


Level = Literal["Beginner", "Intermediate", "Advanced"]
GossipLevel = Literal["EASY", "INTERMEDIATE", "HARD"]


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=12_000)


class LearnRequest(BaseModel):
    topic: str = Field(default="", max_length=300)
    content: str = Field(default="", max_length=80_000)
    interest: str = Field(min_length=1, max_length=200)
    level: Level = "Beginner"
    chat_history: list[ChatMessage] = Field(default_factory=list, max_length=20)

    @model_validator(mode="after")
    def require_source(self) -> "LearnRequest":
        if not self.topic.strip() and not self.content.strip():
            raise ValueError("Provide a topic or source content.")
        return self

    @property
    def source(self) -> str:
        return self.content.strip() or self.topic.strip()


class ThemePreviewRequest(BaseModel):
    interest: str = Field(min_length=1, max_length=200)


class SynapseOutputSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    theme_id: str = Field(alias="themeId")
    academic_content: str = Field(alias="academicContent")
    personalized_translation: str = Field(alias="personalizedTranslation")
    ai_persona_feedback: str = Field(alias="aiPersonaFeedback")
    next_checkin_question: str = Field(alias="nextCheckinQuestion")


class StylistOutput(BaseModel):
    personalized_translation: str = Field(alias="personalizedTranslation")
    next_checkin_question: str = Field(alias="nextCheckinQuestion")


class CriticOutput(BaseModel):
    passed: bool
    audit: list[str] = Field(default_factory=list)
    academic_content: str = Field(alias="academicContent")
    personalized_translation: str = Field(alias="personalizedTranslation")
    next_checkin_question: str = Field(alias="nextCheckinQuestion")
    ai_persona_feedback: str = Field(alias="aiPersonaFeedback")


class RecallRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=300)
    interest: str = Field(min_length=1, max_length=200)
    question: str = Field(min_length=1, max_length=2_000)
    answer: str = Field(min_length=1, max_length=4_000)
    academic_content: str = Field(min_length=1, max_length=20_000)


class RecallResult(BaseModel):
    result: Literal["correct", "partial", "incorrect"]
    feedback: str
    hint: str = ""
    xp: Literal[0, 5, 10]


class TaggedReply(BaseModel):
    ref_id: int = Field(ge=1)
    preview: str = Field(min_length=1, max_length=80)


class GossipMessage(BaseModel):
    id: int = Field(ge=1)
    role: Literal["sender", "receiver"]
    name: str = Field(min_length=1, max_length=60)
    text: str = Field(min_length=1, max_length=500)
    time: str = Field(pattern=r"^\d{1,2}:\d{2} (AM|PM)$")
    tagged: TaggedReply | None = None
    read: bool
    correction: Literal["wrong", "correct", "none"] = "none"


class GossipRequest(BaseModel):
    content: str = Field(min_length=1, max_length=50_000)
    gossip_level: GossipLevel = "EASY"


class GossipResponse(BaseModel):
    messages: list[GossipMessage]

    @field_validator("messages")
    @classmethod
    def validate_conversation(cls, messages: list[GossipMessage]) -> list[GossipMessage]:
        ids = [message.id for message in messages]
        if ids != list(range(1, len(messages) + 1)):
            raise ValueError("Message IDs must be sequential and 1-indexed.")
        by_id = {message.id: message for message in messages}
        tagged_count = 0
        for message in messages:
            if message.tagged:
                tagged_count += 1
                if message.tagged.ref_id >= message.id or message.tagged.ref_id not in by_id:
                    raise ValueError("Tagged replies must reference an earlier message.")
            if message.correction == "correct" and message.tagged is None:
                raise ValueError("Correction messages must tag the incorrect message.")
            if message.role == "sender" and not message.read:
                raise ValueError("Sender messages must be marked read.")
        if tagged_count > 3:
            raise ValueError("A conversation may contain at most three tagged replies.")
        return messages


class GossipReplyRequest(BaseModel):
    """Request for the interactive gossip-chat endpoint."""

    history: list[GossipMessage] = Field(default_factory=list, max_length=60)
    user_text: str = Field(min_length=1, max_length=1_000)
    next_id: int = Field(ge=1)


class GossipReplyResponse(BaseModel):
    """Single AI reply message returned to the gossip chat."""

    message: GossipMessage

