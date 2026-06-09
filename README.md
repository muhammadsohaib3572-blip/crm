# Crop2X Internal CRM & Operations Management System

A comprehensive, production-ready CRM and operations management system built for hardware and agriculture operations.

## 🚀 Tech Stack

### Backend
- **Framework:** FastAPI
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy (Async)
- **Migrations:** Alembic
- **Authentication:** JWT (Access + Refresh Tokens)
- **Password Hashing:** Bcrypt via Passlib
- **Validation:** Pydantic v2

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** ShadCN UI
- **State Management:** Zustand
- **API Client:** Axios
- **Data Fetching:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts

## 📋 Features

### ✅ Implemented Features

#### 1. Device & Inventory Tracking
- Device lifecycle management with 5 statuses
- Device history/audit trail
- Client assignment and location tracking
- Serial number tracking

#### 2. Task Management
- Task assignment to employees
- Task statuses (Pending, In Progress, Completed)
- Priority levels (Low, Medium, High)
- Performance tracking endpoint

#### 3. Client & Lead Management
- Client profiles with farm size and contact info
- Lead pipeline with stages
- Issue/feedback logging for clients

#### 4. Billing & Accounts
- Invoice management with statuses
- Payment tracking
- Onboarding date tracking

#### 5. Raw Component & Procurement Inventory
- Component stock levels
- Procurement history with vendor details
- Media URL storage for component photos

#### 6. Authentication & Security
- JWT access tokens
- Refresh token rotation
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Rate limiting middleware
- Error handling middleware
- Request logging middleware

#### 7. Notifications System
- User notifications with types (INFO, WARNING, ERROR, SUCCESS)
- Unread count tracking
- Mark as read/unread
- Bulk notification creation

#### 8. Activity Logs
- Comprehensive audit trail
- Track all user actions
- Filter by entity type, user, date

#### 9. Dashboard APIs
- Real-time statistics
- Recent activity feed
- Critical alerts

#### 10. User Management
- Full CRUD operations (Admin only)
- Role management
- User activation/deactivation

## 🗄️ Database Schema

### Core Tables
- `users` - User accounts with roles
- `clients` - Client profiles
- `leads` - Sales pipeline
- `client_issues` - Support tickets
- `devices` - Hardware devices
- `device_history` - Device audit trail
- `tasks` - Task assignments
- `invoices` - Billing invoices
- `payments` - Payment records
- `inventory_items` - Raw components
- `procurements` - Procurement history
- `notifications` - User notifications
- `activity_logs` - System audit logs
- `refresh_tokens` - JWT refresh tokens

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment variables:**
Create a `.env` file in the backend directory:
```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/crop2x_crm
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

5. **Run database migrations:**
```bash
# Initialize database schema
alembic upgrade head
```

6. **Start the backend server:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
API Documentation (Swagger): `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. **Start the development server:**
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login (returns access + refresh tokens)
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout (revoke refresh token)
- `GET /auth/me` - Get current user

### Users (Admin/Manager only)
- `GET /users` - List all users
- `POST /users` - Create user
- `GET /users/{id}` - Get user by ID
- `PATCH /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

### Devices
- `GET /devices` - List devices (with pagination)
- `POST /devices` - Create device
- `GET /devices/{id}` - Get device details
- `PATCH /devices/{id}` - Update device

### Clients
- `GET /clients` - List clients
- `POST /clients` - Create client
- `GET /clients/{id}` - Get client details
- `PATCH /clients/{id}` - Update client

### Leads
- `GET /leads` - List leads
- `POST /leads` - Create lead
- `PATCH /leads/{id}` - Update lead

### Tasks
- `GET /tasks` - List tasks
- `POST /tasks` - Create task
- `PATCH /tasks/{id}` - Update task
- `GET /tasks/performance` - Get employee performance stats

### Billing
- `GET /billing/invoices` - List invoices
- `POST /billing/invoices` - Create invoice
- `GET /billing/payments` - List payments
- `POST /billing/payments` - Record payment

### Inventory
- `GET /inventory` - List inventory items
- `POST /inventory` - Add inventory item
- `GET /inventory/procurements` - List procurements
- `POST /inventory/procurements` - Record procurement

### Notifications
- `GET /notifications` - Get user notifications
- `GET /notifications/unread-count` - Get unread count
- `PATCH /notifications/{id}` - Mark as read/unread
- `POST /notifications/mark-all-read` - Mark all as read
- `DELETE /notifications/{id}` - Delete notification

### Activity Logs (Admin/Manager only)
- `GET /activity-logs` - Get all activity logs (with filters)
- `GET /activity-logs/my-activity` - Get current user's activity

### Dashboard
- `GET /dashboard/stats` - Get dashboard statistics
- `GET /dashboard/recent-activity` - Get recent activity
- `GET /dashboard/alerts` - Get critical alerts

## 🔐 Authentication Flow

1. **Register/Login:** User receives `access_token` and `refresh_token`
2. **API Requests:** Include `Authorization: Bearer {access_token}` header
3. **Token Expiry:** When access token expires (30 min), use refresh token
4. **Refresh:** Call `/auth/refresh` with refresh token to get new tokens
5. **Logout:** Call `/auth/logout` to revoke refresh token

## 👥 User Roles

- **ADMIN** - Full system access
- **MANAGER** - Manage users, view all data
- **EMPLOYEE** - Basic access, own tasks
- **AGRONOMIST** - Device QA, field operations
- **SALES_REP** - Lead and client management

## 🔄 Database Migrations

### Create a new migration:
```bash
alembic revision --autogenerate -m "Description of changes"
```

### Apply migrations:
```bash
alembic upgrade head
```

### Rollback last migration:
```bash
alembic downgrade -1
```

### View migration history:
```bash
alembic history
```

## 📦 Project Structure

### Backend
```
backend/
├── alembic/              # Database migrations
├── app/
│   ├── core/            # Config, security
│   ├── database/        # Database session
│   ├── middleware/      # Rate limit, error handling, logging
│   ├── models/          # SQLAlchemy models
│   ├── repositories/    # Data access layer
│   ├── routers/         # API endpoints
│   ├── schemas/         # Pydantic schemas
│   ├── services/        # Business logic
│   └── main.py          # FastAPI app
├── .env                 # Environment variables
├── alembic.ini          # Alembic configuration
└── requirements.txt     # Python dependencies
```

### Frontend
```
frontend/
├── app/                 # Next.js App Router pages
│   ├── dashboard/
│   ├── devices/
│   ├── clients/
│   ├── tasks/
│   ├── billing/
│   ├── inventory/
│   ├── leads/
│   └── login/
├── components/          # Reusable components
│   └── layout/
├── modules/             # Feature modules
├── services/            # API services
├── store/               # Zustand stores
└── types/               # TypeScript types
```

## 🚧 Known Limitations & Future Enhancements

### Missing Features (To Be Implemented)
1. File upload functionality (invoices, component photos)
2. Device history detail endpoint
3. Arrears calculation for billing
4. Search/filter/sort on all endpoints
5. Soft delete support
6. Export functionality (CSV, PDF)
7. Email notifications
8. Password reset flow
9. Frontend form validation (React Hook Form + Zod)
10. Loading states and error boundaries
11. Mobile responsive design improvements

### Security Improvements Needed
1. Replace CORS `allow_origins=["*"]` with specific origins
2. Add CSRF protection
3. Implement password complexity requirements
4. Add account lockout after failed attempts
5. Add email verification
6. Use secrets manager in production

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Update CORS origins
3. Run migrations: `alembic upgrade head`
4. Use production WSGI server (Gunicorn + Uvicorn workers)

### Frontend Deployment
1. Build production bundle: `npm run build`
2. Deploy to Vercel/Netlify or use `npm start`

## 📝 License

Proprietary - Crop2X Internal Use Only

## 👨‍💻 Development Team

- Backend: FastAPI + PostgreSQL
- Frontend: Next.js + TypeScript
- Database: PostgreSQL with Alembic migrations

## 📞 Support

For issues or questions, contact the development team.

---

**Last Updated:** 2026-05-20
**Version:** 1.0.0
**Status:** ✅ Production Ready (with noted limitations)
