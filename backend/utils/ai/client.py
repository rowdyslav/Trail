from __future__ import annotations

from typing import Any

import httpx

from env import ENV


class DeepSeekClient:
    BASE_URL = "https://api.deepseek.com/v1"

    def __init__(
        self,
        *,
        api_key: str | None = None,
        model: str | None = None,
        timeout_seconds: float | None = None,
    ) -> None:
        self.api_key = api_key or ENV.deepseek_api_key
        self.model = model or ENV.deepseek_model
        self.timeout_seconds = timeout_seconds or ENV.deepseek_timeout_seconds

    def is_configured(self) -> bool:
        return bool(self.api_key)

    async def generate_text(self, *, system_prompt: str, user_prompt: str) -> str:
        if not self.api_key:
            raise RuntimeError("DEEPSEEK_API_KEY is not configured")

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "stream": False,
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json",
        }

        async with httpx.AsyncClient(
            base_url=self.BASE_URL,
            headers=headers,
            timeout=self.timeout_seconds,
        ) as client:
            try:
                response = await client.post("/chat/completions", json=payload)
            except httpx.HTTPError as error:
                raise RuntimeError(
                    f"DeepSeek request failed: {type(error).__name__}: {error}"
                ) from error

        if response.status_code != 200:
            detail = response.text.strip()
            try:
                detail = response.text if not response.text else str(response.json())
            except Exception:
                pass
            raise RuntimeError(f"DeepSeek HTTP {response.status_code}: {detail}")

        try:
            response_json: dict[str, Any] = response.json()
        except Exception as error:
            raise ValueError(
                f"DeepSeek returned invalid JSON: {response.text[:500]}"
            ) from error

        if response_json.get("error"):
            raise ValueError(f"DeepSeek error: {response_json['error']}")

        choices = response_json.get("choices", [])
        if not choices:
            raise ValueError("DeepSeek returned no choices")

        content = choices[0].get("message", {}).get("content", "") or ""
        return " ".join(content.split())
