from __future__ import annotations

from triage_engine.advice import (
    DISCLAIMER,
    EMERGENCY_SUMMARY,
    URGENT_ADVICE,
)
from triage_engine.models import SymptomRequest, TriageAssessment, TriageResult, Urgency
from triage_engine.safety.red_flags import detect_red_flags


def _merge_flags(*groups: tuple[str, ...]) -> tuple[str, ...]:
    seen: dict[str, None] = {}
    for group in groups:
        for flag in group:
            seen.setdefault(flag, None)
    return tuple(seen)


class SafetyLayer:
    """Deterministic rules applied after the provider, before returning.

    The provider can be swapped or replaced, but these rules cannot be. Any
    emergency warning sign forces the highest urgency, and the disclaimer is
    always attached.
    """

    def apply(
        self,
        request: SymptomRequest,
        assessment: TriageAssessment,
        engine_name: str,
    ) -> TriageResult:
        red_flags = _merge_flags(
            assessment.red_flags,
            detect_red_flags(request.normalized_symptoms()),
        )
        emergency = bool(red_flags)

        if emergency:
            urgency = Urgency.URGENT
            summary = EMERGENCY_SUMMARY
            advice = URGENT_ADVICE
        else:
            urgency = assessment.urgency
            summary = assessment.summary
            advice = assessment.advice

        return TriageResult(
            urgency=urgency,
            summary=summary,
            advice=tuple(advice),
            red_flags=red_flags,
            emergency=emergency,
            engine=engine_name,
            disclaimer=DISCLAIMER,
        )
