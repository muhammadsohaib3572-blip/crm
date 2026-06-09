**Crop2X CRM & Operations System: Architecture & Access Rules**

**1\. System Objective**  
We need a centralized system to control client data, field operations, hardware inventory, and financials. The goal is strict departmental accountability and giving Management real-time oversight of all operations.

**2\. Access Control (Strict Two-Tier System)**

* **Tier 1 (Management):** Full administrative access across all departments, dashboards, and financial records.  
* **Tier 2 (Departmental):** Accounts, Agronomy, Business, and Hardware teams get restricted access. They can only view and edit modules directly related to their jobs.  
* **Audit Logging:** Every manual entry, status change, or file upload will permanently log the employee's name and exact timestamp. No anonymous edits.

**3\. Core Business Entities**

* **A. Leads & Sales Pipeline:** Track prospect details, targeted services, sent proposals, and quotation links. Clear Won/Lost status and exact follow-up dates.  
* **B. Active Clients:** Track onboarding date, farm area, location, third-party platform credentials, and crop cycle end dates. Tag clients with their active services (AquaSave Pro, Mobile Device, Soil Sampling, Ag5X, Advisory, Drone Survey, Drone Spray).  
* **C. Hardware & Inventory:** Track finished units (AquaSave Pro, Mobile Devices, POL Devices, Weather Trackers) and raw materials (sensors, PCBs).

**4\. Department Workflows & Requirements**  
**Business Department**

* Manage the sales pipeline (outreach, meetings, farm visits).  
* Log communication with existing clients for feedback or complaints.  
* **Cross-Department Ticketing:** Ability to log a client issue and immediately assign a mandatory task to the specific Hardware or Agronomy person responsible.

**Agronomy Department**

* Maintain a historical timeline of active field operations for each client.  
* Upload and log weekly/bi-weekly field reports.  
* Conduct and log field QA for any newly developed or repaired devices.

**Hardware Department**

* Manage procurement logs with manual entry fields to handle the large variety of raw components and sensors.  
* Track the lifecycle of devices in development or under repair.  
* Upload initial QA reports for faulty/returned devices and final QA clearances for repaired units.

**Accounts Department**

* View client profiles strictly to track upcoming payment dates and subscribed services.  
* Generate and attach invoices/quotations to client profiles.  
* Automate tracking for dues and payment arrears.

**5\. Management Decisions Required**

1. Approve the strict departmental access boundaries.  
2. Review and lock the data fields required for the initial rollout.  
3. Decide whether to migrate historical data or launch the system with a zero-data clean slate.

