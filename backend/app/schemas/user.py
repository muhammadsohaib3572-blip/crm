from pydantic import BaseModel, EmailStr, field_validator
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.user import UserRole

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.EMPLOYEE
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str

    @field_validator('password')
    @classmethod
    def truncate_password(cls, v: str) -> str:
        """Truncate password to 72 bytes for bcrypt compatibility"""
        password_bytes = v.encode('utf-8')
        if len(password_bytes) > 72:
            return password_bytes[:72].decode('utf-8', errors='ignore')
        return v

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None

    @field_validator('password')
    @classmethod
    def truncate_password(cls, v: Optional[str]) -> Optional[str]:
        """Truncate password to 72 bytes for bcrypt compatibility"""
        if v is None:
            return v
        password_bytes = v.encode('utf-8')
        if len(password_bytes) > 72:
            return password_bytes[:72].decode('utf-8', errors='ignore')
        return v

class UserInDB(UserBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
