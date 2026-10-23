"""Golden cases used to evaluate triage quality.

Each case states the urgency code a safe first-level triage system should
return. The dataset is intentionally small and hand-checked: it is a regression
and research baseline, not a clinical validation set.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class EvalCase:
    case_id: str
    symptoms: tuple[str, ...]
    expected_code: str
    expected_emergency: bool = False
    expected_red_flag: str | None = None
    language: str = "en"
    age_years: int | None = None
    duration_days: int | None = None
    note: str = ""


DEFAULT_CASES: tuple[EvalCase, ...] = (
    EvalCase("low-runny-nose", ("runny nose",), "low"),
    EvalCase("low-sneezing", ("sneezing",), "low"),
    EvalCase("low-cold-combo", ("runny nose", "sneezing"), "low"),
    EvalCase("consult-fever", ("fever",), "consult"),
    EvalCase("consult-cough", ("cough",), "consult"),
    EvalCase("consult-sore-throat", ("sore throat",), "consult"),
    EvalCase("consult-headache", ("headache",), "consult"),
    EvalCase("consult-body-ache", ("body ache",), "consult"),
    EvalCase("consult-nausea", ("nausea",), "consult"),
    EvalCase("consult-vomiting", ("vomiting",), "consult"),
    EvalCase("consult-diarrhea", ("diarrhea",), "consult"),
    EvalCase("consult-stomach-pain", ("stomach pain",), "consult"),
    EvalCase("consult-rash", ("rash",), "consult"),
    EvalCase("consult-ear-pain", ("ear pain",), "consult"),
    EvalCase("consult-toothache", ("toothache",), "consult"),
    EvalCase("consult-back-pain", ("back pain",), "consult"),
    EvalCase("consult-dizziness", ("dizziness",), "consult"),
    EvalCase("consult-urinary-pain", ("urinary pain",), "consult"),
    EvalCase("consult-eye-redness", ("eye redness",), "consult"),
    EvalCase("consult-swelling", ("swelling",), "consult"),
    EvalCase("consult-fever-cough", ("fever", "cough"), "consult"),
    EvalCase(
        "consult-unknown-symptom",
        ("a strange feeling",),
        "consult",
        note="Unknown input must lean towards consultation.",
    ),
    EvalCase(
        "consult-long-lasting",
        ("runny nose",),
        "consult",
        duration_days=10,
        note="A mild symptom lasting a week or more needs review.",
    ),
    EvalCase(
        "consult-older-adult-fever",
        ("fever",),
        "consult",
        age_years=80,
        note="Vulnerable age with fever needs review.",
    ),
    EvalCase(
        "consult-infant-fever",
        ("fever",),
        "consult",
        age_years=1,
        note="Infants under one year with fever need review.",
    ),
    EvalCase(
        "urgent-chest-pain",
        ("chest pain",),
        "urgent",
        expected_emergency=True,
        expected_red_flag="Chest pain or pressure",
    ),
    EvalCase(
        "urgent-breathing",
        ("shortness of breath",),
        "urgent",
        expected_emergency=True,
        expected_red_flag="Severe breathing difficulty",
    ),
    EvalCase(
        "urgent-unconscious",
        ("unconscious",),
        "urgent",
        expected_emergency=True,
        expected_red_flag="Loss of consciousness",
    ),
    EvalCase(
        "urgent-seizure",
        ("seizure",),
        "urgent",
        expected_emergency=True,
        expected_red_flag="Seizure",
    ),
    EvalCase(
        "urgent-stroke",
        ("slurred speech",),
        "urgent",
        expected_emergency=True,
        expected_red_flag="Signs of stroke",
    ),
    EvalCase(
        "urgent-bleeding",
        ("severe bleeding",),
        "urgent",
        expected_emergency=True,
        expected_red_flag="Severe bleeding",
    ),
    EvalCase(
        "urgent-vomiting-blood",
        ("vomiting blood",),
        "urgent",
        expected_emergency=True,
        expected_red_flag="Vomiting or coughing blood",
    ),
    EvalCase(
        "urgent-confusion",
        ("confusion",),
        "urgent",
        expected_emergency=True,
        expected_red_flag="Confusion or extreme drowsiness",
    ),
    EvalCase(
        "urgent-suicidal",
        ("suicidal thoughts",),
        "urgent",
        expected_emergency=True,
        expected_red_flag="Suicidal thoughts",
    ),
    EvalCase(
        "urgent-overdose",
        ("overdose",),
        "urgent",
        expected_emergency=True,
        expected_red_flag="Poisoning or overdose",
    ),
    EvalCase(
        "urgent-allergic-reaction",
        ("throat swelling",),
        "urgent",
        expected_emergency=True,
        expected_red_flag="Severe allergic reaction",
    ),
    EvalCase(
        "urgent-hidden-red-flag",
        ("mild cough", "chest tightness"),
        "urgent",
        expected_emergency=True,
        expected_red_flag="Chest pain or pressure",
        note="Safety rules must override a mild-looking combination.",
    ),
    EvalCase(
        "hindi-fever",
        ("fever",),
        "consult",
        language="hi",
    ),
    EvalCase(
        "hindi-chest-pain",
        ("chest pain",),
        "urgent",
        expected_emergency=True,
        expected_red_flag="छाती में दर्द या दबाव",
        language="hi",
    ),
    EvalCase(
        "kannada-diarrhea",
        ("diarrhea",),
        "consult",
        language="kn",
    ),
    EvalCase(
        "tamil-runny-nose",
        ("runny nose",),
        "low",
        language="ta",
    ),
    EvalCase(
        "telugu-fever",
        ("fever",),
        "consult",
        language="te",
    ),
    EvalCase(
        "marathi-stroke",
        ("slurred speech",),
        "urgent",
        expected_emergency=True,
        expected_red_flag="स्ट्रोकची चिन्हे",
        language="mr",
    ),
    EvalCase(
        "unsupported-language-fallback",
        ("fever",),
        "consult",
        language="fr",
        note="Unsupported languages must fall back to English.",
    ),
)
