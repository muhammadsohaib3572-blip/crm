import asyncio
import sqlalchemy as sa
from sqlalchemy.ext.asyncio import create_async_engine
import os

# Database URL (adjust if needed)
DATABASE_URL = os.getenv('DATABASE_URL')

async def ensure_alembic_version():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS alembic_version (
            version_num VARCHAR(32) NOT NULL PRIMARY KEY
        );
        """))
    await engine.dispose()

async def run_alembic():
    import subprocess
    subprocess.run(["alembic", "upgrade", "heads"], check=True)

async def main():
    await ensure_alembic_version()
    await run_alembic()

if __name__ == "__main__":
    asyncio.run(main())
