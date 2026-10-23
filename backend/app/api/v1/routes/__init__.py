from fastapi import APIRouter

from app.api.v1.routes import facilities, health, medicines, triage

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(triage.router, tags=["triage"])
api_router.include_router(facilities.router, tags=["facilities"])
api_router.include_router(medicines.router, tags=["medicines"])