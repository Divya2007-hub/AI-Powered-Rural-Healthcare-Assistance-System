from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.history import TriageHistory
from app.models.user import User
from app.repositories.history_repository import HistoryRepository
from app.schemas.history import TriageHistoryListResponse, TriageHistoryResponse
from app.schemas.triage import TriageRequest, TriageResponse


class HistoryService:
    def __init__(self, db: Session) -> None:
        self._repo = HistoryRepository(db)

    def save_triage(self, user: User, payload: TriageRequest, result: TriageResponse) -> None:
        self._repo.add(
            TriageHistory(
                user_id=user.id,
                symptoms=list(payload.symptoms),
                duration_days=payload.duration_days,
                age_years=payload.age_years,
                language=payload.language,
                urgency=result.urgency,
                urgency_code=result.urgency_code,
                emergency=result.emergency,
                red_flags=list(result.red_flags),
                summary=result.summary,
                advice=list(result.advice),
                disclaimer=result.disclaimer,
                engine=result.engine,
            )
        )

    def list_triage(self, user: User, limit: int = 50) -> TriageHistoryListResponse:
        rows = self._repo.list_for_user(user.id, limit=limit)
        items = [TriageHistoryResponse.model_validate(row) for row in rows]
        return TriageHistoryListResponse(history=items, count=len(items))

    def delete_triage(self, user: User, history_id: int) -> None:
        entry = self._repo.get_for_user(user.id, history_id)
        if entry is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="History entry not found.",
            )
        self._repo.delete(entry)
