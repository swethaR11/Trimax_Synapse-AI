from __future__ import annotations

import json
import re
from typing import Any

from pydantic import BaseModel


def extract_json(text: str) -> Any:
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        object_start = cleaned.find("{")
        array_start = cleaned.find("[")
        starts = [index for index in (object_start, array_start) if index >= 0]
        if not starts:
            raise
        start = min(starts)
        end_char = "}" if cleaned[start] == "{" else "]"
        end = cleaned.rfind(end_char)
        if end <= start:
            raise
        return json.loads(cleaned[start : end + 1])


def validate_json_model(text: str, model: type[BaseModel]) -> BaseModel:
    return model.model_validate(extract_json(text))

