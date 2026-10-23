from fastapi import APIRouter, Depends, HTTPException

from app.core.config import settings
from app.integrations.sms import get_sms_provider
from app.schemas.sms import (
    SmsInboundRequest,
    SmsInboundResponse,
    SmsOutboxItem,
    SmsOutboxResponse,
)
from app.services.sms_service import SmsService
from app.services.triage_service import TriageService

router = APIRouter(prefix="/sms")


def get_sms_service() -> SmsService:
    return SmsService(TriageService(), get_sms_provider())


@router.post("/inbound", response_model=SmsInboundResponse)
def receive_sms(
    payload: SmsInboundRequest,
    service: SmsService = Depends(get_sms_service),
) -> SmsInboundResponse:
    try:
        return service.handle_inbound(payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/outbox", response_model=SmsOutboxResponse)
def list_outbox() -> SmsOutboxResponse:
    if settings.environment != "development":
        raise HTTPException(status_code=404, detail="Not found")

    provider = get_sms_provider()
    messages = [SmsOutboxItem(to=item.to, body=item.body) for item in provider.sent]
    return SmsOutboxResponse(messages=messages, count=len(messages))
