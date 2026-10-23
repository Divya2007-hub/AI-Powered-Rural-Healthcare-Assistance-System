from __future__ import annotations

from abc import ABC, abstractmethod

from triage_engine.models import SymptomRequest, TriageAssessment


class TriageProvider(ABC):
    """Interface every triage provider must implement.

    Providers only produce a raw assessment. The deterministic safety layer
    always sits between the provider and the caller and may override it.
    """

    name: str = "base"

    @abstractmethod
    def assess(self, request: SymptomRequest) -> TriageAssessment:
        raise NotImplementedError
