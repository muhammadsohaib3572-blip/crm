# Crop2X CRM Backend

This is the Python FastAPI backend for the Crop2X Operations Management System.

## Tech Stack
- **Framework:** FastAPI (Async)
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy with Alembic migrations
- **Authentication:** JWT + OAuth2
- **Validation:** Pydantic v2

## Getting Started

### Prerequisites
- Python 3.11+
- PostgreSQL

### Installation
1. Setup virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
2. Configure `.env`:
   ```bash
   DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/db_name
   SECRET_KEY=your_secret_key
   ```
3. Run the application:
   ```bash
   uvicorn app.main:app --reload
   ```

## Architecture (Clean Architecture)
- `models/`: Database schemas.
- `schemas/`: Pydantic validation models.
- `repositories/`: Database query logic.
- `services/`: Business logic.
- `routers/`: API endpoints.
