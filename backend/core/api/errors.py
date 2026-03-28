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
place_not_in_active_route_error = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Place does not belong to the active route",
)
prize_not_found_error = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Prize not found or inactive",
)
code_not_found_error = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Code not found",
)
code_not_active_error = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Code is not active",
)
code_expired_error = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Code is expired",
)
code_generation_error = HTTPException(
    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
    detail="Could not generate code",
)
insufficient_reward_points_error = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Insufficient reward_points",
)
admin_inactive_error = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Admin is inactive",
)
route_not_purchased_error = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Route is not purchased",
)
route_already_completed_error = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Route is already completed",
)
route_not_active_error = HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Active route not found",
)
active_route_not_selected_error = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="No active route selected",
)
payment_not_confirmed_error = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Payment is not confirmed yet",
)
payment_failed_error = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Payment failed or was cancelled",
)
route_not_available_for_purchase_error = HTTPException(
    status_code=status.HTTP_409_CONFLICT,
    detail="Only paid routes can be purchased",
)
