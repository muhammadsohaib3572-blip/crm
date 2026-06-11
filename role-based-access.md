# Role-Based Access Guide

Yeh document Crop2X CRM ke current backend code ke hisab se banaya gaya hai. Har role ke liye main modules, permissions, restrictions, aur rozmarra ki zimmedariyan simple Roman Urdu mein likhi hui hain.

---

## Roles

- `ADMIN`
- `MANAGER`
- `BUSINESS`
- `AGRONOMY`
- `HARDWARE`
- `ACCOUNTS`
- `EMPLOYEE`

---

## 1. ADMIN

### Kis module ka access hai

- Full system access.
- `Users`, `Clients`, `Billing`, `Devices`, `Inventory`, `Components`, `Reports`, `Issues`, `Tasks`, `Dashboard`, `Activity Logs`, `Uploads`.

### Kya create kar sakhta hai

- Naye users.
- Clients.
- Invoices aur Payments.
- Tasks.
- Field reports.
- Devices.
- Inventory items aur procurements.
- Components aur component procurements.
- Issues.
- File uploads (invoice attachments, report attachments, inventory media).

### Kya update/edit kar sakhta hai

- Users ka data, role, active/inactive status.
- Client details.
- Invoice aur payment records.
- Task details aur task status.
- Field reports.
- Device information aur device status.
- Inventory items aur components.
- Issues.

### Kya delete kar sakhta hai

- Users (apna khud ka account delete nahi kar sakta).
- Clients.
- Invoices (sirf jab paid invoice delete nahi hota, warna cancel process alag hoti hai).
- Devices.
- Components.
- Issues.
- Uploaded files.

### Kya sirf view kar sakhta hai

- System ka tamam data.
- Dashboard full overview, business stats, agronomy stats, hardware stats, accounts stats.

### Kis cheez ka access nahi hai

- Basically koi restriction nahi; system ka super-user.
- Public registration aur config settings ke ilaava, sab access hai.

### Rozmarra ki responsibilities

- System ko chalana aur monitor karna.
- Team members ko manage karna.
- User accounts banana aur deactivate karna.
- Clients aur invoices ka oversight.
- Devices, inventory, aur field reports par nazar rakhna.
- Activity logs dekhna aur audit karna.
- Overall CRM permissions aur data integrity sambhalna.

---

## 2. MANAGER

### Kis module ka access hai

- `Clients`, `Billing`, `Devices`, `Inventory`, `Components`, `Reports`, `Issues`, `Tasks`, `Dashboard`, `Activity Logs`, `Uploads`
- `Users` ko dekh sakta hai lekin create/update/delete users nahi kar sakta.

### Kya create kar sakhta hai

- Clients.
- Invoices aur Payments.
- Tasks.
- Field reports.
- Inventory items aur procurements.
- Components aur component procurements.
- Issues.
- Upload invoice/report/inventory media.

### Kya update/edit kar sakhta hai

- Clients.
- Invoices aur Payments.
- Tasks.
- Field reports.
- Devices.
- Components.
- Issues.

### Kya delete kar sakhta hai

- Clients.
- Invoices (paid invoices delete nahi kar sakta).
- Devices.
- Components.
- Issues.

### Kya sirf view kar sakhta hai

- Users list.
- All clients, invoices, devices, reports, issues.
- Full manager/admin dashboard.

### Kis cheez ka access nahi hai

- User create/update/delete.
- `Billing` se related kuch low-level system configs nahi.

### Rozmarra ki responsibilities

- Operations ko supervise karna.
- Client aur finance teams ke darmiyan coordination.
- Reports aur device/inventory status dekhna.
- Tasks assign karna aur follow-up karna.
- Audit aur alerts dekhna.

---

## 3. BUSINESS

### Kis module ka access hai

- `Clients`, `Tasks`, `Issues` (read), `Dashboard` (Business dashboard).

### Kya create kar sakhta hai

- Clients.
- Tasks.
- Issues.

### Kya update/edit kar sakhta hai

- Clients.
- Tasks jo usko assign hon.
- Issues jo usko assign hon.

### Kya delete kar sakhta hai

- Khud ki assigned tasks.

### Kya sirf view kar sakhta hai

- Clients.
- Own tasks.
- Issues lists.
- Business dashboard stats.

### Kis cheez ka access nahi hai

- Billing.
- Devices.
- Inventory.
- Components.
- Field reports.
- Activity logs.
- User management.
- File uploads.

### Rozmarra ki responsibilities

- Client relationships ko manage karna.
- Client data update karna.
- Business pipeline aur follow-ups par kaam karna.
- Issues track karna aur team ko assign karna.
- Apni tasks complete karna.

---

## 4. AGRONOMY

### Kis module ka access hai

- `Clients` (read only), `Devices` (read, assigned update), `Reports`, `Tasks`, `Dashboard` (Agronomy dashboard), `Uploads` (report uploads), `Issues` (read, assigned update).

### Kya create kar sakhta hai

- Field reports.
- Tasks.

### Kya update/edit kar sakhta hai

- Field reports.
- Own tasks.
- Assigned devices.
- Device status on assigned devices.
- Assigned issues.

### Kya delete kar sakhta hai

- Koi delete permissions nahi (reports/issues/devices delete admin/manager tak limited hain).

### Kya sirf view kar sakhta hai

- Clients.
- Reports.
- Devices.
- Own dashboard stats.
- Issues list.

### Kis cheez ka access nahi hai

- Billing.
- Inventory create/update.
- Components.
- User management.
- Invoice upload (sirf report upload allowed)

### Rozmarra ki responsibilities

- Field reports banana aur update karna.
- QA tasks aur device QA par kaam karna.
- Reports ke attachments upload karna.
- Assigned devices ka status badalna.
- Own tasks complete karna.

---

## 5. HARDWARE

### Kis module ka access hai

- `Devices`, `Inventory`, `Components`, `Tasks`, `Issues` (read), `Dashboard` (Hardware dashboard), `Uploads` (inventory upload, component images).

### Kya create kar sakhta hai

- Tasks.
- Inventory items.
- Procurement records.
- Components.
- Component procurements.

### Kya update/edit kar sakhta hai

- Assigned devices.
- Device status on assigned devices.
- Components.
- Component procurements.

### Kya delete kar sakhta hai

- Koi delete permissions nahi (device/component delete admin/manager tak limited).

### Kya sirf view kar sakhta hai

- Clients.
- Devices.
- Issues.
- Reports (read only).
- Inventory.
- Components.

### Kis cheez ka access nahi hai

- Billing.
- User management.
- Client create/edit.
- Field report create/update (sirf report read allowed).

### Rozmarra ki responsibilities

- Hardware inventory aur component stock manage karna.
- Devices ka maintenance aur field status update karna.
- Component procurements aur inventory media upload karna.
- Assigned tasks complete karna.

---

## 6. ACCOUNTS

### Kis module ka access hai

- `Billing`, `Clients` (read), `Tasks`, `Dashboard` (Accounts dashboard), `Uploads` (invoice/inventory media).

### Kya create kar sakhta hai

- Invoices.
- Payments.
- Tasks.

### Kya update/edit kar sakhta hai

- Invoices.
- Own tasks.

### Kya delete kar sakhta hai

- Khud ki assigned tasks.
- Invoice delete nahi kar sakta (sirf admin/manager).

### Kya sirf view kar sakhta hai

- Clients.
- Invoices aur payments.
- Overdue invoices.
- Client balance aur ledger.
- Own tasks.

### Kis cheez ka access nahi hai

- Devices.
- Inventory.
- Components.
- Reports.
- Issues.
- User management.

### Rozmarra ki responsibilities

- Invoice aur payment records maintain karna.
- Receivables check karna.
- Client billing status dekhna.
- Accounts dashboard se financial alerts manage karna.

---

## 7. EMPLOYEE

### Kis module ka access hai

- `Tasks` (own), `Dashboard` (pending tasks only), `Activity Logs` (own activity).

### Kya create kar sakhta hai

- Koi naya task create nahi kar sakta.

### Kya update/edit kar sakhta hai

- Apni assigned tasks.
- Task status change kar sakta hai agar woh khud ko assign ho.

### Kya delete kar sakhta hai

- Apni assigned tasks delete kar sakta hai.

### Kya sirf view kar sakhta hai

- Apni tasks.
- Apni activity logs.
- Dashboard mein pending task count.

### Kis cheez ka access nahi hai

- Clients.
- Billing.
- Devices.
- Inventory.
- Components.
- Reports.
- Issues.
- Uploads.
- User management.

### Rozmarra ki responsibilities

- Apne assigned tasks complete karna.
- Tasks ka status update karna.
- Apni activity history dekhna.

---

## Note on Registration

System mein currently `PUBLIC_REGISTER_ROLES` config se decide hota hai ke kaun kaun se roles public registration ke zariye ban sakte hain. Agar backend config `ALLOW_PUBLIC_REGISTER=false` ho to registration disabled ho jati hai.

---

## Quick Permission Summary

- `ADMIN`: Full access, system owner.
- `MANAGER`: Almost full operations access, lekin user creation/delete nahi.
- `BUSINESS`: Client aur task management, business dashboard.
- `AGRONOMY`: Field reports, device QA, report uploads.
- `HARDWARE`: Devices, inventory, components, hardware dashboard.
- `ACCOUNTS`: Billing, invoices, payments, financial dashboard.
- `EMPLOYEE`: Sirf assigned tasks aur apni activity.
