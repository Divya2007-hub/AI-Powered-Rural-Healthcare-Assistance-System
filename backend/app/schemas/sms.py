from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class SmsInboundRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, populate_by_name=True)

    sender: str = Field(alias="from", min_length=3, max_length=40)
    body: str = Field(min_length=1, max_length=500)
    language: str = Field(default="en", min_length=2, max_length=8)


class SmsInboundResponse(BaseModel):
    reply: str
    urgency_code: Literal["low", "consult", "urgent"]
    emergency: bool
    language: str


class SmsOutboxItem(BaseModel):
    to: str
    body: str


class SmsOutboxResponse(BaseModel):
    messages: list[SmsOutboxItem]
    count: int
