from fastapi import APIRouter

from app.api.v1.routes import (
    auth,
    facilities,
    health,
    history,
    medicines,
    pharmacist,
    sms,
    triage,
    users,
)

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(triage.router, tags=["triage"])
api_router.include_router(history.router, tags=["history"])
api_router.include_router(facilities.router, tags=["facilities"])
api_router.include_router(medicines.router, tags=["medicines"])
api_router.include_router(pharmacist.router, tags=["pharmacist"])
api_router.include_router(sms.router, tags=["sms"])