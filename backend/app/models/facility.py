from sqlalchemy import Boolean, Column, Float, Integer, String

from app.core.database import Base


class Facility(Base):
    __tablename__ = "facilities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    type = Column(String(50), nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    phone = Column(String(40))
    latitude = Column(Float)
    longitude = Column(Float)
    open_24x7 = Column(Boolean, default=False)
    emergency_services = Column(Boolean, default=False)
    distance_km = Column(Float)
