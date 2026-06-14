from __future__ import annotations

import os
from typing import Any

from google import genai


MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


def create_client(api_key: str) -> genai.Client:
    return genai.Client(api_key=api_key)


def explain_gemini_error(exc: Exception) -> tuple[int, str]:
    message = str(exc)
    lowered = message.lower()

    if "api key expired" in lowered:
        return 401, "This Gemini API key has expired. Create or renew a key in Google AI Studio."
    if "api_key_invalid" in lowered or "api key not valid" in lowered:
        return 401, "This Gemini API key is invalid. Paste a current key from Google AI Studio."
    if "generative language api has not been used" in lowered or "api has not been enabled" in lowered:
        return 403, "Enable the Generative Language API for the Google project linked to this key."
    if "permission_denied" in lowered or "permission denied" in lowered:
        return 403, "This key does not have permission to use the Gemini API."
    if "resource_exhausted" in lowered or "quota" in lowered or "rate limit" in lowered:
        return 429, "This Gemini project has reached its quota or rate limit. Try again later or use another project."
    if "not_found" in lowered and "model" in lowered:
        return 503, f"The configured Gemini model ({MODEL}) is unavailable for this key."
    if "timed out" in lowered or "timeout" in lowered:
        return 504, "Google Gemini did not respond in time. Please try again."
    return 502, "Gemini could not validate the key right now. Check the backend console for the Google API status."


async def generate_text(
    api_key: str,
    *,
    prompt: str,
    system_instruction: str,
    temperature: float = 0.4,
    json_schema: dict[str, Any] | None = None,
) -> str:
    config: dict[str, Any] = {
        "system_instruction": system_instruction,
        "temperature": temperature,
    }
    if json_schema is not None:
        config["response_mime_type"] = "application/json"
        config["response_json_schema"] = json_schema

    client = create_client(api_key)
    response = await client.aio.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=config,
    )
    if not response.text:
        raise RuntimeError("Gemini returned an empty response.")
    return response.text.strip()
