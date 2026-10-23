from __future__ import annotations

DISCLAIMER = (
    "SevaCare gives general health information only. It does not diagnose illness "
    "or prescribe medicine. In an emergency, contact a doctor or your local "
    "emergency number."
)

EMERGENCY_SUMMARY = (
    "The symptoms you described may be an emergency. Please get medical help immediately."
)

LOW_SUMMARY = (
    "The symptoms you shared appear mild. Rest and monitor them, and see a doctor "
    "if they do not improve."
)

CONSULT_SUMMARY = (
    "Based on the symptoms you shared, a medical consultation is recommended. "
    "This is guidance, not a diagnosis."
)

LOW_ADVICE: tuple[str, ...] = (
    "Rest and drink enough water.",
    "Monitor your symptoms over the next 24 to 48 hours.",
    "See a doctor if symptoms get worse, last longer, or new symptoms appear.",
)

CONSULT_ADVICE: tuple[str, ...] = (
    "Contact a doctor or visit a nearby clinic for a check-up.",
    "Note when the symptoms started and whether they are getting worse.",
    "Seek care sooner if symptoms become severe or new symptoms appear.",
)

URGENT_ADVICE: tuple[str, ...] = (
    "Seek immediate medical help now. Do not wait for symptoms to improve.",
    "Call your local emergency number or go to the nearest emergency department.",
    "If possible, ask someone to stay with you until help arrives.",
)

# Used when a provider fails. The policy requires a consultation, never low urgency.
FALLBACK_SUMMARY = (
    "We could not fully review your symptoms right now. A medical consultation is "
    "recommended so a professional can assess you safely."
)

UNKNOWN_SUMMARY = (
    "There is not enough information to judge how serious these symptoms are. "
    "A medical consultation is recommended."
)
