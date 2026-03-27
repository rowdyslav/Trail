from collections.abc import Sequence
from typing import Annotated

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class EnvSettings(BaseSettings):
    """Настройки backend, загружаемые из `.env`."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    mongo_url: str = Field(alias="MONGO_URL")
    mongo_database_name: str = Field(alias="MONGO_DATABASE_NAME")
    auth_secret: str = Field(alias="AUTH_SECRET")
    cors_allow_origins: Annotated[tuple[str, ...], NoDecode] = Field(
        alias="CORS_ALLOW_ORIGINS"
    )
    deepseek_api_key: str = Field(alias="DEEPSEEK_API_KEY")
    deepseek_model: str = Field(alias="DEEPSEEK_MODEL")
    deepseek_timeout_seconds: float = Field(alias="DEEPSEEK_TIMEOUT_SECONDS")

    @field_validator("cors_allow_origins", mode="before")
    @classmethod
    def parse_cors_allow_origins(
        cls,
        value: str | Sequence[str],
    ) -> tuple[str, ...]:
        return tuple(value.split(","))

ENV = EnvSettings()
