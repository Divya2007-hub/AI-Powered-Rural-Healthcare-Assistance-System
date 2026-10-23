from typing import Protocol


class SmsProvider(Protocol):
    def send(self, to: str, message: str) -> None:
        """Deliver a text message to a phone number."""
