from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class MedicineStock(Base):
    __tablename__ = "medicine_stock"

    id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(Integer, ForeignKey("facilities.id"), nullable=False, index=True)
    medicine_name = Column(String(120), nullable=False, index=True)
    category = Column(String(60))
    in_stock = Column(Boolean, default=True, nullable=False)
    quantity = Column(Integer)
    unit = Column(String(30))
    price = Column(Float)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    facility = relationship("Facility", backref="medicine_stock")
