from triage_engine.advice import DISCLAIMER
from triage_engine.engine import TriageEngine
from triage_engine.models import SymptomRequest, TriageAssessment, Urgency
from triage_engine.providers.base import TriageProvider
from triage_engine.safety.red_flags import detect_red_flags


def make_request(**overrides) -> SymptomRequest:
    data = {"symptoms": ("fever", "cough")}
    data.update(overrides)
    return SymptomRequest(**data)


def test_red_flag_detection_is_independent_of_provider() -> None:
    assert detect_red_flags(("I have chest pain",)) == ("Chest pain or pressure",)


def test_emergency_symptom_is_urgent() -> None:
    result = TriageEngine().assess(make_request(symptoms=("chest pain",)))

    assert result.urgency is Urgency.URGENT
    assert result.urgency_code == "urgent"
    assert result.emergency is True
    assert "Chest pain or pressure" in result.red_flags


def test_emergency_overrides_a_provider_that_returns_low() -> None:
    class LowProvider(TriageProvider):
        name = "always-low"

        def assess(self, request: SymptomRequest) -> TriageAssessment:
            return TriageAssessment(Urgency.LOW, "Looks mild.", ("Rest.",))

    result = TriageEngine(provider=LowProvider()).assess(
        make_request(symptoms=("shortness of breath",))
    )

    assert result.urgency is Urgency.URGENT
    assert result.emergency is True


def test_unknown_symptom_defaults_to_consultation() -> None:
    result = TriageEngine().assess(make_request(symptoms=("a strange feeling",)))

    assert result.urgency is Urgency.CONSULT
    assert result.emergency is False


def test_mild_symptom_is_low_urgency() -> None:
    result = TriageEngine().assess(make_request(symptoms=("runny nose",)))

    assert result.urgency is Urgency.LOW
    assert result.urgency_code == "low"


def test_long_lasting_symptom_recommends_consultation() -> None:
    result = TriageEngine().assess(make_request(symptoms=("runny nose",), duration_days=10))

    assert result.urgency is Urgency.CONSULT


def test_vulnerable_age_with_fever_recommends_consultation() -> None:
    result = TriageEngine().assess(make_request(symptoms=("fever",), age_years=80))

    assert result.urgency is Urgency.CONSULT


def test_provider_failure_defaults_to_consultation() -> None:
    class BrokenProvider(TriageProvider):
        name = "broken"

        def assess(self, request: SymptomRequest) -> TriageAssessment:
            raise RuntimeError("provider unavailable")

    result = TriageEngine(provider=BrokenProvider()).assess(make_request())

    assert result.urgency is Urgency.CONSULT
    assert result.emergency is False
    assert result.engine == "broken"


def test_disclaimer_is_always_attached() -> None:
    result = TriageEngine().assess(make_request())

    assert result.disclaimer == DISCLAIMER
