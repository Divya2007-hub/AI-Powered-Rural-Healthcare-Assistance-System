from fastapi import APIRouter

from app.api.v1.routes import facilities, health, triage

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(triage.router, tags=["triage"])
api_router.include_router(facilities.router, tags=["facilities"])