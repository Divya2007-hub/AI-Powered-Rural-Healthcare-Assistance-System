from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.routes import api_router
from app.core.config import settings
from app.core.database import Base, engine
from app.models import facility


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, version=settings.app_version)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    Base.metadata.create_all(bind=engine)
    _seed_facilities()

    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


def _seed_facilities() -> None:
    from sqlalchemy.orm import Session

    from app.models.facility import Facility

    db = Session(bind=engine)
    try:
        if db.query(Facility).count():
            return

        items = [
            Facility(
                name="Rural Primary Health Centre",
                type="PHC",
                address="Main Road, Rampur Village",
                city="Rampur",
                state="Uttar Pradesh",
                phone="+91-98765-43210",
                latitude=26.8467,
                longitude=80.9462,
                open_24x7=False,
                emergency_services=False,
                distance_km=2.3,
            ),
            Facility(
                name="Community Health Centre",
                type="CHC",
                address="Block Road",
                city="Sultanpur",
                state="Uttar Pradesh",
                phone="+91-98765-43211",
                latitude=26.2597,
                longitude=82.0727,
                open_24x7=False,
                emergency_services=True,
                distance_km=8.7,
            ),
            Facility(
                name="District Government Hospital",
                type="Hospital",
                address="Civil Lines",
                city="Lucknow",
                state="Uttar Pradesh",
                phone="+91-522-123-4567",
                latitude=26.8467,
                longitude=80.9462,
                open_24x7=True,
                emergency_services=True,
                distance_km=14.2,
            ),
            Facility(
                name="Seva Pharmacy",
                type="Pharmacy",
                address="Market Street, Rampur Village",
                city="Rampur",
                state="Uttar Pradesh",
                phone="+91-98765-43212",
                latitude=26.848,
                longitude=80.947,
                open_24x7=False,
                emergency_services=False,
                distance_km=1.6,
            ),
        ]
        db.add_all(items)
        db.commit()
    finally:
        db.close()


app = create_app()