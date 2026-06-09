# Crop2X Internal CRM & Operations Management System

## Core Requirements & Feature Expectations

---

# 1. Device & Inventory Tracking Module (Core Priority)

This module will track the lifecycle and physical location of all hardware devices.

## Required Features

### Device Statuses

Every device in the system must be tagged with one of the following exact statuses:

* **Under Development**

  * Being built or programmed.

* **QA for Agronomist**

  * Currently undergoing field or functional testing.

* **QA Passed / In Inventory**

  * Ready for deployment.

* **Installed**

  * Currently deployed at a client's farm/location.

* **Back at Office**

  * Returned for maintenance, repair, or reassignment.

### Ownership & Location

When a device is marked as **Installed**, the system must:

* Link it to a specific client profile.
* Record the physical installation location.

### UI/UX Display

The main device dashboard must:

* Display the most recently updated devices first.
* Show recent status changes at the top by default.

### History Tracking (Audit Trail)

Clicking on any device must open a detailed history log showing its complete lifecycle.

Example:

```text
Built on Date X
→ QA'd by Person Y
→ Installed at Client Z
→ Returned on Date W
```

---

# 2. Task Management & Employee Performance

This module will handle internal operations, accountability, and workflow tracking.

## Required Features

### Task Assignment

Management must be able to create tasks and assign them to specific employees.

Examples:

* Deploy sensor at Farm A
* Call Lead B
* Fix hardware bug

### Task Statuses

Tasks should have the following states:

* Pending
* In Progress
* Completed

### Employee Scorecard / Dashboard

The system must track employee performance metrics.

The dashboard should display:

* Total tasks assigned
* Total tasks completed
* Performance score

Example:

| Employee | Assigned Tasks | Completed Tasks | Performance |
| -------- | -------------- | --------------- | ----------- |
| Ali      | 100            | 90              | 90%         |
| Ahmed    | 50             | 40              | 80%         |

---

# 3. Client & Lead Management Module

This module will manage external relationships and the sales pipeline.

## Required Features

### Lead Tracking

A pipeline view to track prospective clients from initial contact to conversion.

Example Pipeline:

```text
Lead
→ Contacted
→ Meeting Scheduled
→ Proposal Sent
→ Negotiation
→ Won / Lost
```

### Client Profiles

A centralized profile for active clients containing:

* Basic client information
* Farm size
* Location
* Associated hardware devices
* Linked services

### Issue & Feedback Logging

Each client profile must include a dedicated section for:

* Feedback
* Support tickets
* Complaints
* Hardware issues

This ensures every team member has visibility into the client's historical issues and interactions.

---

# 4. Billing & Accounts Tracking

*(Expansion of Client Profile)*

Within Client Management, each client should have an **Accounts & Billing** section to track financial standing.

## Required Features

### Onboarding & Lifecycle Dates

Track the exact date when the client was officially onboarded.

### Payment Logs

A ledger system should record:

* Payment amount
* Payment date
* Payment method (optional)

### Arrears & Outstanding Balances

The system must automatically calculate or display:

* Outstanding balances
* Pending payments
* Payment arrears

Based on:

* Contract value
* Payment history

### File Attachments (Invoices)

Users must be able to upload and attach:

* PDF invoices
* Invoice images
* Supporting billing documents

Directly to the client profile.

---

# 5. Raw Component & Procurement Inventory (Hardware Team)

While the Device Module tracks finished products, this module tracks the raw components used to build them.

## Required Features

### Component Stock Levels

A real-time inventory tracker for raw materials such as:

* Sensors
* Microcontrollers
* Casings
* Batteries
* PCBs

### Procurement History

For every batch of components added to inventory, the system must record:

* Date ordered
* Vendor / Supplier name
* Supplier details
* Quantity received

### Product Media (Snaps)

Users must be able to upload and attach photos of:

* Raw components
* Finished hardware devices

For verification and inventory records.

---

# Technical & System Expectations

## Tech Stack

### Frontend

* React.js
* Next.js

### Backend

* Python FastAPI
* Django

### Database

* PostgreSQL

---

## Relational Data Requirements

The database schema must properly link all modules together.

Example relationships:

```text
Client
  │
  ├── Devices
  │
  ├── Billing Records
  │
  ├── Feedback & Tickets
  │
  └── Tasks

Task
  ├── Assigned Employee
  ├── Linked Client
  └── Linked Device
```

Example:

```text
Task:
Install Sensor

Linked Client:
Ahmed Farms

Linked Device:
ASP-001

Assigned Employee:
Ali
```

---

## Clean UI Requirements

The interface must be intuitive and easy to use.

Examples:

* Sales representatives should quickly update lead status.
* Agronomists should quickly upload reports.
* Hardware team should easily update device statuses.
* Employees should be able to close tasks with minimal effort.

The system should require minimal training.

---

# Next Steps

Before writing any code:

1. Design the complete Database Schema (ERD).
2. Create basic UI Wireframes for:

   * Device Management
   * Task Management
   * Client Management
3. Submit both for review.
4. Validate the data architecture before development begins.

---

# Target Outcome

A centralized internal CRM and Operations Management System that provides:

* Device lifecycle tracking
* Inventory management
* Client management
* Lead management
* Employee performance tracking
* Task management
* Billing and payment tracking
* Procurement and component inventory management
* Full audit history and accountability
