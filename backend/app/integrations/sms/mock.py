from dataclasses import dataclass


@dataclass(frozen=True)
class SmsMessage:
    to: str
    body: str


class MockSmsProvider:
    """In-memory SMS provider used until a real gateway is configured."""

    name = "mock"

    def __init__(self) -> None:
        self._sent: list[SmsMessage] = []

    @property
    def sent(self) -> tuple[SmsMessage, ...]:
        return tuple(self._sent)

    def send(self, to: str, message: str) -> None:
        self._sent.append(SmsMessage(to=to, body=message))

    def clear(self) -> None:
        self._sent.clear()


_provider = MockSmsProvider()


def get_sms_provider() -> MockSmsProvider:
    return _provider
