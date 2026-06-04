from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from app.core.config import settings
from app.models.refresh_token import RefreshToken
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

class RefreshTokenService:
    """Service for managing refresh tokens"""

    @staticmethod
    def create_refresh_token(user_id: uuid.UUID) -> str:
        """Create a new refresh token"""
        expire = datetime.utcnow() + timedelta(days=7)  # 7 days expiry
        to_encode = {
            "exp": expire,
            "sub": str(user_id),
            "type": "refresh"
        }
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return encoded_jwt

    @staticmethod
    async def save_refresh_token(
        db: AsyncSession,
        user_id: uuid.UUID,
        token: str
    ) -> RefreshToken:
        """Save refresh token to database"""
        expires_at = datetime.utcnow() + timedelta(days=7)
        refresh_token = RefreshToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at
        )
        db.add(refresh_token)
        await db.commit()
        await db.refresh(refresh_token)
        return refresh_token

    @staticmethod
    async def verify_refresh_token(
        db: AsyncSession,
        token: str
    ) -> Optional[RefreshToken]:
        """Verify and retrieve refresh token"""
        result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.token == token,
                RefreshToken.is_revoked == False,
                RefreshToken.expires_at > datetime.utcnow()
            )
        )
        return result.scalars().first()

    @staticmethod
    async def revoke_refresh_token(
        db: AsyncSession,
        token: str
    ):
        """Revoke a refresh token"""
        result = await db.execute(
            select(RefreshToken).where(RefreshToken.token == token)
        )
        refresh_token = result.scalars().first()
        if refresh_token:
            refresh_token.is_revoked = True
            await db.commit()

    @staticmethod
    async def revoke_all_user_tokens(
        db: AsyncSession,
        user_id: uuid.UUID
    ):
        """Revoke all refresh tokens for a user"""
        result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user_id,
                RefreshToken.is_revoked == False
            )
        )
        tokens = result.scalars().all()
        for token in tokens:
            token.is_revoked = True
        await db.commit()
