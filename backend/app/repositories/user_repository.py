from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash
from uuid import UUID

class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalars().first()

    async def get_by_id(self, user_id: UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalars().first()

    async def create(self, user_in: UserCreate) -> User:
        db_user = User(
            email=user_in.email,
            password_hash=get_password_hash(user_in.password),
            full_name=user_in.full_name,
            role=user_in.role,
        )
        self.db.add(db_user)
        await self.db.commit()
        await self.db.refresh(db_user)
        return db_user

    async def update(self, db_user: User, user_in: UserUpdate) -> User:
        if user_in.password:
            db_user.password_hash = get_password_hash(user_in.password)
        if user_in.email:
            db_user.email = user_in.email
        if user_in.full_name:
            db_user.full_name = user_in.full_name
        if user_in.role:
            db_user.role = user_in.role
        if user_in.is_active is not None:
            db_user.is_active = user_in.is_active
        
        await self.db.commit()
        await self.db.refresh(db_user)
        return db_user
