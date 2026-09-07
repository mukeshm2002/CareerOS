# CareerOS — Your Personal Career Operating System (v1)

> **Know where you are. Know where you're going. Know what to do today.**

CareerOS is a production-grade **Personal Career Operating System** designed for students, freshers, working professionals, freelancers, career switchers, and entrepreneurs.

It unifies the full career execution lifecycle:
**Goal → Roadmap → Skill Gap → Learning → Project → Evidence → Task → Schedule → Today's Focus → Focus Session → Daily Review → Progress → Weekly Review → Adaptation → Opportunities → Conversion**

---

## 🚀 Tech Stack

### Frontend
- **React** (v18+) with **Vite**
- **Tailwind CSS** (Clean, modern productivity-focused SaaS aesthetic)
- **React Router** for declarative client-side routing
- **TanStack React Query** for server state, optimistic updates, and cache invalidation
- **Zustand** for auth state and client-side UI persistence
- **Lucide React** for consistent system iconography
- **Recharts** for analytics and progress visualization

### Backend
- **Node.js** & **Express.js** (REST API)
- **PostgreSQL** & **Prisma ORM**
- **Security & Hardening**: `helmet`, `express-rate-limit`, `cookie-parser`
- **Authentication**: JWT with short-lived memory access tokens and `httpOnly`, `SameSite`, `Secure` refresh cookies
- **Bcryptjs** for password hashing
- **Zod** for strict request schema validation
- **Modular Services**: Decoupled schedulers, email abstraction, reminder engines

---

## 📁 Project Structure

```text
careeros/
│
├── client/                      # Frontend SPA (Vite + React + Tailwind)
│   ├── src/
│   │   ├── components/          # Reusable UI components & dialogs
│   │   ├── layouts/             # AppLayout (nav, search, notifications bell)
│   │   ├── pages/               # Application & Settings workspaces
│   │   ├── services/            # Axios API clients
│   │   ├── store/               # Zustand state stores
│   │   └── main.jsx             # Application entry point
│   └── package.json
│
├── server/                      # Backend REST API (Express + Prisma)
│   ├── src/
│   │   ├── config/              # Environment validation & DB config
│   │   ├── controllers/         # Request handlers
│   │   ├── middleware/          # Auth, rate limiting, error handlers
│   │   ├── routes/              # Express routing modules
│   │   ├── services/            # Reminders, scheduler, email, auth services
│   │   └── app.js               # Express application initialization
│   └── package.json
│
├── prisma/                      # Database models and migrations
│   ├── schema.prisma            # Comprehensive CareerOS schema
│   ├── seed.js                  # Idempotent database seeder
│   └── migrations/              # Immutable forward-only migration sequence
│
├── docs/                        # Architecture & Release documentation
│   └── V1_RELEASE_CHECKLIST.md  # Production launch verification checklist
│
├── .env.example                 # Environment variables blueprint
└── README.md
```

---

## 🛠️ Development Setup

### 1. Prerequisites
- **Node.js** v18+ (tested with v20 and v24)
- **npm** v9+
- **PostgreSQL** v14+ (Local service or cloud-hosted instance)

### 2. Environment Configuration
```bash
# Copy root environment example
cp .env.example .env
```
Ensure `DATABASE_URL` points to your PostgreSQL instance, e.g.:
`DATABASE_URL="postgresql://postgres:password@localhost:5432/careeros?schema=public"`

### 3. Install Dependencies
```bash
# Install root, server, and client dependencies
npm install
npm install --prefix server
npm install --prefix client
```

### 4. Database Setup & Seed
```bash
# Generate Prisma Client
npx prisma generate

# Apply migrations
npx prisma migrate deploy

# Seed initial demonstration data (idempotent)
node prisma/seed.js
```

### 5. Running the Application
```bash
# In terminal 1: Run backend API server (http://localhost:5000)
npm run dev:server

# In terminal 2: Run frontend client (http://localhost:5173)
npm run dev:client
```

---

## 🗄️ Database Migrations & Immutability Rules

CareerOS strictly adheres to zero-drift, forward-only migration hygiene.

The active sequence of migrations is:
1. `00000000000000_careeros_baseline`
2. `20260907220000_phase1e_progress_reviews`
3. `20260907230000_phase1f_opportunities`
4. `20260907173803_phase1g_projects_learning_evidence`
5. `20260907180438_phase1h_notifications_settings`

### Migration Rules
- **Applied migrations are strictly immutable.** Never edit, rename, or delete existing migration SQL files.
- Normal application scripts must never execute ad-hoc DDL (`ALTER TABLE`, `DROP COLUMN`).
- Deploy schema changes to production using only:
  ```bash
  npx prisma migrate deploy
  ```
- Do not use `prisma db push` in production.

---

## 🔒 Security & Hardening

- **Cookie-Based Refresh Tokens**: Stored in `httpOnly`, `SameSite: Lax`, `Secure` (production) cookies. Not accessible by JavaScript `localStorage`.
- **Session Revocation**: `POST /api/auth/logout-all` revokes all active sessions for the user. Password change immediately revokes all existing refresh tokens.
- **Brute Force Rate Limiting**:
  - `authLimiter`: 10 requests / 15 mins for `/api/auth/login` and `/api/auth/register`.
  - `apiLimiter`: Conservative rate limiter applied globally to protect against DoS.
- **HTTP Security Headers**: Powered by `helmet` (`X-Content-Type-Options`, `Referrer-Policy`, etc.).
- **Strict User Isolation**: All entities enforce `where: { id, userId }`. Foreign records return standard 404 without leaking resource existence.
- **Request Tracing**: `X-Request-ID` correlation header tracked on all server logs.

---

## 📧 Email Notification Provider

CareerOS features an isolated email service abstraction (`server/src/services/reminders/emailNotification.service.js`):
- **Development / Test**: `EMAIL_PROVIDER=console` safely logs transactional email notifications to console without sending external network requests.
- **Production Providers**: Set `EMAIL_PROVIDER=resend`, `sendgrid`, or `smtp` and provide `EMAIL_API_KEY` and `EMAIL_FROM`.
- Supported transactional notification templates:
  - Daily Career Review
  - Daily Shutdown
  - Weekly Review
  - Task Due
  - Opportunity & Recruiter Follow-ups
  - Interview Reminders

---

## 🚢 Production Deployment

### 1. Frontend Build
```bash
npm run build --prefix client
```
The optimized production bundle is placed in `client/dist/`. Serve with Nginx, Caddy, Cloudflare Pages, Vercel, or AWS S3 + CloudFront.
Configure `VITE_API_URL` to point to your backend API URL.

### 2. Backend Production Startup
Ensure required environment variables are set in production:
```bash
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://user:password@remote-db-host:5432/careeros?sslmode=require"
CLIENT_URL="https://app.yourdomain.com"
JWT_ACCESS_SECRET="<32+ chars random string>"
JWT_REFRESH_SECRET="<32+ chars random string>"
```

Start the server:
```bash
NODE_ENV=production node server/src/server.js
```

### 3. Health & Readiness Verification
- `GET /api/health` -> Returns `200 OK` with database connection status.
- `GET /api/ready` -> Returns `200 OK` when critical environment variables and database are validated.

---

## 🧪 Regression & Verification Suites

Execute full 7-phase regression testing:
```bash
node server/tests/phase1b-e2e.test.js
node server/tests/phase1c-e2e.test.js
node server/tests/phase1d-e2e.test.js
node server/tests/phase1e-e2e.test.js
node server/tests/phase1f-e2e.test.js
node server/tests/phase1g-e2e.test.js
node server/tests/phase1h-e2e.test.js
```
Expected result: **ALL PASS, 0 FAIL**.
