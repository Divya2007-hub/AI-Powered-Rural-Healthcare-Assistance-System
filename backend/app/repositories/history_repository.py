from sqlalchemy.orm import Session

from app.models.history import TriageHistory


class HistoryRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def add(self, entry: TriageHistory) -> TriageHistory:
        self._db.add(entry)
        self._db.commit()
        self._db.refresh(entry)
        return entry

    def list_for_user(self, user_id: int, limit: int = 50) -> list[TriageHistory]:
        return (
            self._db.query(TriageHistory)
            .filter(TriageHistory.user_id == user_id)
            .order_by(TriageHistory.created_at.desc(), TriageHistory.id.desc())
            .limit(limit)
            .all()
        )

    def get_for_user(self, user_id: int, history_id: int) -> TriageHistory | None:
        return (
            self._db.query(TriageHistory)
            .filter(TriageHistory.id == history_id, TriageHistory.user_id == user_id)
            .first()
        )

    def delete(self, entry: TriageHistory) -> None:
        self._db.delete(entry)
        self._db.commit()
