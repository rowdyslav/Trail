import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"

# Always load the project .env, regardless of current working directory.
load_dotenv(dotenv_path=ENV_FILE, override=True)


@dataclass(frozen=True)
class Settings:
    deepseek_api_key: str
    deepseek_model: str
    deepseek_timeout_seconds: float


def get_settings() -> Settings:
    load_dotenv(dotenv_path=ENV_FILE, override=True)
    return Settings(
        deepseek_api_key=os.getenv("DEEPSEEK_API_KEY", "").strip(),
        deepseek_model=os.getenv("DEEPSEEK_MODEL", "deepseek-chat").strip(),
        deepseek_timeout_seconds=float(os.getenv("DEEPSEEK_TIMEOUT_SECONDS", "12")),
    )


settings = get_settings()
