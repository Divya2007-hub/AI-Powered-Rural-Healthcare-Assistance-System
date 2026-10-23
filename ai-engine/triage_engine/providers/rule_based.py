from __future__ import annotations

from triage_engine.advice import (
    CONSULT_ADVICE,
    CONSULT_SUMMARY,
    EMERGENCY_SUMMARY,
    LOW_ADVICE,
    LOW_SUMMARY,
    URGENT_ADVICE,
)
from triage_engine.models import SymptomRequest, TriageAssessment, Urgency
from triage_engine.providers.base import TriageProvider
from triage_engine.safety.red_flags import EMERGENCY_KEYWORDS, detect_red_flags

CONSULT_SIGNS: tuple[str, ...] = (
    "fever",
    "cough",
    "cold",
    "sore throat",
    "headache",
    "body ache",
    "body pain",
    "muscle pain",
    "joint pain",
    "nausea",
    "vomiting",
    "diarrhea",
    "loose motion",
    "stomach pain",
    "abdominal pain",
    "constipation",
    "rash",
    "itching",
    "ear pain",
    "toothache",
    "back pain",
    "dizziness",
    "fatigue",
    "tiredness",
    "urinary pain",
    "burning urination",
    "eye redness",
    "swelling",
)

MILD_SIGNS: tuple[str, ...] = (
    "runny nose",
    "sneezing",
    "mild headache",
    "mild sore throat",
    "mild cough",
    "mild fatigue",
    "mild body ache",
    "common cold",
)

FEVER_KEYWORDS = ("fever", "high temperature")


def _matches(text: str, keywords: tuple[str, ...]) -> bool:
    return any(keyword in text for keyword in keywords)


class RuleBasedTriageProvider(TriageProvider):
    """Deterministic, dependency-free triage provider.

    It maps plain symptom text to an urgency level. It never names a disease
    and never recommends a medicine. Unknown input always leans towards a
    medical consultation rather than low urgency.
    """

    name = "rule-based-v1"

    def assess(self, request: SymptomRequest) -> TriageAssessment:
        symptoms = request.normalized_symptoms()

        red_flags = detect_red_flags(symptoms)

        recognized = False
        consult_match = False
        mild_match = False

        for symptom in symptoms:
            if _matches(symptom, EMERGENCY_KEYWORDS):
                recognized = True
            if _matches(symptom, CONSULT_SIGNS):
                consult_match = True
                recognized = True
            if _matches(symptom, MILD_SIGNS):
                mild_match = True
                recognized = True

        has_fever = any(_matches(symptom, FEVER_KEYWORDS) for symptom in symptoms)
        age_is_vulnerable = request.age_years is not None and (
            request.age_years < 1 or request.age_years >= 65
        )
        long_lasting = request.duration_days is not None and request.duration_days >= 7
        unknown_symptoms = not recognized or any(
            not _matches(symptom, CONSULT_SIGNS)
            and not _matches(symptom, MILD_SIGNS)
            and not _matches(symptom, EMERGENCY_KEYWORDS)
            for symptom in symptoms
        )

        if red_flags:
            return TriageAssessment(
                urgency=Urgency.URGENT,
                summary=EMERGENCY_SUMMARY,
                advice=URGENT_ADVICE,
                red_flags=red_flags,
            )

        if consult_match or unknown_symptoms or long_lasting or (age_is_vulnerable and has_fever):
            return TriageAssessment(
                urgency=Urgency.CONSULT,
                summary=CONSULT_SUMMARY,
                advice=CONSULT_ADVICE,
            )

        if mild_match and not consult_match:
            return TriageAssessment(
                urgency=Urgency.LOW,
                summary=LOW_SUMMARY,
                advice=LOW_ADVICE,
            )

        return TriageAssessment(
            urgency=Urgency.CONSULT,
            summary=(
                "There is not enough information to judge how serious these symptoms are. "
                "A medical consultation is recommended."
            ),
            advice=CONSULT_ADVICE,
        )
