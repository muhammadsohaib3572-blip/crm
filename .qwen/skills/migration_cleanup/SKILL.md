---
name: migration_cleanup
description: Resolve Alembic migration conflicts, remove PostgreSQL remnants, and configure Neon DB
source: auto-skill
extracted_at: '2026-06-09T04:32:14.360Z'
---

## Purpose
This skill documents a repeatable process for cleaning up a project's Alembic migration history, removing legacy PostgreSQL‑specific configuration, and switching the database connection to Neon.

## Steps
1. **Identify existing PostgreSQL references**
   - Grep for `postgres`, `postgresql`, and related env vars in the codebase (`docker-compose.yml`, `requirements.txt`, `alembic.ini`, etc.).
   - Locate configuration files (`.env`, `docker-compose.yml`, `backend/app/core/config.py`).
2. **Remove PostgreSQL service from Docker compose**
   - Delete the `db` service block and any `POSTGRES_*` env variables.
   - Replace `DATABASE_URL` in the backend service with `${DATABASE_URL}`.
3. **Create Neon `.env`**
   - Place a `.env` file in the backend root containing the Neon connection string and required security settings.
   - Update `backend/app/core/config.py` to read `DATABASE_URL` from the environment.
   - Adjust any hard‑coded fallback URLs (e.g., in `reset_db.py`).
4. **Update requirements**
   - Ensure `asyncpg` is present; add `psycopg2-binary` if needed for Alembic.
5. **Handle Alembic multiple heads**
   - Run `alembic merge heads -m "Merge migration heads"` to create a merge migration.
6. **Fix failing migration steps**
   - Edit migration files that reference non‑existent tables (e.g., `field_reports`).
   - Wrap such operations in `try/except` blocks or remove them safely.
7. **Reset problematic migrations**
   - If a migration sequence is corrupted, downgrade to a known good base or delete all migration files.
   - Regenerate a clean initial migration with `alembic revision --autogenerate -m "Initial schema with all models"`.
   - Apply the migration (`alembic upgrade head`).
8. **Verify**
   - Run the migration script (`python run_migrations.py`) against Neon to confirm the schema is created without errors.
   - Inspect the database tables via a client or `alembic current`.

## Tips & Gotchas
- **Multiple heads**: always merge before attempting further upgrades.
- **Missing tables**: dropping constraints on a table that does not exist aborts the transaction; guard with `try/except` or conditional checks.
- **Transaction aborts**: after a failure, the whole transaction is dead; start a fresh migration run.
- **Downgrade safety**: downgrading may fail if a migration tries to drop unnamed constraints. In such cases, delete the offending migration manually.
- **Neon connection**: use the `postgresql+asyncpg` driver in the URL; include `sslmode=require`.

## When to Apply
- When migrating a FastAPI/SQLAlchemy project from a local PostgreSQL Docker setup to a managed Neon instance.
- When Alembic history contains divergent branches or broken migrations.
- When you need to clean up legacy DB configuration without altering application code beyond the connection settings.
