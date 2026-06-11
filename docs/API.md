# Crop2X CRM — API Reference

Base URL: `http://localhost:8000`  
Auth: Bearer JWT (`Authorization: Bearer <token>`)

## Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | Public | OAuth2 form login → access + refresh token |
| POST | `/auth/refresh` | Public | Refresh access token |
| POST | `/auth/logout` | User | Revoke refresh token |
| GET | `/auth/me` | User | Current user profile |
| POST | `/auth/register` | Public* | Register EMPLOYEE (*if `ALLOW_PUBLIC_REGISTER=true`) |
| POST | `/auth/create-admin` | Setup | Bootstrap admin (secret required after first admin) |

## Clients

| Method | Path | Roles |
|--------|------|-------|
| GET | `/clients/` | ADMIN, MANAGER, BUSINESS, AGRONOMY, ACCOUNTS |
| POST | `/clients/` | ADMIN, MANAGER, BUSINESS |
| GET | `/clients/{id}` | Same as read |
| PATCH | `/clients/{id}` | ADMIN, MANAGER, BUSINESS |
| DELETE | `/clients/{id}` | ADMIN, MANAGER |

## Leads

| Method | Path | Roles |
|--------|------|-------|
| GET/POST | `/leads/` | ADMIN, MANAGER, BUSINESS |
| PATCH/DELETE | `/leads/{id}` | BUSINESS+ (delete: ADMIN, MANAGER) |
| POST | `/leads/{id}/convert` | ADMIN, MANAGER, BUSINESS |
| GET/POST | `/leads/{id}/activities` | ADMIN, MANAGER, BUSINESS |

## Devices

| Method | Path | Roles |
|--------|------|-------|
| GET | `/devices/` | ADMIN, MANAGER, HARDWARE, AGRONOMY |
| POST | `/devices/` | ADMIN, MANAGER, HARDWARE |
| PATCH | `/devices/{id}` | HARDWARE, AGRONOMY (assignee), ADMIN, MANAGER |
| PATCH | `/devices/{id}/status` | Status change with validation |
| GET | `/devices/{id}/timeline` | Read roles |

## Billing

| Method | Path | Roles |
|--------|------|-------|
| GET/POST | `/billing/invoices` | Read: ADMIN, MANAGER, ACCOUNTS / Write: same |
| GET/PATCH/DELETE | `/billing/invoices/{id}` | Delete: ADMIN, MANAGER |
| GET/POST | `/billing/payments` | ACCOUNTS+ |
| GET | `/billing/clients/{id}/arrears` | ACCOUNTS+ |
| GET | `/billing/clients/{id}/ledger` | ACCOUNTS+ |

## Tasks & Performance

| Method | Path | Roles |
|--------|------|-------|
| GET | `/tasks/` | All (filtered to own for non-admin) |
| POST | `/tasks/` | ADMIN, MANAGER, BUSINESS, ACCOUNTS, HARDWARE, AGRONOMY |
| PATCH/DELETE | `/tasks/{id}` | Admin/Manager or assignee |
| GET | `/tasks/performance` | All (self-view for non-admin) |

## Issues

| Method | Path | Roles |
|--------|------|-------|
| GET | `/issues` | ADMIN, MANAGER, BUSINESS, HARDWARE, AGRONOMY |
| GET/POST | `/clients/{id}/issues` | Read: issue roles / Create: BUSINESS+ |
| PATCH | `/issues/{id}` | Admin/Manager or assignee |

## Reports

| Method | Path | Roles |
|--------|------|-------|
| GET/POST | `/reports/` | Read: ADMIN, MANAGER, AGRONOMY / Write: AGRONOMY+ |
| PATCH/DELETE | `/reports/{id}` | AGRONOMY+ / Delete: ADMIN, MANAGER |

## Uploads

| Method | Path | Roles |
|--------|------|-------|
| POST | `/uploads/invoices/{id}/upload` | ACCOUNTS+ |
| POST | `/uploads/reports/{id}/upload` | AGRONOMY+ |
| POST | `/components/{id}/procure/upload-image` | HARDWARE+ |

## Components & Inventory

| Method | Path | Roles |
|--------|------|-------|
| CRUD | `/components/*` | ADMIN, MANAGER, HARDWARE |
| CRUD | `/inventory/*` | ADMIN, MANAGER, HARDWARE |

## Dashboard & Audit

| Method | Path | Roles |
|--------|------|-------|
| GET | `/dashboard/stats` | All (role-aware response) |
| GET | `/activity-logs/` | ADMIN, MANAGER |

Static files: `/uploads/{type}/{filename}`
