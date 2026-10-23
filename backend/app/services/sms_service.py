import re

from triage_engine import normalize_language

from app.integrations.sms.base import SmsProvider
from app.schemas.sms import SmsInboundRequest, SmsInboundResponse
from app.schemas.triage import TriageRequest
from app.services.triage_service import TriageService

LANGUAGE_PREFIX = re.compile(r"^\s*([a-zA-Z]{2})\s*:\s*")
SYMPTOM_SPLIT = re.compile(r"[,;\n]+")
MAX_SYMPTOMS = 20
MAX_REPLY_LENGTH = 480


class SmsService:
    """Handles an inbound text message by running triage and replying by SMS."""

    def __init__(self, triage: TriageService, provider: SmsProvider) -> None:
        self._triage = triage
        self._provider = provider

    def handle_inbound(self, payload: SmsInboundRequest) -> SmsInboundResponse:
        body = payload.body.strip()
        language = payload.language

        prefix = LANGUAGE_PREFIX.match(body)
        if prefix:
            language = prefix.group(1).lower()
            body = body[prefix.end():]

        symptoms = [
            symptom.strip() for symptom in SYMPTOM_SPLIT.split(body) if symptom.strip()
        ][:MAX_SYMPTOMS]
        if not symptoms:
            raise ValueError("Please include at least one symptom.")

        normalized = normalize_language(language)
        result = self._triage.assess(
            TriageRequest(symptoms=symptoms, language=normalized)
        )
        reply = self._compose_reply(
            result.urgency,
            result.summary,
            result.red_flags,
            result.advice,
            result.disclaimer,
        )
        self._provider.send(payload.sender, reply)

        return SmsInboundResponse(
            reply=reply,
            urgency_code=result.urgency_code,
            emergency=result.emergency,
            language=normalized,
        )

    @staticmethod
    def _compose_reply(
        urgency: str,
        summary: str,
        red_flags: list[str],
        advice: list[str],
        disclaimer: str,
    ) -> str:
        parts = [f"{urgency}: {summary}"]
        if red_flags:
            parts.append("Warning signs: " + "; ".join(red_flags[:3]))
        if advice:
            parts.append("Next: " + advice[0])
        parts.append(disclaimer)

        reply = " ".join(parts)
        if len(reply) <= MAX_REPLY_LENGTH:
            return reply
        return reply[: MAX_REPLY_LENGTH - 1].rstrip() + "…"
