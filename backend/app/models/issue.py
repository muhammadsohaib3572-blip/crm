from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Enum as SQLAlchemyEnum, ForeignKey, Text
from app.models.base import Base, IDMixin, TimestampMixin
import enum
from typing import Optional, List
import uuid

class IssueStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"

class IssuePriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class ClientIssue(Base, IDMixin, TimestampMixin):
    __tablename__ = "client_issues"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    assigned_to_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)
    status: Mapped[IssueStatus] = mapped_column(SQLAlchemyEnum(IssueStatus), default=IssueStatus.OPEN, nullable=False)
    priority: Mapped[IssuePriority] = mapped_column(SQLAlchemyEnum(IssuePriority), default=IssuePriority.MEDIUM, nullable=False)

    client: Mapped["Client"] = relationship("Client", back_populates="issues")
    assigned_to: Mapped[Optional["User"]] = relationship("User")
