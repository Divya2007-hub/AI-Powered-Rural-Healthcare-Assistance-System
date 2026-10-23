from __future__ import annotations

from triage_engine.advice import CONSULT_ADVICE, FALLBACK_SUMMARY
from triage_engine.models import SymptomRequest, TriageAssessment, TriageResult, Urgency
from triage_engine.providers.base import TriageProvider
from triage_engine.providers.rule_based import RuleBasedTriageProvider
from triage_engine.safety.guardrails import SafetyLayer


class TriageEngine:
    """Turns a symptom request into a safe triage result.

    The engine keeps the provider and the safety layer separate. A provider
    failure never propagates to the caller: it becomes a recommendation to
    consult a medical professional.
    """

    def __init__(
        self,
        provider: TriageProvider | None = None,
        safety: SafetyLayer | None = None,
    ) -> None:
        self._provider = provider or RuleBasedTriageProvider()
        self._safety = safety or SafetyLayer()

    @property
    def provider_name(self) -> str:
        return self._provider.name

    def assess(self, request: SymptomRequest) -> TriageResult:
        try:
            assessment = self._provider.assess(request)
        except Exception:  # noqa: BLE001 - a provider failure must stay safe
            assessment = TriageAssessment(
                urgency=Urgency.CONSULT,
                summary=FALLBACK_SUMMARY,
                advice=CONSULT_ADVICE,
            )

        return self._safety.apply(request, assessment, self.provider_name)


_default_engine: TriageEngine | None = None


def get_engine() -> TriageEngine:
    """Return the shared engine instance."""

    global _default_engine
    if _default_engine is None:
        _default_engine = TriageEngine()
    return _default_engine
