from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class Urgency(str, Enum):
    LOW = "Low Urgency"
    CONSULT = "Medical Consultation Recommended"
    URGENT = "Urgent Care Required"

    @property
    def code(self) -> str:
        if self is Urgency.LOW:
            return "low"
        if self is Urgency.URGENT:
            return "urgent"
        return "consult"


@dataclass(frozen=True)
class SymptomRequest:
    symptoms: tuple[str, ...]
    duration_days: int | None = None
    age_years: int | None = None
    language: str = "en"

    def normalized_symptoms(self) -> tuple[str, ...]:
        return tuple(s.strip().lower() for s in self.symptoms if s.strip())


@dataclass(frozen=True)
class TriageAssessment:
    urgency: Urgency
    summary: str
    advice: tuple[str, ...]
    red_flags: tuple[str, ...] = ()


@dataclass(frozen=True)
class TriageResult:
    urgency: Urgency
    summary: str
    advice: tuple[str, ...]
    red_flags: tuple[str, ...]
    emergency: bool
    engine: str
    disclaimer: str

    @property
    def urgency_code(self) -> str:
        return self.urgency.code
