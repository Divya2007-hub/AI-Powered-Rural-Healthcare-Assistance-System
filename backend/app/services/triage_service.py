from triage_engine import SymptomRequest, TriageEngine, get_engine

from app.schemas.triage import TriageRequest, TriageResponse


class TriageService:
    """Business layer for symptom triage.

    It translates between the API schema and the standalone triage engine. All
    safety rules live in the engine, not here.
    """

    def __init__(self, engine: TriageEngine | None = None) -> None:
        self._engine = engine or get_engine()

    def assess(self, payload: TriageRequest) -> TriageResponse:
        result = self._engine.assess(
            SymptomRequest(
                symptoms=tuple(payload.symptoms),
                duration_days=payload.duration_days,
                age_years=payload.age_years,
                language=payload.language,
            )
        )
        return TriageResponse(
            urgency=result.urgency.value,
            urgency_code=result.urgency_code,
            emergency=result.emergency,
            red_flags=list(result.red_flags),
            summary=result.summary,
            advice=list(result.advice),
            disclaimer=result.disclaimer,
            engine=result.engine,
        )
