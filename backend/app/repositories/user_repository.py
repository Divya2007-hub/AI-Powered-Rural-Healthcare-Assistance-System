from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_by_email(self, email: str) -> User | None:
        return self._db.query(User).filter(User.email == email).first()

    def get_by_id(self, user_id: int) -> User | None:
        return self._db.get(User, user_id)

    def create(self, name: str, email: str, password_hash: str, language: str = "en") -> User:
        user = User(name=name, email=email, password_hash=password_hash, language=language)
        self._db.add(user)
        self._db.commit()
        self._db.refresh(user)
        return user

    def update(self, user: User, name: str | None = None, language: str | None = None) -> User:
        if name is not None:
            user.name = name
        if language is not None:
            user.language = language
        self._db.commit()
        self._db.refresh(user)
        return user
