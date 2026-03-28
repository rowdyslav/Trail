import uuid
from decimal import Decimal, InvalidOperation
from typing import Any

from env import ENV


def _load_yookassa() -> tuple[Any, Any]:
    try:
        from yookassa import Configuration, Payment
    except ModuleNotFoundError as error:
        raise RuntimeError(
            "YooKassa dependency is not installed. Add the 'yookassa' package first."
        ) from error
    return Configuration, Payment


class YooKassaClient:
    def __init__(self) -> None:
        account_id = ENV.yookassa_effective_account_id
        secret_key = ENV.yookassa_secret_key
        if not account_id or not secret_key:
            raise ValueError(
                "Missing YOOKASSA_ACCOUNT_ID/YOOKASSA_SHOP_ID or YOOKASSA_SECRET_KEY in environment"
            )

        configuration, payment = _load_yookassa()
        configuration.account_id = account_id
        configuration.secret_key = secret_key
        self.payment_api = payment

    @staticmethod
    def _normalize_amount(amount: float | str | Decimal) -> str:
        try:
            normalized = Decimal(str(amount)).quantize(Decimal("0.01"))
        except (InvalidOperation, ValueError) as error:
            raise ValueError("Payment amount must be numeric") from error

        if normalized <= 0:
            raise ValueError("Payment amount must be greater than 0")

        return f"{normalized:.2f}"

    def create_payment(
        self,
        amount: float | str | Decimal,
        return_url: str,
        description: str,
        order_id: str | None = None,
    ) -> Any:
        payment_data = {
            "amount": {
                "value": self._normalize_amount(amount),
                "currency": "RUB",
            },
            "confirmation": {
                "type": "redirect",
                "return_url": return_url,
            },
            "capture": True,
            "description": description,
            "metadata": {
                "order_id": order_id or str(uuid.uuid4()),
                "source": "backend",
            },
        }

        return self.payment_api.create(payment_data, str(uuid.uuid4()))

    def get_payment_status(self, payment_id: str) -> str:
        payment = self.payment_api.find_one(payment_id)
        return payment.status

    def get_payment(self, payment_id: str) -> Any:
        return self.payment_api.find_one(payment_id)


class PaymentProcessor:
    def __init__(self) -> None:
        self.yookassa_client = YooKassaClient()

    def process_yookassa_payment(
        self,
        amount: float | str | Decimal,
        return_url: str,
        description: str,
        order_id: str | None = None,
    ) -> dict[str, Any]:
        payment = self.yookassa_client.create_payment(
            amount=amount,
            return_url=return_url,
            description=description,
            order_id=order_id,
        )

        return {
            "payment_id": payment.id,
            "status": payment.status,
            "confirmation_url": payment.confirmation.confirmation_url,
        }

    def get_yookassa_payment_status(self, payment_id: str) -> str:
        return self.yookassa_client.get_payment_status(payment_id)
