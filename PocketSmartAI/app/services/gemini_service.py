import json
from typing import Any

from app.config import settings


class GeminiService:
    """Gemini integration with a deterministic local fallback."""

    def __init__(self):
        self.client = None
        if settings.gemini_api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=settings.gemini_api_key)
            except Exception:
                self.client = None

    @property
    def enabled(self) -> bool:
        return self.client is not None

    def generate(self, prompt: str, image_bytes: bytes | None = None, mime_type: str | None = None) -> str | None:
        if not self.client:
            return None

        try:
            contents: list[Any] = [prompt]
            if image_bytes and mime_type:
                from google.genai import types
                contents.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))

            response = self.client.models.generate_content(
                model=settings.gemini_model,
                contents=contents,
                config={
                    "temperature": 0.4,
                    "response_mime_type": "application/json",
                },
            )
            return response.text
        except Exception:
            return None


gemini_service = GeminiService()


def parse_json_response(text: str | None) -> dict | None:
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start >= 0 and end > start:
            try:
                return json.loads(text[start:end + 1])
            except json.JSONDecodeError:
                return None
    return None
