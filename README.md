# GoldVault - Gold Loan Management System

GoldVault is a full-stack web application designed for gold loan management, featuring customer KYC, collateral ornament tracking, repayment receipts, maturity calculations, and dynamic reminders.

## Backend Architecture

The application has a clean production architecture separating the React frontend from the Express.js API backend:

```text
GoldVault/
├── src/                    # React frontend (TanStack Start)
├── server/                 # Express.js backend server
│   ├── src/
│   │   ├── config/         # Database configurations (Prisma Client)
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Database query & mutation services (ACID Transactions)
│   │   ├── routes/         # Express API routers
│   │   ├── middleware/     # Auth, file upload (Multer), global error handlers
│   │   ├── validations/    # Zod schemas for input validation
│   │   └── utils/          # Auto-ID generators & calculation helpers
├── prisma/                 # Prisma models, migrations, and database seeder
└── .env                    # System environment variables
```

---

## Getting Started

### 1. Database Setup

GoldVault is configured to use **PostgreSQL** with **Prisma ORM**. 

1. Create a PostgreSQL database (e.g. named `goldvault`).
2. Update the `DATABASE_URL` in the root `.env` file with your credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/goldvault?schema=public"
   ```
3. Run the migrations to build the tables:
   ```bash
   npx --prefix server prisma migrate dev --name init --schema=prisma/schema.prisma
   ```
4. Run the database seeder to populate default settings, mock customers, loans, and payment histories:
   ```bash
   npx --prefix server prisma db seed --schema=prisma/schema.prisma
   ```

#### 💡 Alternative: Zero-Configuration Setup (SQLite)
If you don't have PostgreSQL installed and want to run it instantly without server setup, you can switch Prisma to **SQLite**:
1. Open [prisma/schema.prisma](file:///c:/Users/nutan/OneDrive/Desktop/GoldApp/Gold_LoanApp/prisma/schema.prisma).
2. Change the `datasource db` block to:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }
   ```
3. Change any `@unique` or field directives if prompted, then run the migrate and seed commands as shown above. Prisma will automatically create a local `dev.db` file.

---

### 2. Running the Application

You can start both the client web application and the Express API server concurrently with a single command:

```bash
npm run dev:all
```

* **Frontend Web App**: Runs at [http://localhost:8080/](http://localhost:8080/)
* **Express API Server**: Runs at [http://localhost:5000/](http://localhost:5000/)

---

## Key Features & Logic

* **ACID Transactions**: Pledging gold ornaments, uploading documents, and creating the initial active loan is completed in a single atomic database transaction. If any part fails (e.g., net weight exceeds gross weight), the database is rolled back.
* **Auto-generated IDs**: Customer IDs (`CUS0001`), Loan numbers (`GL20260001`), and Receipt numbers (`RCPT000001`) are automatically computed sequentially.
* **Resilient Client UI**: The frontend uses a fallback architecture. If the Express API server or PostgreSQL database is offline, the React app automatically switches to premium local mock data. You can browse the entire application and inspect the visual components immediately.
* **Calculations**: Accurately computes interest (`(amount * rate * months) / 1200`), total payable, maturity dates, remaining balances, and dynamically logs overdue/due soon alerts.
