from datetime import datetime

from sqlalchemy.orm import Session

from app.models.user import AuthSession


class SessionRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(self, user_id: int, token_hash: str, expires_at: datetime) -> AuthSession:
        session = AuthSession(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self._db.add(session)
        self._db.commit()
        self._db.refresh(session)
        return session

    def get_by_token_hash(self, token_hash: str) -> AuthSession | None:
        return self._db.query(AuthSession).filter(AuthSession.token_hash == token_hash).first()

    def delete(self, session: AuthSession) -> None:
        self._db.delete(session)
        self._db.commit()

    def delete_by_token_hash(self, token_hash: str) -> None:
        self._db.query(AuthSession).filter(AuthSession.token_hash == token_hash).delete()
        self._db.commit()
