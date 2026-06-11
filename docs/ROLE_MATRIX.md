# Crop2X CRM — Role Access Matrix

| Module | ADMIN | MANAGER | BUSINESS | AGRONOMY | HARDWARE | ACCOUNTS | EMPLOYEE |
|--------|-------|---------|----------|----------|----------|----------|----------|
| Dashboard | Full | Full | Business | Agronomy | Hardware | Accounts | Tasks only |
| Users | CRUD | Read | — | — | — | — | — |
| Clients | CRUD | CRUD | Create/Edit | Read | — | Read | — |
| Client Delete | Yes | Yes | No | No | No | No | No |
| Leads | CRUD | CRUD | CRUD | — | — | — | — |
| Lead Delete | Yes | Yes | No | No | No | No | No |
| Issues | CRUD | CRUD | Create/Update | Read | Read | — | — |
| Devices | CRUD | CRUD | — | Read/Status | CRUD | — | — |
| Device Delete | Yes | Yes | No | No | No | No | No |
| Field Reports | CRUD | CRUD | — | CRUD | — | — | — |
| Inventory / Components | CRUD | CRUD | — | — | CRUD | — | — |
| Billing | CRUD | CRUD | — | — | — | CRUD | — |
| Invoice Delete | Yes | Yes | No | No | No | No | No |
| Tasks | All | All | Create | Own | Own | Own | Own |
| Performance | All staff | All staff | Self | Self | Self | Self | Self |
| Activity Logs | All | All | — | — | — | — | — |
| Notifications | Own | Own | Own | Own | Own | Own | Own |

## Implementation Reference

- Backend RBAC constants: `backend/app/core/rbac.py`
- Frontend route map: `frontend/lib/rbac.ts`
- API guards: `check_role()` in each router

## Security Notes

- Public registration: disabled by default (`ALLOW_PUBLIC_REGISTER=false`)
- Public registration role: `EMPLOYEE` only when enabled
- Admin bootstrap: `POST /auth/create-admin` (first admin only, then requires `X-Setup-Secret`)
