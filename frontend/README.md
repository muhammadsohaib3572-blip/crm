# Crop2X CRM Frontend

This is the frontend dashboard for the Crop2X Operations Management System.

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand
- **Data Fetching:** Axios + TanStack Query
- **Charts:** Recharts
- **Icons:** Lucide React

## Getting Started

### Prerequisites
- Node.js v24+
- `npm`

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```

## Folder Structure
- `app/`: Next.js pages and layouts.
- `modules/`: Feature-specific modules (Devices, Clients, Tasks, etc.).
- `components/`: Reusable UI and layout components.
- `services/`: Axios API instances and service logic.
- `store/`: Zustand state stores.
- `types/`: TypeScript interface definitions.
