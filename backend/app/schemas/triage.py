from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TriageRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    symptoms: list[str] = Field(
        min_length=1,
        max_length=20,
        examples=[["fever", "cough"]],
        description="Symptoms or short symptom phrases reported by the user.",
    )
    duration_days: int | None = Field(default=None, ge=0, le=365)
    age_years: int | None = Field(default=None, ge=0, le=120)
    language: str = Field(default="en", min_length=2, max_length=8)

    @field_validator("symptoms")
    @classmethod
    def clean_symptoms(cls, value: list[str]) -> list[str]:
        cleaned = [symptom.strip() for symptom in value if symptom and symptom.strip()]
        if not cleaned:
            raise ValueError("At least one non-empty symptom is required.")
        if any(len(symptom) > 200 for symptom in cleaned):
            raise ValueError("Each symptom must be 200 characters or fewer.")
        return cleaned


class TriageResponse(BaseModel):
    urgency: str
    urgency_code: Literal["low", "consult", "urgent"]
    emergency: bool
    red_flags: list[str]
    summary: str
    advice: list[str]
    disclaimer: str
    engine: str
