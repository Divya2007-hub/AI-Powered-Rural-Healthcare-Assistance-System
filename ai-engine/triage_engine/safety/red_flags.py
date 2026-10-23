from __future__ import annotations

EMERGENCY_SIGNS: dict[str, tuple[str, ...]] = {
    "Chest pain or pressure": ("chest pain", "chest tightness", "pressure in the chest"),
    "Severe breathing difficulty": (
        "cannot breathe",
        "can not breathe",
        "difficulty breathing",
        "shortness of breath",
        "breathless",
        "gasping",
    ),
    "Loss of consciousness": ("unconscious", "passed out", "fainted", "fainting", "not responding"),
    "Seizure": ("seizure", "convulsion", "fits"),
    "Signs of stroke": (
        "face drooping",
        "face droop",
        "slurred speech",
        "sudden weakness",
        "one side weakness",
        "numbness on one side",
    ),
    "Severe bleeding": ("severe bleeding", "heavy bleeding", "bleeding heavily", "bleeding a lot"),
    "Vomiting or coughing blood": ("vomiting blood", "coughing blood", "blood in vomit"),
    "Confusion or extreme drowsiness": ("confused", "confusion", "extremely drowsy", "hard to wake"),
    "Suicidal thoughts": ("suicidal", "suicide", "want to die", "self harm"),
    "Poisoning or overdose": ("poisoning", "poisoned", "overdose", "swallowed pills"),
    "Severe allergic reaction": ("anaphylaxis", "severe allergic", "throat swelling", "tongue swelling"),
}

EMERGENCY_KEYWORDS: tuple[str, ...] = tuple(
    keyword for keywords in EMERGENCY_SIGNS.values() for keyword in keywords
)


def _matches(text: str, keywords: tuple[str, ...]) -> bool:
    return any(keyword in text for keyword in keywords)


def detect_red_flags(symptoms: tuple[str, ...]) -> tuple[str, ...]:
    """Return the emergency warning signs found in the given symptoms.

    This check is intentionally independent of any AI provider so that warning
    signs always take priority, even if the provider is replaced or fails.
    """

    normalized = tuple(symptom.strip().lower() for symptom in symptoms if symptom.strip())
    return tuple(
        label
        for label, keywords in EMERGENCY_SIGNS.items()
        if any(_matches(symptom, keywords) for symptom in normalized)
    )
