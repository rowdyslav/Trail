from __future__ import annotations

from .deepseek_client import DeepSeekClient


REACTION_STYLE_GUIDE = (
    "Write exactly one short reaction in Russian. "
    "Keep it warm, lively, and concise. "
    "Do not use lists, markdown, quotes, emojis, or explanations."
)


def normalize_text(text: str) -> str:
    return " ".join(text.split())


def build_context_prompt(
    event_description: str,
    generation_instruction: str,
    extra_context: str | None = None,
) -> str:
    prompt_parts = [event_description, generation_instruction]
    if extra_context and extra_context.strip():
        prompt_parts.append(f"Дополнительный контекст: {extra_context.strip()}")
    return "\n".join(prompt_parts)


async def generate_reaction_message(
    system_prompt: str,
    user_prompt: str,
    empty_error: str,
    client: DeepSeekClient | None = None,
) -> str:
    deepseek_client = client or DeepSeekClient()
    generated_text = await deepseek_client.generate_text(system_prompt, user_prompt)
    normalized_text = normalize_text(generated_text)

    if not normalized_text:
        raise ValueError(empty_error)

    return normalized_text
