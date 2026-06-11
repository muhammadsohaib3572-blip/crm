# Crop2X CRM — Module Guide

## 1. Authentication & Users
JWT access tokens (30 min default) + DB-backed refresh tokens. Seven roles control all access. User management is ADMIN-only for create/edit/delete; MANAGER can list users.

**Depends on:** PostgreSQL, `users`, `refresh_tokens`

## 2. Clients
Central customer record: farm data, services, contract fields, linked devices/issues/reports/billing.

**Depends on:** Devices, Billing, Issues, Reports  
**Key rule:** Deleting a client unlinks devices (`BACK_AT_OFFICE`) without deleting hardware.

## 3. Leads & Pipeline
Seven-stage Kanban pipeline with enforced transitions. Lead activities track follow-ups, meetings, farm visits. Won leads convert to clients via `/leads/{id}/convert`.

**Depends on:** Clients (on conversion)

## 4. Devices & Lifecycle
Five statuses with validated transitions and full history in `device_status_history`. Installed devices require a client link.

**Depends on:** Clients, Users (assignees)

## 5. Tasks & Performance
Three-state task board. Cross-department tasks auto-created from issues. Performance API returns per-employee completion metrics.

**Depends on:** Users, Clients, Devices, Notifications

## 6. Issues & Ticketing
Business logs client issues; can assign to Hardware/Agronomy which triggers a high-priority task and notification.

**Depends on:** Clients, Tasks, Notifications

## 7. Billing & Accounts
Invoices, payments, arrears calculation, client ledger. File attachments via upload endpoint. Invoice PATCH/DELETE with business rules (no delete if paid).

**Depends on:** Clients

## 8. Inventory & Components
Raw component stock with procurement history and optional photos. Separate inventory items for general stock.

**Depends on:** Uploads static file serving

## 9. Field Reports (Agronomy)
Weekly/bi-weekly/field operation/QA reports per client with optional PDF/image attachments.

**Depends on:** Clients, Devices

## 10. Dashboard
Role-specific metrics: Business (leads), Agronomy (reports/QA), Hardware (devices/stock), Accounts (revenue/arrears), Admin (combined).

## 11. Audit & Notifications
All CRUD, login/logout, file uploads logged to `audit_log`. In-app notifications on task/issue assignment.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js, React, Tailwind, Zustand |
| Backend | **FastAPI** (Python) |
| Database | PostgreSQL + SQLAlchemy async + Alembic |
| Auth | JWT + bcrypt |

## Running Locally

```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend && npm install && npm run dev

# Tests
cd backend && pytest

# Migrations
cd backend && python run_migrations.py
```
