# Crop2X CRM — Complete System Documentation (Roman Urdu)

> **Yeh documentation Roman Urdu mein hai taake team ke sab members asaani se samajh sakein.**

---

## FEHRIST (Table of Contents)

1. [System Overview — System Kya Hai?](#1-system-overview)
2. [Tech Stack — Konsi Technologies Use Hoti Hain?](#2-tech-stack)
3. [System Architecture — System Kese Kaam Karta Hai?](#3-system-architecture)
4. [Database Relations — Data Kese Connected Hai?](#4-database-relations)
5. [Role-Based System — Permissions Kese Kaam Karti Hain?](#5-role-based-system)
6. [Authentication Flow — Login Kese Hota Hai?](#6-authentication-flow)
7. [Frontend Workflow — UI Kese Kaam Karti Hai?](#7-frontend-workflow)
8. [Backend Workflow — API Kese Kaam Karta Hai?](#8-backend-workflow)
9. [Har Module Ki Detail](#9-modules-detail)
10. [Complete API Endpoints Reference](#10-api-endpoints)
11. [Frontend Pages Testing Guide](#11-frontend-testing)
12. [Postman Testing Guide](#12-postman-testing)
13. [Step-by-Step Manual Testing Checklist](#13-testing-checklist)

---

---

## 1. System Overview

**Crop2X CRM** ek enterprise-grade internal system hai jo agriculture aur hardware operations manage karta hai. Yeh system in cheezoon ke liye banaya gaya hai:

- **Clients manage karna** — jo log company ke customers hain (farmers, businesses)
- **Leads track karna** — potential customers jo abhi convert nahi hue
- **Devices manage karna** — hardware devices ka lifecycle track karna (development se installation tak)
- **Inventory track karna** — parts aur components ka stock
- **Billing karna** — invoices banana aur payments record karna
- **Tasks assign karna** — team members ko kaam dena
- **Issues log karna** — client problems track karna
- **Field Reports** — agronomists ke field visits ka record
- **Notifications** — team ko alerts dena
- **Activity Logs** — har action ka audit trail

**System ka naam:** Crop2X Internal CRM & Operations Management System
**Backend URL:** `http://localhost:8000`
**Frontend URL:** `http://localhost:3000`
**API Docs (Swagger):** `http://localhost:8000/docs`

---

## 2. Tech Stack

### Backend (Server Side)
| Technology | Kaam |
|-----------|------|
| **Python 3.11+** | Programming language |
| **FastAPI** | Web framework (APIs banane ke liye) |
| **PostgreSQL** | Database |
| **SQLAlchemy 2.0** | Database ORM (Python se DB baat karta hai) |
| **Alembic** | Database migrations (schema changes) |
| **JWT (python-jose)** | Authentication tokens |
| **bcrypt (passlib)** | Password hashing |
| **Uvicorn** | ASGI server |

### Frontend (Client Side)
| Technology | Kaam |
|-----------|------|
| **Next.js 16** | React framework |
| **TypeScript** | Type-safe JavaScript |
| **Tailwind CSS v4** | Styling |
| **Zustand** | State management (auth store) |
| **Axios** | HTTP requests (API calls) |
| **React Hook Form + Zod** | Form validation |
| **Recharts** | Charts aur graphs |
| **Lucide React** | Icons |

---

---

## 3. System Architecture

### Overall Flow (Kese Kaam Karta Hai)

```
User (Browser)
     |
     | HTTP Request
     v
Frontend (Next.js - Port 3000)
     |
     | Axios API Call (with JWT Token)
     v
Backend (FastAPI - Port 8000)
     |
     | SQLAlchemy Query
     v
PostgreSQL Database
```

### Request ka Safar (Step by Step)

1. **User browser mein action karta hai** (e.g., "New Client" button click)
2. **Frontend form validate karta hai** (Zod schema se)
3. **Axios request bhejta hai** backend ko, saath mein `Authorization: Bearer <token>` header
4. **FastAPI middleware** request receive karta hai:
   - `LoggingMiddleware` — request log karta hai
   - `RateLimitMiddleware` — 100 requests/minute limit check karta hai
   - `ErrorHandlerMiddleware` — errors handle karta hai
5. **Router** request ko sahi function tak pohonchata hai
6. **`get_current_user` dependency** JWT token verify karta hai
7. **`check_role` dependency** permission check karta hai
8. **Repository** database query run karta hai
9. **ActivityLogService** action log karta hai
10. **Response** wapas frontend ko jata hai
11. **Frontend UI update** hoti hai

### Middleware Stack (Order Mein)
```
ErrorHandlerMiddleware (sabse bahar)
  └── LoggingMiddleware
        └── RateLimitMiddleware (100 req/60 sec)
              └── CORSMiddleware
                    └── FastAPI Routes
```

---

---

## 4. Database Relations

### Tables aur Unke Relations

```
users
  ├── devices (assigned_hardware_id → users.id)
  ├── devices (assigned_agronomist_id → users.id)
  ├── tasks (assigned_to_id → users.id)
  ├── client_issues (assigned_to_id → users.id)
  ├── field_reports (created_by_id → users.id)
  ├── device_history (changed_by_id → users.id)
  ├── notifications (user_id → users.id)
  ├── activity_logs (user_id → users.id)
  └── refresh_tokens (user_id → users.id)

clients
  ├── devices (client_id → clients.id)
  ├── leads (client_id → clients.id)
  ├── client_issues (client_id → clients.id)
  ├── invoices (client_id → clients.id)
  ├── payments (client_id → clients.id)
  └── field_reports (client_id → clients.id)

devices
  ├── device_history (device_id → devices.id)
  ├── tasks (device_id → devices.id)
  └── field_reports (device_id → devices.id)

invoices
  └── payments (invoice_id → invoices.id)

inventory_items
  └── procurements (item_id → inventory_items.id)
```

### Har Table Ki Fields

#### `users` table
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| email | String (unique) | Login email |
| password_hash | String | Hashed password |
| full_name | String | Poora naam |
| role | Enum | ADMIN/MANAGER/BUSINESS/AGRONOMY/HARDWARE/ACCOUNTS/EMPLOYEE |
| is_active | Boolean | Active hai ya nahi |
| created_at | DateTime | Kab banaya |
| updated_at | DateTime | Kab update hua |

#### `clients` table
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Client ka naam |
| company_name | String | Company naam |
| farm_size | Float | Farm ka size (acres) |
| address | Text | Pata |
| contact_info | String | Contact number/info |
| onboarding_date | Date | Kab onboard hua |
| crop_cycle_end_date | Date | Fasal cycle khatam hone ki date |
| services | JSON Array | Konsi services le raha hai |
| farm_location | Text | Farm ki location |
| third_party_credentials | JSON | Third-party system credentials |

#### `leads` table
| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String | Lead ka naam |
| company_name | String | Company naam |
| stage | Enum | NEW_LEAD/CONTACTED/NEGOTIATION/CONVERTED/LOST |
| email | String | Email |
| phone | String | Phone number |
| follow_up_date | Date | Follow-up ki date |
| quotation_amount | Decimal | Quote ki raqam |
| proposal_link | String | Proposal ka link |
| service_tags | JSON Array | Services tags |
| notes | Text | Notes |
| client_id | UUID (FK) | Agar convert hua to client ka ID |

---

---

## 5. Role-Based System

### 7 Roles Hain System Mein

| Role | Urdu Mein | Kya Kar Sakta Hai |
|------|-----------|-------------------|
| **ADMIN** | Super Admin | Sab kuch — users delete, sab modules |
| **MANAGER** | Manager | ADMIN jaisa, sirf user delete nahi kar sakta (deactivate karta hai) |
| **BUSINESS** | Business Team | Clients, Leads, Tasks, Issues |
| **AGRONOMY** | Agronomist | Devices (read/update), Field Reports, Tasks |
| **HARDWARE** | Hardware Engineer | Devices (full), Inventory, Tasks |
| **ACCOUNTS** | Accounts Team | Billing (invoices, payments), Clients (read) |
| **EMPLOYEE** | General Employee | Sirf apne tasks, notifications |

### Role Permissions Table

| Module | ADMIN | MANAGER | BUSINESS | AGRONOMY | HARDWARE | ACCOUNTS | EMPLOYEE |
|--------|-------|---------|----------|----------|----------|----------|----------|
| Users (CRUD) | ✅ Full | 👁️ Read | ❌ | ❌ | ❌ | ❌ | ❌ |
| Clients | ✅ Full | ✅ Full | ✅ Full | 👁️ Read | ❌ | 👁️ Read | ❌ |
| Leads | ✅ Full | ✅ Full | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| Devices | ✅ Full | ✅ Full | ❌ | ✅ Update | ✅ Full | ❌ | ❌ |
| Inventory | ✅ Full | ✅ Full | ❌ | ❌ | ✅ Full | ❌ | ❌ |
| Billing | ✅ Full | ✅ Full | ❌ | ❌ | ❌ | ✅ Full | ❌ |
| Tasks | ✅ Full | ✅ Full | ✅ Create | ✅ Own | ✅ Own | ✅ Own | ✅ Own |
| Issues | ✅ Full | ✅ Full | ✅ Create | ✅ Own | ✅ Own | ❌ | ❌ |
| Reports | ✅ Full | ✅ Full | ❌ | ✅ Full | ❌ | ❌ | ❌ |
| Activity Logs | ✅ All | ✅ All | 👁️ Own | 👁️ Own | 👁️ Own | 👁️ Own | 👁️ Own |
| Dashboard | ✅ Full | ✅ Full | ✅ Partial | ✅ Partial | ✅ Partial | ✅ Partial | ❌ |

### Sidebar Mein Role Filter

Sidebar automatically filter hoti hai user ke role ke hisaab se:
- **ADMIN/MANAGER** — sab menu items dikhte hain
- **BUSINESS** — Clients, Leads, Tasks, Notifications
- **AGRONOMY** — Clients, Devices, Tasks, Notifications
- **HARDWARE** — Devices, Inventory, Tasks, Notifications
- **ACCOUNTS** — Clients, Billing, Notifications
- **EMPLOYEE** — Tasks, Notifications

---

---

## 6. Authentication Flow

### Login Process (Step by Step)

```
Step 1: User /login page par jata hai
Step 2: Email aur password enter karta hai
Step 3: Frontend POST /auth/login bhejta hai
        (Content-Type: application/x-www-form-urlencoded)
        Body: username=email@example.com&password=mypassword
Step 4: Backend password verify karta hai (bcrypt)
Step 5: Backend 2 tokens return karta hai:
        - access_token (JWT, 30 minute valid)
        - refresh_token (database mein save hota hai)
Step 6: Frontend tokens localStorage mein save karta hai
Step 7: Zustand store mein user info save hoti hai
Step 8: User /dashboard par redirect hota hai
```

### Token Refresh (Auto-Refresh)

```
Jab access_token expire ho jata hai (30 min baad):
Step 1: Axios request bhejta hai, 401 error aata hai
Step 2: Axios interceptor automatically POST /auth/refresh call karta hai
Step 3: refresh_token bhejta hai
Step 4: Backend naya access_token aur refresh_token deta hai
Step 5: Purana refresh_token revoke ho jata hai
Step 6: Naye tokens localStorage mein save hote hain
Step 7: Original request retry hoti hai
```

### Logout Process

```
Step 1: User "Logout" button click karta hai
Step 2: Frontend POST /auth/logout bhejta hai (refresh_token ke saath)
Step 3: Backend refresh_token database mein revoke karta hai
Step 4: localStorage se tokens delete hote hain
Step 5: Zustand store clear hota hai
Step 6: User /login par redirect hota hai
```

### JWT Token Structure

```json
{
  "sub": "user-uuid-here",
  "exp": 1234567890
}
```
- **sub** = user ka UUID
- **exp** = expiry timestamp
- **Algorithm** = HS256
- **Secret Key** = .env file mein `SECRET_KEY`

### Route Protection (Frontend)

`app/layout.tsx` mein auth check hota hai:
1. `localStorage` se `access_token` uthata hai
2. `GET /auth/me` call karta hai
3. Agar valid → Zustand store update karta hai
4. Agar invalid → tokens delete karta hai, `/login` par redirect

---

---

## 7. Frontend Workflow

### Pages aur Unka Kaam

#### `/login` — Login Page
- **Kya hai:** Email/password form
- **Submit hone par:** `POST /auth/login` call hota hai
- **Success par:** tokens save, `/dashboard` redirect
- **Error par:** "Incorrect email or password" message

#### `/register` — Register Page
- **Kya hai:** Naya user register karne ka form
- **Fields:** email, password, full_name, role
- **Submit hone par:** `POST /auth/register` call hota hai
- **Note:** Default role EMPLOYEE hota hai

#### `/dashboard` — Dashboard
- **Kya hai:** Main overview page
- **3 API calls hoti hain:**
  1. `GET /dashboard/stats` — KPI numbers
  2. `GET /dashboard/recent-activity` — Recent items
  3. `GET /dashboard/alerts` — Critical alerts
- **Charts:** Device status breakdown, Task status breakdown
- **Role ke hisaab se:** Har role ko alag stats dikhte hain

#### `/clients` — Clients List
- **Kya hai:** Sare clients ki grid
- **Actions:** New Client button, Edit, Delete
- **Click on client:** `/clients/[id]` par jata hai

#### `/clients/[id]` — Client Profile
- **Kya hai:** Ek client ki poori detail
- **5 API calls parallel mein:**
  1. `GET /clients/{id}` — Client info
  2. `GET /billing/invoices?client_id={id}` — Invoices
  3. `GET /billing/clients/{id}/arrears` — Outstanding balance
  4. `GET /clients/{id}/issues` — Issues
  5. `GET /reports?client_id={id}` — Field reports
- **Tabs:** Overview, Devices, Invoices, Issues, Reports

#### `/leads` — Leads Kanban Board
- **Kya hai:** 5 column kanban board
- **Columns:** NEW_LEAD → CONTACTED → NEGOTIATION → CONVERTED → LOST
- **Stage change:** Dot buttons se stage update hoti hai (`PATCH /leads/{id}`)
- **New Lead:** Form modal se create hota hai

#### `/devices` — Devices List
- **Kya hai:** Sare devices ki table
- **Status badges:** Color-coded status
- **Click:** `/devices/[id]` par jata hai

#### `/devices/[id]` — Device Details
- **Kya hai:** Device ki detail + history timeline
- **History:** `GET /devices/{id}/history` se aati hai
- **Update:** Status change karne par history record hoti hai

#### `/tasks` — Task Board
- **Kya hai:** 3 column kanban (PENDING / IN_PROGRESS / COMPLETED)
- **Admin/Manager:** Sare tasks dekhte hain
- **Others:** Sirf apne tasks dekhte hain
- **Status update:** Inline dropdown se

#### `/billing` — Billing Ledger
- **Kya hai:** Invoices ki table
- **Actions:** New Invoice, Record Payment
- **Status:** DRAFT → SENT → PAID / OVERDUE / CANCELLED

#### `/inventory` — Inventory List
- **Kya hai:** Parts/components ki card grid
- **Low stock warning:** 10 se kam quantity par warning
- **Actions:** Add Item, Procure (stock add karna)

#### `/inventory/[id]` — Item Details
- **Kya hai:** Item detail + procurement history

#### `/notifications` — Notifications
- **Kya hai:** User ki notifications feed
- **Actions:** Mark as read, Mark all read, Delete
- **Types:** INFO, WARNING, ERROR, SUCCESS

#### `/activity-logs` — Activity Logs
- **Admin/Manager:** Sare logs dekhte hain (filter by entity, user)
- **Others:** Sirf apne actions dekhte hain

#### `/performance` — Performance
- **Kya hai:** Employee task completion stats
- **API:** `GET /tasks/performance`
- **Sirf:** ADMIN aur MANAGER dekh sakte hain

#### `/users` — User Management
- **Kya hai:** Users ki table
- **Actions:** Create User, Edit, Delete/Deactivate
- **Sirf:** ADMIN aur MANAGER

---

---

## 8. Backend Workflow

### Request Processing Pipeline

```
HTTP Request aata hai
        ↓
ErrorHandlerMiddleware (errors catch karta hai)
        ↓
LoggingMiddleware (request log karta hai)
        ↓
RateLimitMiddleware (100 req/min check)
        ↓
CORSMiddleware (cross-origin allow karta hai)
        ↓
FastAPI Router (sahi endpoint dhundta hai)
        ↓
Dependency Injection:
  - get_db() → database session
  - get_current_user() → JWT verify, user fetch
  - check_role() → permission check
        ↓
Route Handler Function
        ↓
Repository (database operations)
        ↓
ActivityLogService (action log karta hai)
        ↓
Pydantic Schema (response validate karta hai)
        ↓
JSON Response wapas jata hai
```

### Repository Pattern

Har module ka alag repository hai jo database queries handle karta hai:
- `UserRepository` — users table
- `ClientRepository` — clients table
- `LeadRepository` — leads table
- `DeviceRepository` — devices table + history
- `InventoryRepository` — inventory + procurements
- `BillingRepository` — invoices + payments
- `TaskRepository` — tasks + performance stats
- `ReportRepository` — field reports

### Activity Log Service

Har important action ke baad `ActivityLogService.log_activity()` call hota hai:
```python
await ActivityLogService.log_activity(
    db,
    user_id,        # Kisne kiya
    user_name,      # User ka naam
    "CREATE",       # Action: CREATE/UPDATE/DELETE/READ
    "Client",       # Entity type
    "Description",  # Kya hua
    entity_id=id,   # Kis record par
    previous_value, # Pehle kya tha (update ke liye)
    new_value       # Ab kya hai (update ke liye)
)
```

### Environment Variables (.env file)

```
DATABASE_URL=postgresql+asyncpg://user:password@localhost/dbname
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

---

## 9. Modules Detail

### Module 1: Authentication (Login/Logout)

**Kya karta hai:** Users ko system mein enter karne deta hai aur secure rakhta hai.

**Key Features:**
- Email/password se login
- JWT access token (30 min)
- Refresh token (database mein stored, revocable)
- Auto token refresh
- Secure logout (token revoke)
- Admin bootstrap endpoint (`/auth/create-admin`)

---

### Module 2: Users Management

**Kya karta hai:** System ke users manage karta hai.

**Key Features:**
- ADMIN hi naye users bana sakta hai
- 7 roles available hain
- User deactivate hota hai agar uske records hain (hard delete nahi)
- Role ke hisaab se filter kar sakte hain

---

### Module 3: Clients

**Kya karta hai:** Company ke customers (clients) ka complete record rakhta hai.

**Key Features:**
- Farm details (size, location, crop cycle)
- Services list (JSON array)
- Third-party credentials (secure JSON)
- Linked devices, invoices, issues, reports
- Full audit trail

---

### Module 4: Leads (Sales Pipeline)

**Kya karta hai:** Potential customers ko track karta hai jab tak woh client nahi ban jaate.

**Pipeline Stages:**
```
NEW_LEAD → CONTACTED → NEGOTIATION → CONVERTED → LOST
```

**Key Features:**
- Kanban board UI
- Quotation amount track karna
- Proposal link attach karna
- Service tags
- Follow-up date reminder
- Convert hone par client se link ho sakta hai

---

### Module 5: Devices

**Kya karta hai:** Hardware devices ka poora lifecycle track karta hai.

**Device Lifecycle:**
```
UNDER_DEVELOPMENT → QA_FOR_AGRONOMIST → QA_PASSED_IN_INVENTORY → INSTALLED → BACK_AT_OFFICE
```

**Key Features:**
- Unique serial number
- Dual assignment (hardware engineer + agronomist)
- Client se link (jab install ho)
- Har status change ka history record
- History timeline UI mein

---

### Module 6: Inventory

**Kya karta hai:** Parts aur components ka stock manage karta hai.

**Key Features:**
- SKU-based tracking
- Quantity management
- Procurement records (batch purchases)
- Photo uploads for procurements
- Low stock warning (< 10 units)
- Vendor tracking

---

### Module 7: Billing

**Kya karta hai:** Invoices aur payments manage karta hai.

**Invoice Lifecycle:**
```
DRAFT → SENT → PAID
              → OVERDUE
              → CANCELLED
```

**Key Features:**
- Invoice PDF upload
- Payment recording
- Outstanding balance calculation
- Arrears breakdown (total invoiced - total paid)
- Overdue invoices list
- Dashboard mein revenue stats

---

### Module 8: Tasks

**Kya karta hai:** Team members ko kaam assign karta hai.

**Key Features:**
- 3 status: PENDING → IN_PROGRESS → COMPLETED
- 3 priority: LOW, MEDIUM, HIGH
- Device ya client se link kar sakte hain
- Admin/Manager sab tasks dekhte hain
- Others sirf apne tasks dekhte hain
- Performance stats (completion rate per employee)
- Issue create hone par automatically task banta hai

---

### Module 9: Issues (Client Issues)

**Kya karta hai:** Client ke problems aur complaints track karta hai.

**Key Features:**
- Client ke saath linked
- Sirf HARDWARE ya AGRONOMY role ko assign kar sakte hain
- Issue create hone par automatically HIGH priority task banta hai
- Status: OPEN → IN_PROGRESS → RESOLVED
- Client profile mein "Historical Pain Points" section

---

### Module 10: Field Reports

**Kya karta hai:** Agronomists ke field visits ka record rakhta hai.

**Report Types:**
- WEEKLY — Weekly report
- BI_WEEKLY — 2 hafte ka report
- FIELD_OPERATION — Field operation report
- QA — Quality assurance report

**Key Features:**
- Client aur device se linked
- File attachments support
- Client profile mein dikhta hai

---

### Module 11: Notifications

**Kya karta hai:** Users ko system alerts deta hai.

**Notification Types:** INFO, WARNING, ERROR, SUCCESS

**Key Features:**
- Per-user inbox
- Unread count badge
- Mark individual/all as read
- Delete notifications

---

### Module 12: Activity Logs (Audit Trail)

**Kya karta hai:** System mein har action ka permanent record rakhta hai.

**Logged Actions:** CREATE, UPDATE, DELETE, READ

**Key Features:**
- Immutable records (update nahi hote)
- Previous aur new values store hoti hain
- IP address record hota hai
- Admin/Manager sab logs dekhte hain
- Others sirf apne logs dekhte hain

---

### Module 13: Dashboard

**Kya karta hai:** System ka overview ek jagah dikhata hai.

**Role-based Stats:**
- Total Clients (sab)
- Active Leads (ADMIN, MANAGER, BUSINESS)
- Active Devices (ADMIN, MANAGER, HARDWARE, AGRONOMY)
- Inventory Items (ADMIN, MANAGER, HARDWARE)
- Monthly Revenue (ADMIN, MANAGER, ACCOUNTS)
- Overdue Invoices (ADMIN, MANAGER, ACCOUNTS)
- Pending Tasks (sab)
- Device Status Breakdown (sab)
- Task Status Breakdown (sab)

---

---

## 10. API Endpoints

> **Base URL:** `http://localhost:8000`
> **Auth:** Sab endpoints (siwa register/login/create-admin ke) mein `Authorization: Bearer <token>` header chahiye.

---

### 🔐 Authentication Endpoints

#### POST `/auth/register`
**Kya karta hai:** Naya user register karta hai

**Required Fields:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "full_name": "Ahmed Ali",
  "role": "EMPLOYEE"
}
```

**Role Options:** `ADMIN`, `MANAGER`, `BUSINESS`, `AGRONOMY`, `HARDWARE`, `ACCOUNTS`, `EMPLOYEE`

**Success Response (201):**
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "full_name": "Ahmed Ali",
  "role": "EMPLOYEE",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00"
}
```

**Error Cases:**
- `400` — Email already registered

---

#### POST `/auth/login`
**Kya karta hai:** Login karta hai, tokens return karta hai

**Content-Type:** `application/x-www-form-urlencoded` ⚠️ (JSON nahi!)

**Required Fields:**
```
username=user@example.com
password=securepassword123
```

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

**Error Cases:**
- `401` — Incorrect email or password
- `400` — Inactive user

**Postman mein kese test karein:**
1. Method: POST
2. URL: `http://localhost:8000/auth/login`
3. Body tab → `x-www-form-urlencoded`
4. Key: `username`, Value: `admin@example.com`
5. Key: `password`, Value: `yourpassword`

---

#### POST `/auth/refresh`
**Kya karta hai:** Naya access token leta hai

**Body:**
```json
{
  "refresh_token": "your-refresh-token-here"
}
```

**Success Response:** Naye access_token aur refresh_token

**Error Cases:**
- `401` — Invalid or expired refresh token

---

#### POST `/auth/logout`
**Kya karta hai:** Logout karta hai (refresh token revoke)

**Auth:** Bearer token required

**Body:**
```json
{
  "refresh_token": "your-refresh-token-here"
}
```

**Success Response:**
```json
{"message": "Successfully logged out"}
```

---

#### POST `/auth/create-admin`
**Kya karta hai:** Pehla admin user banata hai (initial setup ke liye)

**Query Parameters:**
```
?email=admin@crop2x.com&password=adminpass&full_name=Super Admin
```

**Note:** Yeh endpoint sirf ek baar use karna chahiye initial setup mein.

---

#### GET `/auth/me`
**Kya karta hai:** Current logged-in user ki info deta hai

**Auth:** Bearer token required

**Success Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "Ahmed Ali",
  "role": "ADMIN",
  "is_active": true
}
```

---

---

### 👥 Users Endpoints

#### GET `/users/`
**Kya karta hai:** Sare users ki list

**Roles:** ADMIN, MANAGER only

**Query Params:** `?skip=0&limit=100`

**Success Response:**
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "Ahmed Ali",
    "role": "HARDWARE",
    "is_active": true
  }
]
```

---

#### POST `/users/`
**Kya karta hai:** Naya user banata hai

**Roles:** ADMIN only

**Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "full_name": "Bilal Khan",
  "role": "HARDWARE",
  "is_active": true
}
```

**Error Cases:**
- `400` — Email already registered
- `403` — Not enough permissions

---

#### GET `/users/by-role/{role}`
**Kya karta hai:** Role ke hisaab se users filter karta hai

**Example:** `GET /users/by-role/HARDWARE`

**Use case:** Issue assign karte waqt HARDWARE/AGRONOMY users ki list lena

---

#### GET `/users/{user_id}`
**Kya karta hai:** Ek user ki detail

**Roles:** ADMIN, MANAGER

---

#### PATCH `/users/{user_id}`
**Kya karta hai:** User update karta hai

**Roles:** ADMIN only

**Body (sab optional):**
```json
{
  "email": "newemail@example.com",
  "full_name": "New Name",
  "role": "MANAGER",
  "is_active": true,
  "password": "newpassword"
}
```

---

#### DELETE `/users/{user_id}`
**Kya karta hai:** User delete ya deactivate karta hai

**Roles:** ADMIN only

**Logic:**
- Agar user ke koi records nahi → permanently delete
- Agar records hain → deactivate (is_active = false) + tokens revoke

**Error Cases:**
- `400` — Cannot delete yourself

---

---

### 🏢 Clients Endpoints

#### GET `/clients/`
**Kya karta hai:** Sare clients ki list

**Roles:** Sab (authenticated)

**Query Params:** `?skip=0&limit=100`

**Success Response:**
```json
[
  {
    "id": "uuid",
    "name": "Farmer Ahmed",
    "company_name": "Ahmed Farms",
    "farm_size": 50.5,
    "address": "Village Chak 10, Punjab",
    "contact_info": "0300-1234567",
    "onboarding_date": "2024-01-15",
    "services": ["IoT Monitoring", "Agronomy Support"],
    "created_at": "2024-01-15T10:00:00"
  }
]
```

---

#### POST `/clients/`
**Kya karta hai:** Naya client banata hai

**Roles:** ADMIN, MANAGER, BUSINESS

**Body:**
```json
{
  "name": "Farmer Ahmed",
  "company_name": "Ahmed Farms",
  "farm_size": 50.5,
  "address": "Village Chak 10, Punjab",
  "contact_info": "0300-1234567",
  "onboarding_date": "2024-01-15",
  "crop_cycle_end_date": "2024-06-30",
  "services": ["IoT Monitoring", "Agronomy Support"],
  "farm_location": "31.5204° N, 74.3587° E",
  "third_party_credentials": {"platform": "FarmOS", "api_key": "xxx"}
}
```

**Required:** `name`, `company_name`
**Optional:** Baaki sab

---

#### GET `/clients/{client_id}`
**Kya karta hai:** Ek client ki poori detail (devices ke saath)

**Roles:** Sab (authenticated)

---

#### PATCH `/clients/{client_id}`
**Kya karta hai:** Client update karta hai

**Roles:** ADMIN, MANAGER, BUSINESS

**Body (sab optional):**
```json
{
  "name": "Updated Name",
  "farm_size": 75.0,
  "services": ["IoT Monitoring"]
}
```

**Error Cases:**
- `404` — Client not found

---

#### DELETE `/clients/{client_id}`
**Kya karta hai:** Client delete karta hai

**Roles:** ADMIN, MANAGER, BUSINESS

**Error Cases:**
- `404` — Client not found

---

---

### 📊 Leads Endpoints

#### GET `/leads/`
**Kya karta hai:** Sare leads ki list

**Roles:** Sab (authenticated)

**Query Params:** `?skip=0&limit=100`

**Success Response:**
```json
[
  {
    "id": "uuid",
    "name": "Potential Client",
    "company_name": "XYZ Farms",
    "stage": "CONTACTED",
    "email": "contact@xyzfarms.com",
    "phone": "0321-9876543",
    "follow_up_date": "2024-02-01",
    "quotation_amount": 150000.00,
    "service_tags": ["IoT", "Agronomy"],
    "notes": "Interested in full package"
  }
]
```

---

#### POST `/leads/`
**Kya karta hai:** Naya lead banata hai

**Roles:** ADMIN, MANAGER, BUSINESS

**Body:**
```json
{
  "name": "Potential Client",
  "company_name": "XYZ Farms",
  "stage": "NEW_LEAD",
  "email": "contact@xyzfarms.com",
  "phone": "0321-9876543",
  "follow_up_date": "2024-02-01",
  "quotation_amount": 150000.00,
  "proposal_link": "https://docs.google.com/...",
  "service_tags": ["IoT", "Agronomy"],
  "notes": "Met at agriculture expo"
}
```

**Required:** `name`, `company_name`

---

#### PATCH `/leads/{lead_id}`
**Kya karta hai:** Lead update karta hai (stage change bhi)

**Roles:** ADMIN, MANAGER, BUSINESS

**Body (sab optional):**
```json
{
  "stage": "NEGOTIATION",
  "quotation_amount": 200000.00,
  "notes": "Negotiating on price"
}
```

**Stage Change Example (Kanban mein):**
```json
{"stage": "CONVERTED", "client_id": "existing-client-uuid"}
```

---

#### DELETE `/leads/{lead_id}`
**Kya karta hai:** Lead delete karta hai

**Roles:** ADMIN, MANAGER, BUSINESS

---

---

### 📱 Devices Endpoints

#### GET `/devices/`
**Kya karta hai:** Sare devices ki list

**Roles:** Sab (authenticated)

**Query Params:** `?skip=0&limit=100`

**Success Response:**
```json
[
  {
    "id": "uuid",
    "name": "Soil Sensor Unit A",
    "serial_number": "SN-2024-001",
    "status": "INSTALLED",
    "installation_location": "Field Block 3",
    "client_id": "client-uuid",
    "assigned_hardware_id": "user-uuid",
    "assigned_agronomist_id": "user-uuid",
    "notes": "Installed near irrigation pump"
  }
]
```

---

#### POST `/devices/`
**Kya karta hai:** Naya device banata hai

**Roles:** ADMIN, MANAGER, HARDWARE

**Body:**
```json
{
  "name": "Soil Sensor Unit B",
  "serial_number": "SN-2024-002",
  "status": "UNDER_DEVELOPMENT",
  "installation_location": null,
  "client_id": null,
  "assigned_hardware_id": "hardware-user-uuid",
  "assigned_agronomist_id": null,
  "notes": "New unit in development"
}
```

**Required:** `name`, `serial_number`

**Error Cases:**
- `400` — Serial number already exists

---

#### GET `/devices/{device_id}`
**Kya karta hai:** Ek device ki detail

**Roles:** Sab (authenticated)

---

#### GET `/devices/{device_id}/history`
**Kya karta hai:** Device ke status changes ki history

**Roles:** Sab (authenticated)

**Success Response:**
```json
[
  {
    "id": "uuid",
    "device_id": "device-uuid",
    "status": "INSTALLED",
    "changed_by_id": "user-uuid",
    "notes": "Installed at client farm",
    "created_at": "2024-01-20T14:30:00"
  }
]
```

---

#### PATCH `/devices/{device_id}`
**Kya karta hai:** Device update karta hai (status change history record hoti hai)

**Roles:** ADMIN, MANAGER, HARDWARE, AGRONOMY (ya assigned user)

**Body (sab optional):**
```json
{
  "status": "INSTALLED",
  "client_id": "client-uuid",
  "installation_location": "Field Block 5",
  "assigned_agronomist_id": "agronomist-uuid",
  "notes": "Installation complete"
}
```

**Note:** Jab bhi status change hota hai, `device_history` mein record banta hai.

---

---

### 📦 Inventory Endpoints

#### GET `/inventory/`
**Kya karta hai:** Sare inventory items ki list

**Roles:** Sab (authenticated)

**Success Response:**
```json
[
  {
    "id": "uuid",
    "name": "Soil Moisture Sensor",
    "sku": "SMS-001",
    "quantity": 25,
    "category": "Sensors",
    "vendor": "TechParts Ltd",
    "cost": 1500.00,
    "notes": "High precision sensors"
  }
]
```

---

#### POST `/inventory/`
**Kya karta hai:** Naya inventory item banata hai

**Roles:** ADMIN, MANAGER, HARDWARE

**Body:**
```json
{
  "name": "Temperature Sensor",
  "sku": "TS-002",
  "quantity": 50,
  "category": "Sensors",
  "vendor": "SensorWorld",
  "cost": 800.00,
  "notes": "For outdoor use"
}
```

**Required:** `name`, `sku`

**Error Cases:**
- `400` — SKU already exists

---

#### POST `/inventory/procure`
**Kya karta hai:** Procurement record karta hai (stock add hota hai)

**Roles:** ADMIN, MANAGER, HARDWARE

**Body:**
```json
{
  "item_id": "inventory-item-uuid",
  "vendor_details": "SensorWorld - Order #12345",
  "order_date": "2024-01-15",
  "batch_quantity": 100,
  "total_cost": 80000.00,
  "media_urls": ["https://storage.example.com/receipt.jpg"]
}
```

**Note:** `batch_quantity` automatically inventory quantity mein add ho jata hai.

---

#### GET `/inventory/{item_id}`
**Kya karta hai:** Item detail + procurement history

**Roles:** Sab (authenticated)

---

---

### 💰 Billing Endpoints

#### GET `/billing/invoices`
**Kya karta hai:** Invoices ki list

**Roles:** Sab (authenticated)

**Query Params:** `?client_id=uuid` (optional filter)

**Success Response:**
```json
[
  {
    "id": "uuid",
    "client_id": "client-uuid",
    "amount": 50000.00,
    "status": "SENT",
    "due_date": "2024-02-28",
    "file_path": "https://storage.example.com/invoice.pdf"
  }
]
```

---

#### POST `/billing/invoices`
**Kya karta hai:** Naya invoice banata hai

**Roles:** ADMIN, MANAGER, ACCOUNTS

**Body:**
```json
{
  "client_id": "client-uuid",
  "amount": 50000.00,
  "status": "DRAFT",
  "due_date": "2024-02-28"
}
```

**Required:** `client_id`, `amount`, `due_date`

---

#### POST `/billing/payments`
**Kya karta hai:** Payment record karta hai

**Roles:** ADMIN, MANAGER, ACCOUNTS

**Body:**
```json
{
  "client_id": "client-uuid",
  "invoice_id": "invoice-uuid",
  "amount": 25000.00,
  "payment_date": "2024-01-20"
}
```

**Required:** `client_id`, `invoice_id`, `amount`

---

#### GET `/billing/balance/{client_id}`
**Kya karta hai:** Client ka outstanding balance

**Roles:** Sab (authenticated)

**Success Response:**
```json
{
  "client_id": "uuid",
  "outstanding_balance": 25000.00
}
```

---

#### GET `/billing/clients/{client_id}/arrears`
**Kya karta hai:** Client ka detailed arrears breakdown

**Roles:** Sab (authenticated)

**Success Response:**
```json
{
  "client_id": "uuid",
  "client_name": "Ahmed Farms",
  "total_invoiced": 100000.00,
  "total_paid": 75000.00,
  "outstanding_balance": 25000.00,
  "arrears": 25000.00
}
```

---

#### GET `/billing/overdue`
**Kya karta hai:** Sare overdue invoices ki list

**Roles:** Sab (authenticated)

**Success Response:**
```json
{
  "count": 3,
  "invoices": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "amount": 50000.00,
      "due_date": "2024-01-01",
      "status": "OVERDUE"
    }
  ]
}
```

---

---

### ✅ Tasks Endpoints

#### GET `/tasks/`
**Kya karta hai:** Tasks ki list

**Roles:** Sab (authenticated)
- ADMIN/MANAGER → sare tasks
- Others → sirf apne tasks

**Success Response:**
```json
[
  {
    "id": "uuid",
    "title": "Install sensor at Block 3",
    "description": "Install soil moisture sensor",
    "status": "PENDING",
    "priority": "HIGH",
    "due_date": "2024-02-01T00:00:00",
    "assigned_to_id": "user-uuid",
    "device_id": "device-uuid",
    "client_id": "client-uuid"
  }
]
```

---

#### POST `/tasks/`
**Kya karta hai:** Naya task banata hai

**Roles:** ADMIN, MANAGER, BUSINESS

**Body:**
```json
{
  "title": "Install sensor at Block 3",
  "description": "Install soil moisture sensor near irrigation pump",
  "status": "PENDING",
  "priority": "HIGH",
  "due_date": "2024-02-01T00:00:00",
  "assigned_to_id": "user-uuid",
  "device_id": "device-uuid",
  "client_id": "client-uuid"
}
```

**Required:** `title`, `assigned_to_id`

---

#### PATCH `/tasks/{task_id}`
**Kya karta hai:** Task update karta hai

**Roles:** ADMIN/MANAGER (koi bhi task) ya assigned user (apna task)

**Body (sab optional):**
```json
{
  "status": "IN_PROGRESS",
  "priority": "MEDIUM",
  "description": "Updated description"
}
```

**Error Cases:**
- `403` — Not authorized to update this task
- `404` — Task not found

---

#### GET `/tasks/performance`
**Kya karta hai:** Employee performance stats (task completion rate)

**Roles:** ADMIN, MANAGER only

**Success Response:**
```json
[
  {
    "user_id": "uuid",
    "user_name": "Ahmed Ali",
    "total_tasks": 20,
    "completed_tasks": 15,
    "completion_rate": 75.0
  }
]
```

---

---

### 🔧 Issues Endpoints

#### GET `/clients/{client_id}/issues`
**Kya karta hai:** Client ke sare issues

**Roles:** Sab (authenticated)

**Success Response:**
```json
[
  {
    "id": "uuid",
    "client_id": "client-uuid",
    "title": "Sensor not sending data",
    "description": "Sensor offline since 3 days",
    "status": "OPEN",
    "priority": "HIGH",
    "assigned_to_id": "hardware-user-uuid"
  }
]
```

---

#### POST `/clients/{client_id}/issues`
**Kya karta hai:** Client ke liye naya issue banata hai

**Roles:** ADMIN, MANAGER, BUSINESS

**Body:**
```json
{
  "title": "Sensor not sending data",
  "description": "Sensor offline since 3 days",
  "status": "OPEN",
  "priority": "HIGH",
  "assigned_to_id": "hardware-user-uuid"
}
```

**Required:** `title`

**Important Rules:**
- `assigned_to_id` sirf HARDWARE ya AGRONOMY role ka user ho sakta hai
- Agar `assigned_to_id` diya → automatically HIGH priority task banta hai

**Error Cases:**
- `400` — Assigned user must be a Hardware or Agronomy resource

---

#### PATCH `/issues/{issue_id}`
**Kya karta hai:** Issue update karta hai

**Roles:** ADMIN/MANAGER (koi bhi) ya assigned user (apna)

**Body (sab optional):**
```json
{
  "status": "IN_PROGRESS",
  "priority": "MEDIUM",
  "assigned_to_id": "another-hardware-uuid"
}
```

---

#### DELETE `/issues/{issue_id}`
**Kya karta hai:** Issue delete karta hai

**Roles:** ADMIN only

---

---

### 🔔 Notifications Endpoints

#### GET `/notifications/`
**Kya karta hai:** Current user ki notifications

**Roles:** Sab (authenticated)

**Success Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "user-uuid",
    "title": "New Task Assigned",
    "message": "You have been assigned a new task",
    "type": "INFO",
    "is_read": false,
    "link": "/tasks/task-uuid"
  }
]
```

---

#### GET `/notifications/unread-count`
**Kya karta hai:** Unread notifications ki count

**Success Response:**
```json
{"unread_count": 5}
```

---

#### PATCH `/notifications/{notification_id}`
**Kya karta hai:** Notification mark as read/unread

**Body:**
```json
{"is_read": true}
```

---

#### POST `/notifications/mark-all-read`
**Kya karta hai:** Sari notifications mark as read

---

#### DELETE `/notifications/{notification_id}`
**Kya karta hai:** Notification delete karta hai

---

### 📋 Activity Logs Endpoints

#### GET `/activity-logs/`
**Kya karta hai:** Sare activity logs (Admin/Manager)

**Roles:** ADMIN, MANAGER

**Query Params:**
- `?entity_type=Client` — filter by entity
- `?entity_id=uuid` — filter by specific record
- `?user_id=uuid` — filter by user

**Success Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "user-uuid",
    "user_name": "Ahmed Ali",
    "action": "CREATE",
    "entity_type": "Client",
    "entity_id": "client-uuid",
    "description": "Created client 'Ahmed Farms'",
    "previous_value": null,
    "new_value": null,
    "created_at": "2024-01-15T10:00:00"
  }
]
```

---

#### GET `/activity-logs/my-activity`
**Kya karta hai:** Current user ke apne actions

**Roles:** Sab (authenticated)

---

### 📊 Dashboard Endpoints

#### GET `/dashboard/stats`
**Kya karta hai:** Role-based KPI stats

**Roles:** Sab (authenticated)

**Success Response (ADMIN ke liye):**
```json
{
  "total_clients": 45,
  "active_leads": 12,
  "active_devices": 38,
  "inventory_items": 150,
  "monthly_revenue": 2500000.00,
  "overdue_invoices": 3,
  "pending_tasks": 8,
  "device_status_breakdown": {
    "INSTALLED": 38,
    "UNDER_DEVELOPMENT": 5,
    "QA_FOR_AGRONOMIST": 2
  },
  "task_status_breakdown": {
    "PENDING": 8,
    "IN_PROGRESS": 5,
    "COMPLETED": 42
  }
}
```

---

#### GET `/dashboard/recent-activity`
**Kya karta hai:** Recent devices, tasks, clients

**Query Params:** `?limit=10`

---

#### GET `/dashboard/alerts`
**Kya karta hai:** Critical alerts (overdue invoices, high priority tasks)

**Success Response:**
```json
{
  "alerts": [
    {
      "type": "overdue_invoice",
      "severity": "high",
      "message": "Invoice #abc12345 is overdue",
      "entity_id": "invoice-uuid"
    },
    {
      "type": "high_priority_task",
      "severity": "medium",
      "message": "High priority task: Fix sensor connection",
      "entity_id": "task-uuid"
    }
  ]
}
```

---

### 📁 Reports Endpoints

#### GET `/reports/`
**Kya karta hai:** Sare field reports

**Query Params:** `?client_id=uuid`

---

#### POST `/reports/`
**Kya karta hai:** Naya field report banata hai

**Roles:** ADMIN, MANAGER, AGRONOMY

**Body:**
```json
{
  "client_id": "client-uuid",
  "device_id": "device-uuid",
  "report_type": "WEEKLY",
  "title": "Weekly Field Report - Jan 2024",
  "summary": "All sensors working normally",
  "notes": "Soil moisture levels optimal",
  "report_date": "2024-01-20",
  "attachments": ["https://storage.example.com/photo1.jpg"]
}
```

**Required:** `client_id`, `report_type`, `title`, `report_date`

---

### 📤 Upload Endpoints

#### POST `/uploads/invoices/{invoice_id}/upload`
**Kya karta hai:** Invoice PDF upload karta hai

**Roles:** ADMIN, MANAGER, ACCOUNTS

**Content-Type:** `multipart/form-data`

**Form Field:** `file` (PDF file)

---

#### POST `/uploads/inventory/upload-media`
**Kya karta hai:** Inventory/procurement photos upload karta hai

**Roles:** ADMIN, MANAGER, HARDWARE, ACCOUNTS

**Content-Type:** `multipart/form-data`

**Form Field:** `file` (image file)

---

---

## 11. Frontend Pages Testing Guide

### Step 1: System Start Karna

**Backend start karna:**
```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

**Frontend start karna:**
```bash
cd frontend
npm run dev
```

**Swagger UI check karna:**
Browser mein jao: `http://localhost:8000/docs`

---

### Step 2: Login Page Test (`/login`)

1. Browser mein `http://localhost:3000/login` kholo
2. **Test 1 — Wrong credentials:**
   - Email: `wrong@email.com`, Password: `wrongpass`
   - Expected: Error message "Incorrect email or password"
3. **Test 2 — Correct credentials:**
   - Admin email aur password dalo
   - Expected: Dashboard par redirect
4. **Check karo:** Browser DevTools → Application → Local Storage
   - `access_token` aur `refresh_token` save hone chahiye

---

### Step 3: Dashboard Test (`/dashboard`)

1. Login ke baad dashboard par jao
2. **Check karo:**
   - Stats cards dikh rahe hain (Total Clients, Pending Tasks, etc.)
   - Charts render ho rahe hain
   - Alerts section mein koi alerts hain to dikh rahe hain
   - Recent Activity section mein data hai
3. **Role test:** ACCOUNTS role se login karo
   - Expected: Monthly Revenue aur Overdue Invoices dikhne chahiye
   - Expected: Active Leads nahi dikhna chahiye

---

### Step 4: Clients Page Test (`/clients`)

1. `/clients` par jao
2. **Test — New Client:**
   - "New Client" button click karo
   - Form fill karo: Name, Company Name (required)
   - Submit karo
   - Expected: Client list mein naya client dikh jaye
3. **Test — Client Profile:**
   - Kisi client par click karo
   - Expected: `/clients/[id]` par jao
   - Tabs check karo: Overview, Devices, Invoices, Issues, Reports
4. **Test — Edit Client:**
   - Edit button click karo
   - Koi field change karo
   - Save karo
   - Expected: Updated data dikh jaye
5. **Test — Delete Client:**
   - Delete button click karo
   - Confirm karo
   - Expected: Client list se remove ho jaye

---

### Step 5: Leads Kanban Test (`/leads`)

1. `/leads` par jao
2. **Check karo:** 5 columns dikh rahe hain
3. **Test — New Lead:**
   - "New Lead" button click karo
   - Form fill karo
   - Submit karo
   - Expected: NEW_LEAD column mein card dikh jaye
4. **Test — Stage Change:**
   - Lead card par stage change button click karo
   - Expected: Card dusre column mein move ho jaye
   - Backend mein `PATCH /leads/{id}` call honi chahiye

---

### Step 6: Devices Test (`/devices`)

1. `/devices` par jao
2. **Test — New Device:**
   - "New Device" button click karo
   - Name aur Serial Number fill karo (required)
   - Submit karo
3. **Test — Device Detail:**
   - Device par click karo
   - History timeline check karo
4. **Test — Status Update:**
   - Edit button click karo
   - Status change karo (e.g., UNDER_DEVELOPMENT → QA_FOR_AGRONOMIST)
   - Save karo
   - Expected: History mein naya entry dikh jaye

---

### Step 7: Tasks Test (`/tasks`)

1. `/tasks` par jao
2. **Check karo:** 3 columns (PENDING, IN_PROGRESS, COMPLETED)
3. **Test — New Task:**
   - "New Task" button click karo
   - Title aur Assigned To fill karo (required)
   - Submit karo
4. **Test — Status Update:**
   - Task card par status dropdown click karo
   - Status change karo
   - Expected: Card dusre column mein move ho jaye
5. **Role test:** HARDWARE user se login karo
   - Expected: Sirf apne tasks dikhne chahiye

---

### Step 8: Billing Test (`/billing`)

1. `/billing` par jao (ACCOUNTS ya ADMIN se login karo)
2. **Test — New Invoice:**
   - "New Invoice" button click karo
   - Client select karo, amount aur due date dalo
   - Submit karo
3. **Test — Record Payment:**
   - "Record Payment" button click karo
   - Invoice select karo, amount dalo
   - Submit karo
4. **Check karo:** Client profile mein arrears update ho gaye

---

### Step 9: Inventory Test (`/inventory`)

1. `/inventory` par jao (HARDWARE ya ADMIN se login karo)
2. **Test — New Item:**
   - "Add Item" button click karo
   - Name aur SKU fill karo
   - Submit karo
3. **Test — Procure:**
   - "Procure" button click karo
   - Item select karo, quantity dalo
   - Submit karo
   - Expected: Item ki quantity increase ho jaye

---

### Step 10: Users Test (`/users`)

1. `/users` par jao (ADMIN se login karo)
2. **Test — New User:**
   - "New User" button click karo
   - Email, password, name, role fill karo
   - Submit karo
3. **Test — Edit User:**
   - User edit karo (role change karo)
   - Save karo
4. **Test — Delete User:**
   - User delete karo
   - Expected: Agar records hain → deactivated, nahi hain → deleted

---

---

## 12. Postman Testing Guide

### Setup: Environment Variables

Postman mein ek environment banao "Crop2X CRM":

| Variable | Value |
|----------|-------|
| `base_url` | `http://localhost:8000` |
| `access_token` | (login ke baad yahan paste karo) |
| `refresh_token` | (login ke baad yahan paste karo) |

### Authorization Setup

Postman Collection mein:
1. Collection → Edit → Authorization tab
2. Type: `Bearer Token`
3. Token: `{{access_token}}`

---

### Test 1: Admin User Banana (First Time Setup)

```
Method: POST
URL: {{base_url}}/auth/create-admin?email=admin@crop2x.com&password=Admin@123&full_name=Super Admin
Body: None
```

---

### Test 2: Login

```
Method: POST
URL: {{base_url}}/auth/login
Body: x-www-form-urlencoded
  username: admin@crop2x.com
  password: Admin@123
```

**Response se tokens copy karo aur environment variables mein paste karo.**

---

### Test 3: Current User Check

```
Method: GET
URL: {{base_url}}/auth/me
Headers: Authorization: Bearer {{access_token}}
```

---

### Test 4: Client Banana

```
Method: POST
URL: {{base_url}}/clients/
Headers: Authorization: Bearer {{access_token}}
Body: JSON
{
  "name": "Test Farmer",
  "company_name": "Test Farms Ltd",
  "farm_size": 100.0,
  "contact_info": "0300-1234567",
  "services": ["IoT Monitoring"]
}
```

---

### Test 5: Lead Banana

```
Method: POST
URL: {{base_url}}/leads/
Headers: Authorization: Bearer {{access_token}}
Body: JSON
{
  "name": "Potential Client",
  "company_name": "Future Farms",
  "stage": "NEW_LEAD",
  "email": "future@farms.com",
  "phone": "0321-9876543",
  "quotation_amount": 200000
}
```

---

### Test 6: Device Banana

```
Method: POST
URL: {{base_url}}/devices/
Headers: Authorization: Bearer {{access_token}}
Body: JSON
{
  "name": "Soil Sensor Alpha",
  "serial_number": "SN-TEST-001",
  "status": "UNDER_DEVELOPMENT"
}
```

---

### Test 7: Task Banana

```
Method: POST
URL: {{base_url}}/tasks/
Headers: Authorization: Bearer {{access_token}}
Body: JSON
{
  "title": "Test Task",
  "description": "This is a test task",
  "status": "PENDING",
  "priority": "HIGH",
  "assigned_to_id": "USER-UUID-HERE"
}
```

---

### Test 8: Invoice Banana

```
Method: POST
URL: {{base_url}}/billing/invoices
Headers: Authorization: Bearer {{access_token}}
Body: JSON
{
  "client_id": "CLIENT-UUID-HERE",
  "amount": 50000.00,
  "status": "SENT",
  "due_date": "2024-03-31"
}
```

---

### Test 9: Dashboard Stats

```
Method: GET
URL: {{base_url}}/dashboard/stats
Headers: Authorization: Bearer {{access_token}}
```

---

### Test 10: Permission Test (403 Error)

EMPLOYEE user se login karo, phir:
```
Method: POST
URL: {{base_url}}/clients/
Headers: Authorization: Bearer {{employee_access_token}}
Body: JSON {...}
```
Expected: `403 Forbidden — Not enough permissions`

---

### Swagger UI Se Testing

1. `http://localhost:8000/docs` kholo
2. "Authorize" button click karo
3. `Bearer <your_access_token>` dalo
4. Koi bhi endpoint expand karo
5. "Try it out" click karo
6. Parameters fill karo
7. "Execute" click karo
8. Response dekho

---

---

## 13. Step-by-Step Manual Testing Checklist

### ✅ Phase 1: System Setup Check

- [ ] Backend server start ho raha hai (`uvicorn app.main:app --reload`)
- [ ] Frontend server start ho raha hai (`npm run dev`)
- [ ] `http://localhost:8000/docs` Swagger UI khul raha hai
- [ ] `http://localhost:8000/` root endpoint `{"message": "Welcome to Crop2x CRM API"}` return kar raha hai
- [ ] Database connection sahi hai (koi error nahi)

---

### ✅ Phase 2: Authentication Tests

- [ ] `POST /auth/create-admin` se admin user ban gaya
- [ ] `POST /auth/login` se tokens mil rahe hain
- [ ] `GET /auth/me` correct user info return kar raha hai
- [ ] Wrong password par `401` error aa raha hai
- [ ] `POST /auth/refresh` se naya token mil raha hai
- [ ] `POST /auth/logout` ke baad refresh token kaam nahi karta
- [ ] Frontend login form kaam kar raha hai
- [ ] Login ke baad dashboard par redirect ho raha hai
- [ ] Logout ke baad login page par redirect ho raha hai

---

### ✅ Phase 3: Role Permission Tests

- [ ] ADMIN se login → sab menu items dikh rahe hain
- [ ] BUSINESS se login → Leads, Clients, Tasks dikh rahe hain, Billing nahi
- [ ] HARDWARE se login → Devices, Inventory dikh rahe hain, Leads nahi
- [ ] ACCOUNTS se login → Billing dikh raha hai, Leads nahi
- [ ] EMPLOYEE se login → sirf Tasks aur Notifications
- [ ] EMPLOYEE se `POST /clients/` → `403 Forbidden` aata hai
- [ ] BUSINESS se `POST /devices/` → `403 Forbidden` aata hai

---

### ✅ Phase 4: Clients Module Tests

- [ ] `GET /clients/` sare clients return kar raha hai
- [ ] `POST /clients/` naya client ban raha hai
- [ ] `GET /clients/{id}` correct client return kar raha hai
- [ ] `PATCH /clients/{id}` client update ho raha hai
- [ ] `DELETE /clients/{id}` client delete ho raha hai
- [ ] Wrong ID par `404` error aa raha hai
- [ ] Frontend client list dikh rahi hai
- [ ] Frontend new client form submit ho raha hai
- [ ] Frontend client profile page sab tabs ke saath kaam kar raha hai

---

### ✅ Phase 5: Leads Module Tests

- [ ] `GET /leads/` sare leads return kar raha hai
- [ ] `POST /leads/` naya lead ban raha hai
- [ ] `PATCH /leads/{id}` stage change ho raha hai
- [ ] `DELETE /leads/{id}` lead delete ho raha hai
- [ ] Frontend kanban board 5 columns dikh raha hai
- [ ] Stage change karne par card move ho raha hai
- [ ] Activity log mein lead actions record ho rahe hain

---

### ✅ Phase 6: Devices Module Tests

- [ ] `GET /devices/` sare devices return kar raha hai
- [ ] `POST /devices/` naya device ban raha hai
- [ ] Duplicate serial number par `400` error aa raha hai
- [ ] `GET /devices/{id}/history` history return kar raha hai
- [ ] `PATCH /devices/{id}` status change hone par history record ban raha hai
- [ ] Frontend device list dikh rahi hai
- [ ] Frontend device detail page history timeline ke saath kaam kar raha hai

---

### ✅ Phase 7: Inventory Module Tests

- [ ] `GET /inventory/` sare items return kar raha hai
- [ ] `POST /inventory/` naya item ban raha hai
- [ ] Duplicate SKU par `400` error aa raha hai
- [ ] `POST /inventory/procure` procurement record ban raha hai
- [ ] Procurement ke baad item quantity increase ho rahi hai
- [ ] Frontend inventory list dikh rahi hai
- [ ] Low stock warning (< 10) dikh raha hai

---

### ✅ Phase 8: Billing Module Tests

- [ ] `POST /billing/invoices` invoice ban raha hai
- [ ] `POST /billing/payments` payment record ho raha hai
- [ ] `GET /billing/balance/{client_id}` correct balance return kar raha hai
- [ ] `GET /billing/clients/{id}/arrears` correct arrears return kar raha hai
- [ ] `GET /billing/overdue` overdue invoices return kar raha hai
- [ ] Frontend billing page invoices dikh rahi hain
- [ ] Client profile mein arrears dikh raha hai

---

### ✅ Phase 9: Tasks Module Tests

- [ ] `GET /tasks/` ADMIN ko sare tasks dikh rahe hain
- [ ] `GET /tasks/` EMPLOYEE ko sirf apne tasks dikh rahe hain
- [ ] `POST /tasks/` naya task ban raha hai
- [ ] `PATCH /tasks/{id}` status update ho raha hai
- [ ] Assigned user apna task update kar sakta hai
- [ ] Non-assigned user dusre ka task update nahi kar sakta (`403`)
- [ ] `GET /tasks/performance` ADMIN ko stats dikh rahe hain
- [ ] Frontend task board 3 columns ke saath kaam kar raha hai

---

### ✅ Phase 10: Issues Module Tests

- [ ] `POST /clients/{id}/issues` issue ban raha hai
- [ ] Issue create hone par automatically task ban raha hai
- [ ] Non-HARDWARE/AGRONOMY user ko assign karne par `400` error
- [ ] `PATCH /issues/{id}` issue update ho raha hai
- [ ] `DELETE /issues/{id}` sirf ADMIN kar sakta hai
- [ ] Client profile mein issues dikh rahe hain

---

### ✅ Phase 11: Dashboard Tests

- [ ] `GET /dashboard/stats` role-based stats return kar raha hai
- [ ] ADMIN ko sab stats dikh rahe hain
- [ ] ACCOUNTS ko revenue dikh raha hai, leads nahi
- [ ] `GET /dashboard/alerts` overdue invoices aur high priority tasks dikh rahe hain
- [ ] `GET /dashboard/recent-activity` recent items return kar raha hai
- [ ] Frontend dashboard charts render ho rahe hain

---

### ✅ Phase 12: Activity Logs Tests

- [ ] Har create/update/delete action ke baad log ban raha hai
- [ ] `GET /activity-logs/` ADMIN ko sab logs dikh rahe hain
- [ ] `GET /activity-logs/my-activity` user ko sirf apne logs dikh rahe hain
- [ ] EMPLOYEE ko `/activity-logs/` par `403` aata hai
- [ ] Frontend activity log feed kaam kar rahi hai

---

### ✅ Phase 13: Notifications Tests

- [ ] `GET /notifications/` user ki notifications return kar raha hai
- [ ] `GET /notifications/unread-count` correct count return kar raha hai
- [ ] `PATCH /notifications/{id}` mark as read kaam kar raha hai
- [ ] `POST /notifications/mark-all-read` sab read ho rahe hain
- [ ] `DELETE /notifications/{id}` notification delete ho rahi hai

---

### ✅ Phase 14: Rate Limiting Test

- [ ] 100 se zyada requests per minute bhejne par `429 Too Many Requests` aata hai

---

### ✅ Phase 15: Token Expiry Test

- [ ] Access token expire hone ke baad (30 min) auto-refresh kaam karta hai
- [ ] Refresh token revoke hone ke baad login page par redirect hota hai

---

## Common Error Codes Reference

| Code | Matlab |
|------|--------|
| `200` | Success |
| `201` | Created (naya record ban gaya) |
| `400` | Bad Request (galat data) |
| `401` | Unauthorized (token nahi ya invalid) |
| `403` | Forbidden (permission nahi) |
| `404` | Not Found (record nahi mila) |
| `422` | Validation Error (required field missing) |
| `429` | Too Many Requests (rate limit) |
| `500` | Internal Server Error (backend mein kuch gaya) |

---

## Quick Reference: Kaunsa Role Kya Kar Sakta Hai

```
ADMIN      → Sab kuch
MANAGER    → ADMIN jaisa (sirf user hard-delete nahi)
BUSINESS   → Clients + Leads + Tasks + Issues
AGRONOMY   → Devices (update) + Reports + Tasks
HARDWARE   → Devices (full) + Inventory + Tasks
ACCOUNTS   → Billing + Clients (read) + Tasks
EMPLOYEE   → Sirf apne Tasks + Notifications
```

---

*Documentation Version: 1.0 | System: Crop2X CRM v1.0.0*
