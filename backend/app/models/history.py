from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.core.security import utcnow


class TriageHistory(Base):
    __tablename__ = "triage_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    symptoms = Column(JSON, nullable=False)
    duration_days = Column(Integer)
    age_years = Column(Integer)
    language = Column(String(8), default="en", nullable=False)
    urgency = Column(String(60), nullable=False)
    urgency_code = Column(String(20), nullable=False)
    emergency = Column(Boolean, default=False, nullable=False)
    red_flags = Column(JSON, nullable=False, default=list)
    summary = Column(Text, nullable=False)
    advice = Column(JSON, nullable=False, default=list)
    disclaimer = Column(Text, nullable=False)
    engine = Column(String(60), nullable=False)
    created_at = Column(DateTime, default=utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="triage_history")
