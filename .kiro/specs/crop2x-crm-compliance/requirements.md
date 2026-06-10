# Crop2X CRM & Operations Management System
## Requirements Specification — Compliance, RBAC & Gap Resolution

---

## 1. Overview

Crop2X is an internal CRM and Operations Management System used by five departments:
**Admin/Management**, **Business**, **Agronomy**, **Hardware**, and **Accounts**.

The system currently has a working FastAPI backend and Next.js frontend with partial implementations across authentication, devices, billing, inventory, tasks, leads, and clients. This spec defines every gap that must be closed to reach full production compliance.

---

## 2. Audit Summary — Current State

### 2.1 Implemented (Working)
- JWT authentication with refresh tokens ✅
- User model with roles: ADMIN, MANAGER, BUSINESS, AGRONOMY, HARDWARE, ACCOUNTS, EMPLOYEE ✅
- Device model with all 5 lifecycle statuses and `device_status_history` table ✅
- Client model with `onboarding_date`, `contract_value`, and device relationship ✅
- `audit_log` table (ActivityLog model) with user_id, username, role, action, entity_type, entity_id, old_values, new_values, ip_address ✅
- Component and ProcurementComponent models (Sensors, PCB, Microcontrollers, Batteries, Casings, Other) ✅
- Invoice and Payment models with arrears endpoint ✅
- Task model with Pending/In Progress/Completed and priority ✅
- FieldReport model with WEEKLY, BI_WEEKLY, FIELD_OPERATION, QA types ✅
- ClientIssue model with OPEN/IN_PROGRESS/RESOLVED statuses ✅
- Sidebar navigation filtered by role ✅
- Basic dashboard stats API (role-aware) ✅

### 2.2 Partially Implemented
- Lead pipeline: only has NEW_LEAD, CONTACTED, NEGOTIATION, CONVERTED, LOST — missing MEETING_SCHEDULED, PROPOSAL_SENT stages ⚠️
- Billing: invoice file upload supports PDF only — missing JPG/JPEG/PNG validation ⚠️
- Dashboard: single generic dashboard — no department-specific dashboards ⚠️
- Frontend route protection: layout redirects unauthenticated users, but any authenticated user can access any URL directly ⚠️
- RBAC on backend APIs: most write endpoints are guarded but several read endpoints have no role restriction ⚠️
- Activity logging: CREATE/UPDATE/DELETE are logged, but LOGIN/LOGOUT/STATUS_CHANGE/FILE_UPLOAD are inconsistently logged ⚠️
- Task performance API exists at `/tasks/performance` but frontend `/performance` page needs employee-level stats ⚠️
- Inventory: InventoryItem and Procurement exist; Component and ProcurementComponent models exist but no router/API endpoints for them ⚠️

### 2.3 Missing / Not Implemented
- **ProtectedRoute component** — no frontend route guard; users can navigate directly to any URL ❌
- **403 Unauthorized page** — no dedicated unauthorized page ❌
- **Dynamic role-based menus** — sidebar role filtering exists but is incomplete for new modules ❌
- **Department-specific dashboards** — Business, Agronomy, Hardware, Accounts, Admin dashboards ❌
- **Lead pipeline** — missing stages: MEETING_SCHEDULED, PROPOSAL_SENT; no stage transition enforcement ❌
- **Lead follow-up / meeting / farm visit tracking** — no LeadFollowUp model ❌
- **Component & ProcurementComponent APIs** — models exist but no CRUD endpoints or frontend ❌
- **Invoice file upload** — file_path stored as string but no upload endpoint for invoices; allowed: PDF, JPG, JPEG, PNG ❌
- **Contract tracking** — Client has `contract_value` but no `contract_start_date`, `contract_end_date`, `contract_status` ❌
- **Payment ledger view** — no paginated ledger endpoint per client ❌
- **Employee Performance Dashboard** — backend endpoint exists for admin only; no frontend per-employee view ❌
- **Device timeline UI** — `/devices/{id}/timeline` API exists but no frontend timeline component ❌
- **Agronomy department pages** — no Field Operations, Agronomy QA, Client Field History frontend pages ❌
- **Reports frontend** — reports router exists on backend but no `/reports` page in frontend ❌
- **Issues/Tickets frontend** — issues router exists on backend but no `/issues` frontend page ❌
- **Database indexes** — missing: `device.status`, `task.assigned_to_id` (has index), `billing.client_id` (has index), `inventory.component_id` (has index in ProcurementComponent) — needs verification ❌
- **Backend never trusts frontend validation** — payment amount negative check missing on backend ❌
- **Invalid status transition enforcement** — device status transitions are not validated for allowed flows ❌
- **Audit logging for LOGIN/LOGOUT** — auth router does not write to audit_log on login/logout ❌
- **File upload audit logging** — uploads router does not write to audit_log ❌

---

## 3. Role-Based Access Control Matrix

| Module | ADMIN | MANAGER | BUSINESS | AGRONOMY | HARDWARE | ACCOUNTS |
|---|---|---|---|---|---|---|
| Dashboard (own dept) | ✅ All | ✅ All | ✅ Business | ✅ Agronomy | ✅ Hardware | ✅ Accounts |
| Users / Roles | ✅ CRUD | ✅ Read | ❌ | ❌ | ❌ | ❌ |
| Clients | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ Read | ❌ | ✅ Read |
| Leads / Sales Pipeline | ✅ CRUD | ✅ CRUD | ✅ CRUD | ❌ | ❌ | ❌ |
| Meetings / Follow-ups / Farm Visits | ✅ CRUD | ✅ CRUD | ✅ CRUD | ❌ | ❌ | ❌ |
| Feedback / Complaints / Tickets | ✅ CRUD | ✅ CRUD | ✅ CRUD | ❌ | ❌ | ❌ |
| Field Operations / Reports | ✅ CRUD | ✅ CRUD | ❌ | ✅ CRUD | ❌ | ❌ |
| Agronomy QA | ✅ CRUD | ✅ CRUD | ❌ | ✅ CRUD | ❌ | ❌ |
| Devices / Lifecycle | ✅ CRUD | ✅ CRUD | ❌ | ✅ Read+Status | ✅ CRUD | ❌ |
| Inventory / Components | ✅ CRUD | ✅ CRUD | ❌ | ❌ | ✅ CRUD | ❌ |
| Procurement | ✅ CRUD | ✅ CRUD | ❌ | ❌ | ✅ CRUD | ❌ |
| Billing / Invoices / Payments | ✅ CRUD | ✅ CRUD | ❌ | ❌ | ❌ | ✅ CRUD |
| Outstanding Balances / Arrears | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Tasks | ✅ CRUD | ✅ CRUD | ✅ Own | ✅ Own | ✅ Own | ✅ Own |
| Performance Dashboard | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Audit Logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Notifications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| System Settings / User Mgmt | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Functional Requirements

### REQ-001 — Lead Pipeline Stages
**Priority:** High

The lead pipeline must support exactly these stages in order:
1. NEW_LEAD
2. CONTACTED
3. MEETING_SCHEDULED
4. PROPOSAL_SENT
5. NEGOTIATION
6. WON
7. LOST

**Acceptance criteria:**
- Backend `LeadStage` enum must include all 7 stages.
- Stage transitions must be validated: a lead can only advance forward or be marked LOST from any stage. Jumping multiple stages backward is not allowed.
- Frontend pipeline view must display leads in Kanban columns by stage.
- BUSINESS, MANAGER, and ADMIN roles can create and move leads.
- Only ADMIN and MANAGER can delete leads.

### REQ-002 — Lead Follow-up / Meeting / Farm Visit Tracking
**Priority:** High

A `LeadActivity` model must track interactions against a lead:

Fields: `id`, `lead_id` (FK), `activity_type` (FOLLOW_UP | MEETING | FARM_VISIT), `scheduled_at` (datetime), `notes` (text), `created_by_id` (FK → users), `created_at`.

**Acceptance criteria:**
- CRUD endpoints at `/leads/{lead_id}/activities`.
- BUSINESS, MANAGER, ADMIN roles can manage activities.
- Activities are listed on the lead detail page.

### REQ-003 — Frontend Route Protection
**Priority:** Critical

A `ProtectedRoute` component (or equivalent Next.js middleware) must:
- Redirect unauthenticated users to `/login`.
- Redirect authenticated users who lack permission for a route to `/unauthorized`.
- Each protected route must declare which roles are allowed.

**Acceptance criteria:**
- Manually entering a URL for an unauthorized page must redirect to `/unauthorized`.
- The unauthorized page must display: "403 — You Are Not Authorized To Access This Page."
- Unauthorized users must never see restricted sidebar menu items, buttons, or forms.

### REQ-004 — Dynamic Role-Based Sidebar Navigation
**Priority:** High

The sidebar must be driven by a role-to-routes configuration map. Menu items not in a role's allowed list must not render at all (not just be hidden with CSS).

Required menu items per role:

**ADMIN / MANAGER:** Dashboard, Clients, Leads, Devices, Tasks, Performance, Inventory, Billing, Reports, Issues, Notifications, Activity Logs, Users

**BUSINESS:** Dashboard, Clients, Leads, Issues/Tickets, Tasks, Notifications

**AGRONOMY:** Dashboard, Clients (read-only view), Devices (read-only), Reports/Field Operations, Tasks, Notifications

**HARDWARE:** Dashboard, Devices, Inventory, Tasks, Notifications

**ACCOUNTS:** Dashboard, Clients (read-only), Billing, Tasks, Notifications

### REQ-005 — Department-Specific Dashboards
**Priority:** High

Each role must see a dashboard tailored to their department. The generic `/dashboard` endpoint must return role-specific metrics.

**Business Dashboard widgets:**
- Total active leads
- Leads by stage (bar chart)
- Follow-ups due today
- Meetings this week
- Lead conversion rate (Won / Total)
- Recent client activity

**Agronomy Dashboard widgets:**
- Field reports submitted this week
- QA tasks pending
- Devices in QA_FOR_AGRONOMIST state
- Client field history count

**Hardware Dashboard widgets:**
- Devices by status (bar chart)
- Devices under development
- Inventory items with low stock (< 10 units)
- Pending procurement orders
- Repair/issue count

**Accounts Dashboard widgets:**
- Total revenue (sum of PAID invoices)
- Outstanding balance (sum of SENT+OVERDUE)
- Overdue invoices count and list
- Due invoices (next 30 days)
- Arrears by client

**Admin Dashboard widgets:**
- All of the above combined
- Total users by role
- System health: audit log entries today

### REQ-006 — Device Lifecycle & Status Transition Validation
**Priority:** High

Allowed device status transitions:

```
UNDER_DEVELOPMENT → QA_FOR_AGRONOMIST
QA_FOR_AGRONOMIST → QA_PASSED_IN_INVENTORY | UNDER_DEVELOPMENT
QA_PASSED_IN_INVENTORY → INSTALLED | UNDER_DEVELOPMENT
INSTALLED → BACK_AT_OFFICE | QA_FOR_AGRONOMIST
BACK_AT_OFFICE → QA_FOR_AGRONOMIST | UNDER_DEVELOPMENT | INSTALLED
```

**Acceptance criteria:**
<!-- - Backend must reject invalid status transitions with HTTP 422. -->
- Every status change writes a row to `device_status_history`.
- The device detail page shows a visual timeline of all status history entries.
- When status changes to INSTALLED, `client_id` is required.

### REQ-007 — Client–Device Relationship
**Priority:** High

**Acceptance criteria:**
- A device with status INSTALLED must have a non-null `client_id`.
- The client detail page shows a "Devices" tab listing all linked devices.
- The device detail page shows the linked client name and link.
- Deleting a client must not delete devices; it must set `device.client_id = NULL` and set device status to BACK_AT_OFFICE.

### REQ-008 — Inventory Components & Procurement APIs
**Priority:** High

The `Component` and `ProcurementComponent` models exist but have no API endpoints.

Required endpoints:
- `GET /inventory/components` — list all components (HARDWARE, ADMIN, MANAGER)
- `POST /inventory/components` — create component (HARDWARE, ADMIN, MANAGER)
- `GET /inventory/components/{id}` — get component detail
- `PATCH /inventory/components/{id}` — update component
- `DELETE /inventory/components/{id}` — delete (ADMIN, MANAGER only)
- `POST /inventory/components/{id}/procure` — create procurement record with optional image upload
- `GET /inventory/components/{id}/procurements` — list procurement history

**Acceptance criteria:**
- Image upload for procurement records must accept: JPG, JPEG, PNG only. Max size: 5 MB.
- Stock quantity must auto-increment when a procurement record is created.
- All component CRUD must be audit-logged.

### REQ-009 — Billing & Accounts Completion
**Priority:** High

**Contract tracking:** Add fields to the Client model:
- `contract_start_date` (Date, nullable)
- `contract_end_date` (Date, nullable)
- `contract_status` (enum: ACTIVE | EXPIRED | PENDING, nullable)

**Invoice file upload:**
- `POST /billing/invoices/{id}/upload` — upload invoice document
- Allowed formats: PDF, JPG, JPEG, PNG
- Max file size: 10 MB
- File path stored in `invoice.file_path`
- Audit logged as FILE_UPLOAD

**Payment ledger:**
- `GET /billing/clients/{client_id}/ledger` — paginated list of all invoices and payments for a client, sorted by date descending

**Validation:**
<!-- - Payment amount must be > 0; backend must reject negative or zero amounts with HTTP 422. -->
- Invoice amount must be > 0.
- Invoice due_date must not be in the past when creating.

### REQ-010 — Task Management & Employee Performance
**Priority:** Medium

**Task validation:**
- Status transitions: PENDING → IN_PROGRESS → COMPLETED (no backward transitions except by ADMIN/MANAGER).
- `due_date` is required for task creation by non-ADMIN roles.

**Employee performance API:**
- `GET /tasks/performance` — existing endpoint, extend to support `?user_id=` filter so employees can view their own stats.
- Stats: assigned_tasks, completed_tasks, pending_tasks, in_progress_tasks, completion_rate (%), avg_completion_days.

**Frontend Performance page:**
- ADMIN/MANAGER see all employees.
- Any other role sees only their own performance stats.

### REQ-011 — Audit Logging Completeness
**Priority:** High

Every action must generate an audit log entry. Currently missing:

| Action | Entity | Fix Required |
|---|---|---|
| LOGIN | User | Log in `auth.login` on success |
| LOGOUT | User | Log in `auth.logout` |
| FILE_UPLOAD | Invoice / Procurement | Log in upload handlers |
| STATUS_CHANGE | Device | Already logged via activity service — verify |
| STATUS_CHANGE | Task | Not currently logged — add to task update |

**Acceptance criteria:**
- `audit_log` table must record every CREATE, UPDATE, DELETE, STATUS_CHANGE, FILE_UPLOAD, LOGIN, LOGOUT.
- `old_values` and `new_values` must be populated as JSON strings for UPDATE and STATUS_CHANGE actions.
- `ip_address` must be captured from the request where available.
- Audit logs are viewable only by ADMIN and MANAGER.

### REQ-012 — Backend Validation & Security
**Priority:** High

All validation must be enforced on the backend regardless of frontend state.

- Payment `amount` ≤ 0 → HTTP 422
- Invoice `amount` ≤ 0 → HTTP 422
- Invoice `due_date` in the past → HTTP 422
- Invalid device status transition → HTTP 422 with message explaining allowed transitions
- Invalid task status transition (backward, non-admin) → HTTP 422
- File upload with disallowed MIME type or extension → HTTP 422
- File upload exceeding size limit → HTTP 413
- Lead stage transition skipping steps → HTTP 422
- Required fields missing → HTTP 422 (Pydantic handles this already)

### REQ-013 — Agronomy Module Frontend Pages
**Priority:** Medium

Create the following frontend pages accessible only to AGRONOMY (and ADMIN/MANAGER):

- `/reports` — Field Reports list (WEEKLY, BI_WEEKLY, FIELD_OPERATION, QA)
- `/reports/new` — Create field report form
- `/reports/[id]` — Report detail view
- `/clients/[id]` (enhance) — Add "Field History" tab showing field reports

These pages already have a backend API (`/reports/*`). Only the frontend is missing.

### REQ-014 — Issues / Support Tickets Frontend Page
**Priority:** Medium

Create frontend page:
- `/issues` — List all client issues (BUSINESS, ADMIN, MANAGER)
- Issues linked to a client visible on `/clients/[id]` in an "Issues" tab

Backend issues API already exists at `/clients/{id}/issues` and `/issues/{id}`.

### REQ-015 — Database Integrity
**Priority:** High

Verify and apply the following indexes and constraints via an Alembic migration:

| Table | Column | Index Type |
|---|---|---|
| devices | status | btree index |
| tasks | assigned_to_id | btree index (already exists in model) |
| invoices | client_id | btree index (already exists) |
| payments | client_id | btree index (already exists) |
| procurement_components | component_id | btree index (already exists) |
| audit_log | user_id | btree index |
| audit_log | created_at | btree index (for time-range queries) |
| lead_activities | lead_id | btree index |

Add constraint: `devices.client_id NOT NULL` when `devices.status = 'INSTALLED'` — enforced via application logic (not DB constraint due to complexity).

### REQ-016 — Testing
**Priority:** Medium

**Backend tests** (pytest):
- RBAC tests: verify each role can only access authorized endpoints (expect 403 for unauthorized)
- Audit log tests: verify every major action creates an audit_log entry
- Device lifecycle tests: verify valid and invalid status transitions
- Billing validation tests: negative payment amount, past due date
- Lead stage transition tests

**Frontend tests** (if testing framework is set up):
- Menu visibility: assert unauthorized menu items do not render
- Route protection: assert redirect to /unauthorized on unauthorized route access
- Role access: assert correct components visible per role

### REQ-017 — Documentation
**Priority:** Low

Generate the following in `docs/`:
- `ERD.md` — Entity Relationship Diagram (text/mermaid format)
- `ROLE_MATRIX.md` — Full role × module access matrix
- `API.md` — All endpoints with method, path, required role, request/response shape
- `MODULES.md` — Module descriptions and inter-module dependencies

---

## 5. Non-Functional Requirements

- **Security:** CORS must be restricted to specific frontend origin in production (currently `*`).
- **Security:** The `/auth/create-admin` endpoint must be removed or protected — it currently allows unauthenticated admin creation.
- **Performance:** Dashboard API must respond within 500 ms under normal load.
- **Availability:** All API endpoints must return structured JSON error responses (not HTML 500 pages).
- **Auditability:** No user action may occur without a corresponding audit log entry.
- **Scalability:** All list endpoints must support `skip` / `limit` pagination.

---

## 6. Acceptance Criteria Summary

The project is complete when all of the following are true:

- [ ] All 7 lead stages implemented with transition enforcement
- [ ] LeadActivity (follow-up/meeting/farm visit) CRUD implemented
- [ ] ProtectedRoute guards all frontend pages; unauthorized redirects to /unauthorized
- [ ] Sidebar menus are strictly role-filtered — no unauthorized items render
- [ ] 5 department-specific dashboards implemented
- [ ] Device status transition validation enforced (backend + frontend)
- [ ] Device timeline UI shows complete history
- [ ] Client profile shows linked devices tab
- [ ] Component and ProcurementComponent CRUD APIs implemented
- [ ] Invoice file upload (PDF/JPG/JPEG/PNG, max 10 MB) implemented
- [ ] Contract fields added to Client model and API
- [ ] Payment ledger endpoint implemented
- [ ] All backend validations enforce: negative amounts, invalid transitions, bad file types
- [ ] LOGIN, LOGOUT, FILE_UPLOAD, STATUS_CHANGE all audit-logged
- [ ] Employee performance self-view implemented
- [ ] /reports and /issues frontend pages implemented
- [ ] All database indexes verified and applied via migration
- [ ] /auth/create-admin endpoint secured or removed
- [ ] Backend tests cover RBAC, audit, device lifecycle, billing validation
