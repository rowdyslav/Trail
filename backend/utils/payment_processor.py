import uuid
from decimal import Decimal, InvalidOperation
from typing import Any

from yookassa import Configuration, Payment
from yookassa.domain.response import PaymentResponse

from env import ENV


class YooKassaClient:
    def __init__(self) -> None:
        Configuration.account_id =  ENV.yookassa_effective_account_id
        Configuration.secret_key =  ENV.yookassa_secret_key
        self.payment_api = Payment

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
    ) -> PaymentResponse:
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


class PaymentProcessor:
    def __init__(self) -> None:
        self.yookassa_client = YooKassaClient()

    @staticmethod
    def is_mock_mode() -> bool:
        account_id = ENV.yookassa_effective_account_id
        secret_key = ENV.yookassa_secret_key
        return not account_id or not secret_key or secret_key.startswith("test_")

    def process_yookassa_payment(
        self,
        amount: float | str | Decimal,
        return_url: str,
        description: str,
        order_id: str | None = None,
    ) -> dict[str, Any]:
        if self.is_mock_mode():
            return {
                "payment_id": f"mock-{uuid.uuid4()}",
                "status": "succeeded",
                "confirmation_url": return_url,
            }

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
        if payment_id.startswith("mock-"):
            return "succeeded"
        return self.yookassa_client.get_payment_status(payment_id)
