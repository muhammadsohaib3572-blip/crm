from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Boolean, Enum as SQLAlchemyEnum
from app.models.base import Base, IDMixin, TimestampMixin
import enum

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    BUSINESS = "BUSINESS"
    AGRONOMY = "AGRONOMY"
    HARDWARE = "HARDWARE"
    ACCOUNTS = "ACCOUNTS"
    EMPLOYEE = "EMPLOYEE"

class User(Base, IDMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[UserRole] = mapped_column(SQLAlchemyEnum(UserRole), default=UserRole.EMPLOYEE, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
