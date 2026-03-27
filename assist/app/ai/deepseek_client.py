import asyncio
import json
from typing import TypedDict

import requests
import uplink

from ..config import get_settings


class ChatMessage(TypedDict):
    role: str
    content: str


class ChatCompletionPayload(TypedDict):
    model: str
    messages: list[ChatMessage]
    stream: bool


@uplink.timeout((5, 30))
@uplink.headers({"Content-Type": "application/json"})
class DeepSeekAPI(uplink.Consumer):
    @uplink.json
    @uplink.post("chat/completions")
    def create_chat_completion(self, payload: uplink.Body) -> requests.Response:
        """Create a DeepSeek chat completion."""


class DeepSeekClient:
    BASE_URL = "https://api.deepseek.com/v1/"

    def __init__(self, api_key: str | None = None, model: str | None = None) -> None:
        current_settings = get_settings()
        self.api_key = api_key or current_settings.deepseek_api_key
        self.model = model or current_settings.deepseek_model

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def _generate_text_sync(self, system_prompt: str, user_prompt: str) -> str:
        if not self.api_key:
            raise RuntimeError("DEEPSEEK_API_KEY is not configured")

        payload: ChatCompletionPayload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "stream": False,
        }

        with requests.Session() as session:
            session.headers.update(
                {
                    "Authorization": f"Bearer {self.api_key}",
                    "Accept": "application/json",
                }
            )
            api = DeepSeekAPI(base_url=self.BASE_URL, client=session)
            try:
                response = api.create_chat_completion(payload)
            except Exception as exc:
                raise RuntimeError(f"DeepSeek request failed: {type(exc).__name__}: {exc}") from exc

        status_code = getattr(response, "status_code", None)
        raw_text = getattr(response, "text", "")

        if status_code != 200:
            detail = raw_text.strip()
            try:
                detail_json = response.json()
                detail = json.dumps(detail_json, ensure_ascii=False)
            except Exception:
                pass
            raise RuntimeError(f"DeepSeek HTTP {status_code}: {detail}")

        try:
            response_json = response.json()
        except Exception as exc:
            raise ValueError(f"DeepSeek returned invalid JSON: {raw_text[:500]}") from exc

        if response_json.get("error"):
            raise ValueError(f"DeepSeek error: {json.dumps(response_json['error'], ensure_ascii=False)}")

        choices = response_json.get("choices", [])
        if not choices:
            raise ValueError(f"DeepSeek returned no choices: {json.dumps(response_json, ensure_ascii=False)}")

        content = choices[0].get("message", {}).get("content", "") or ""
        return " ".join(content.split())

    async def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        timeout: float | None = None,
    ) -> str:
        current_settings = get_settings()
        effective_timeout = timeout or current_settings.deepseek_timeout_seconds
        return await asyncio.wait_for(
            asyncio.to_thread(self._generate_text_sync, system_prompt, user_prompt),
            timeout=effective_timeout,
        )
