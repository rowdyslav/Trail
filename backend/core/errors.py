from fastapi import HTTPException, status
from pydantic import BaseModel


class HttpError(BaseModel):
    """Схема ошибки для OpenAPI."""

    detail: str


def ber(*errors: HTTPException) -> dict[int, dict[str, object]]:
    """Собирает OpenAPI-описание ответов из списка HTTP-ошибок."""
    return {
        error.status_code: {
            "model": HttpError,
            "description": str(error.detail),
        }
        for error in errors
    }


unauthorized_error = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Требуется авторизация",
)
invalid_credentials_error = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Неверный email или пароль",
)


user_already_exists_error = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Пользователь с таким email или username уже существует",
)

route_not_found_error = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Маршрут не найден",
)

point_not_found_error = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Точка не найдена",
)
