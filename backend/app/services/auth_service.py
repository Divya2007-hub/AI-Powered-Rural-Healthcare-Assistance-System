from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    SESSION_TTL,
    generate_session_token,
    hash_password,
    hash_session_token,
    utcnow,
    verify_password,
)
from app.models.user import User
from app.repositories.session_repository import SessionRepository
from app.repositories.user_repository import UserRepository


class AuthService:
    def __init__(self, db: Session) -> None:
        self._users = UserRepository(db)
        self._sessions = SessionRepository(db)

    def register(self, name: str, email: str, password: str, language: str = "en") -> tuple[User, str]:
        if self._users.get_by_email(email) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )

        user = self._users.create(
            name=name,
            email=email,
            password_hash=hash_password(password),
            language=language,
        )
        return user, self._issue_token(user)

    def login(self, email: str, password: str) -> tuple[User, str]:
        user = self._users.get_by_email(email)
        if user is None or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user, self._issue_token(user)

    def resolve_token(self, token: str) -> User | None:
        session = self._sessions.get_by_token_hash(hash_session_token(token))
        if session is None:
            return None
        if session.expires_at < utcnow():
            self._sessions.delete(session)
            return None
        return self._users.get_by_id(session.user_id)

    def logout(self, token: str) -> None:
        self._sessions.delete_by_token_hash(hash_session_token(token))

    def update_profile(
        self,
        user: User,
        name: str | None = None,
        language: str | None = None,
    ) -> User:
        return self._users.update(user, name=name, language=language)

    def _issue_token(self, user: User) -> str:
        token = generate_session_token()
        self._sessions.create(
            user_id=user.id,
            token_hash=hash_session_token(token),
            expires_at=utcnow() + SESSION_TTL,
        )
        return token
