from typing import Optional

from app.ai.deepseek_client import DeepSeekClient
from app.config import get_settings


def _streak_system_prompt() -> str:
    return (
        "Ты генерируешь одну короткую реплику аватара-гриба-путешественника для события серии посещений. "
        "Пиши только по-русски. Реплика должна коротко поддерживать пользователя. "
        "Без фактов о месте, без длинных образов. "
        "Стиль живой, уверенный, не кринжовый, не детский, максимум одно предложение."
    )


def _streak_user_prompt(extra_context: Optional[str] = None) -> str:
    prompt = ["Событие: серия. Нужна короткая реакция в духе 'так держать', 'хороший темп', 'продолжай'."]
    if extra_context and extra_context.strip():
        prompt.append(f"Контекст: {extra_context.strip()}")
    prompt.append("Сгенерируй одну короткую реплику именно про действие пользователя.")
    return "\n".join(prompt)


async def generate_streak_message(
    extra_context: Optional[str] = None,
    client: Optional[DeepSeekClient] = None,
) -> str:
    deepseek = client or DeepSeekClient()
    if not deepseek.is_configured():
        raise RuntimeError("DeepSeek is not configured")

    settings = get_settings()
    text = await deepseek.generate_text(
        _streak_system_prompt(),
        _streak_user_prompt(extra_context),
        timeout=settings.deepseek_timeout_seconds,
    )

    cleaned = " ".join(text.split())
    if not cleaned:
        raise ValueError("DeepSeek returned empty streak reaction")
    return cleaned
