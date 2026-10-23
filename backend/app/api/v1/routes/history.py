from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.history import TriageHistoryListResponse
from app.services.history_service import HistoryService

router = APIRouter(prefix="/history")


@router.get("/triage", response_model=TriageHistoryListResponse)
def list_triage_history(
    limit: int = Query(default=50, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TriageHistoryListResponse:
    return HistoryService(db).list_triage(user, limit=limit)


@router.delete("/triage/{history_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_triage_history(
    history_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    HistoryService(db).delete_triage(user, history_id)
