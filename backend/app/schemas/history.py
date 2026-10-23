from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TriageHistoryResponse(BaseModel):
    id: int
    symptoms: list[str]
    duration_days: int | None = None
    age_years: int | None = None
    language: str
    urgency: str
    urgency_code: str
    emergency: bool
    red_flags: list[str]
    summary: str
    advice: list[str]
    disclaimer: str
    engine: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TriageHistoryListResponse(BaseModel):
    history: list[TriageHistoryResponse]
    count: int
