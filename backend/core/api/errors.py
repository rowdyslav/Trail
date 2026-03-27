from fastapi import HTTPException, status
from pydantic import BaseModel


class HttpError(BaseModel):
    detail: str


def ber(*errors: HTTPException) -> dict[int, dict[str, object]]:
    return {
        error.status_code: {
            "model": HttpError,
            "description": str(error.detail),
        }
        for error in errors
    }


unauthorized_error = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Authorization required",
)
invalid_credentials_error = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid email or password",
)
user_already_exists_error = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="User with this email already exists",
)
route_not_found_error = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Route not found",
)
place_not_found_error = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Place not found",
)
prize_not_found_error = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Prize not found or inactive",
)
redemption_code_not_found_error = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Redemption code not found",
)
redemption_code_not_active_error = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Redemption code is not active",
)
redemption_code_expired_error = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Redemption code is expired",
)
redemption_code_generation_error = HTTPException(
    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    detail="Could not generate redemption code",
)
insufficient_reward_points_error = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Insufficient reward_points",
)
admin_inactive_error = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Admin is inactive",
)
