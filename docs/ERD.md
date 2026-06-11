# Crop2X CRM — Entity Relationship Diagram

## Core Entities

```mermaid
erDiagram
    users ||--o{ tasks : assigned_to
    users ||--o{ client_issues : assigned_to
    users ||--o{ field_reports : created_by
    users ||--o{ audit_log : user_id
    users ||--o{ notifications : user_id

    clients ||--o{ devices : has
    clients ||--o{ leads : converted_from
    clients ||--o{ client_issues : has
    clients ||--o{ invoices : billed
    clients ||--o{ payments : pays
    clients ||--o{ field_reports : has

    devices ||--o{ device_status_history : history
    devices ||--o{ tasks : linked
    devices ||--o{ field_reports : qa_for

    leads ||--o{ lead_activities : activities

    invoices ||--o{ payments : settled_by

    components ||--o{ procurement_components : procurements

    inventory_items ||--o{ procurements : batches
```

## Tables Summary

| Table | Primary Purpose |
|-------|-----------------|
| `users` | Authentication & RBAC (7 roles) |
| `clients` | Active customer profiles, contracts, services |
| `leads` | Sales pipeline (7 stages) |
| `lead_activities` | Follow-ups, meetings, farm visits |
| `devices` | Hardware lifecycle (5 statuses) |
| `device_status_history` | Audit trail for device status changes |
| `tasks` | Internal work assignments |
| `client_issues` | Support tickets / cross-dept issues |
| `invoices` / `payments` | Billing & accounts |
| `components` / `procurement_components` | Raw hardware inventory |
| `inventory_items` / `procurements` | General inventory batches |
| `field_reports` | Agronomy field operations & QA |
| `audit_log` | System-wide activity logging |
| `notifications` | User alerts |
| `refresh_tokens` | JWT refresh token storage |

## Key Relationships

- **Client → Device**: Optional FK; required when device status is `INSTALLED`
- **Issue → Task**: Auto-created when issue assigned to Hardware/Agronomy
- **Lead → Client**: Linked via `client_id` after conversion (`POST /leads/{id}/convert`)
- **Invoice → Payment**: Payments reduce invoice balance; full payment sets status `PAID`
