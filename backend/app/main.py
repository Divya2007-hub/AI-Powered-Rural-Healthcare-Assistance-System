from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.api.v1.routes import api_router
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models import facility, history, medicine, user  # noqa: F401  (registers models with Base)


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
    _ensure_user_columns()
    _seed_data()

    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


def _ensure_user_columns() -> None:
    """Add columns introduced after the first release of the users table."""
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("users")}
    statements = []
    if "role" not in columns:
        statements.append(
            "ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'patient'"
        )
    if "facility_id" not in columns:
        statements.append(
            "ALTER TABLE users ADD COLUMN facility_id INTEGER REFERENCES facilities(id)"
        )

    if statements:
        with engine.begin() as connection:
            for statement in statements:
                connection.execute(text(statement))


def _seed_data() -> None:
    from app.models.facility import Facility
    from app.models.medicine import MedicineStock

    db = SessionLocal()
    try:
        if db.query(Facility).count() == 0:
            _seed_facilities(db)
        if db.query(MedicineStock).count() == 0:
            _seed_medicines(db)
        if settings.environment == "development":
            _seed_pharmacist(db)
    finally:
        db.close()


def _seed_pharmacist(db) -> None:
    from app.models.facility import Facility
    from app.models.user import User

    email = "pharmacist@sevacare.demo"
    if db.query(User).filter(User.email == email).first() is not None:
        return

    facility = db.query(Facility).filter(Facility.name == "Seva Pharmacy").first()
    if facility is None:
        return

    db.add(
        User(
            name="Demo Pharmacist",
            email=email,
            password_hash=hash_password("Pharmacist123"),
            language="en",
            role="pharmacist",
            facility_id=facility.id,
        )
    )
    db.commit()


def _seed_facilities(db) -> None:
    from app.models.facility import Facility

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


def _seed_medicines(db) -> None:
    from app.models.facility import Facility
    from app.models.medicine import MedicineStock

    facilities = {facility.name: facility for facility in db.query(Facility).all()}

    items = [
        MedicineStock(
            facility_id=facilities["Seva Pharmacy"].id,
            medicine_name="Paracetamol 500mg",
            category="Pain and fever",
            in_stock=True,
            quantity=120,
            unit="strips",
            price=20.0,
        ),
        MedicineStock(
            facility_id=facilities["Seva Pharmacy"].id,
            medicine_name="ORS Powder",
            category="Rehydration",
            in_stock=True,
            quantity=80,
            unit="sachets",
            price=15.0,
        ),
        MedicineStock(
            facility_id=facilities["Seva Pharmacy"].id,
            medicine_name="Amoxicillin 250mg",
            category="Antibiotic",
            in_stock=False,
            quantity=0,
            unit="strips",
            price=45.0,
        ),
        MedicineStock(
            facility_id=facilities["Rural Primary Health Centre"].id,
            medicine_name="Paracetamol 500mg",
            category="Pain and fever",
            in_stock=True,
            quantity=300,
            unit="tablets",
            price=1.0,
        ),
        MedicineStock(
            facility_id=facilities["Rural Primary Health Centre"].id,
            medicine_name="Iron and Folic Acid",
            category="Supplement",
            in_stock=True,
            quantity=150,
            unit="strips",
            price=10.0,
        ),
        MedicineStock(
            facility_id=facilities["Rural Primary Health Centre"].id,
            medicine_name="ORS Powder",
            category="Rehydration",
            in_stock=True,
            quantity=60,
            unit="sachets",
            price=12.0,
        ),
        MedicineStock(
            facility_id=facilities["Community Health Centre"].id,
            medicine_name="Paracetamol 500mg",
            category="Pain and fever",
            in_stock=True,
            quantity=200,
            unit="tablets",
            price=1.0,
        ),
        MedicineStock(
            facility_id=facilities["Community Health Centre"].id,
            medicine_name="Metformin 500mg",
            category="Diabetes",
            in_stock=True,
            quantity=90,
            unit="strips",
            price=30.0,
        ),
        MedicineStock(
            facility_id=facilities["District Government Hospital"].id,
            medicine_name="Insulin",
            category="Diabetes",
            in_stock=True,
            quantity=25,
            unit="vials",
            price=180.0,
        ),
        MedicineStock(
            facility_id=facilities["District Government Hospital"].id,
            medicine_name="Paracetamol 500mg",
            category="Pain and fever",
            in_stock=True,
            quantity=500,
            unit="tablets",
            price=1.0,
        ),
    ]
    db.add_all(items)
    db.commit()


app = create_app()