# CareerOS V1 — Production Deployment Guide

This guide provides step-by-step instructions for deploying the **CareerOS v1** production system.

```text
Local CareerOS
      ↓
Production Configuration & Pre-Flight
      ↓
Neon PostgreSQL (Serverless + Pooled)
      ↓
Render API (Node.js / Express)
      ↓
Vercel Frontend (Vite / React SPA)
      ↓
Post-Deployment Smoke Flow (21 Steps)
      ↓
CareerOS V1 LIVE 🚀
```

---

## 1. Architecture Overview

| Component | Provider | Technology | Key Responsibility |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Vercel** | React 18 / Vite SPA | User Interface, Router, Client State |
| **Backend** | **Render** | Node.js 20 / Express | REST API, Auth, Business Engines, Schedulers |
| **Database** | **Neon** | Serverless PostgreSQL | Relational Storage, Migration History |
| **ORM** | **Prisma** | Prisma v5.22 | Pooled Runtime Queries + Direct Migrations |

---

## 2. Security & Environment Prerequisites

### 2.1 Rotate Neon Credentials
If any database connection string was used during development or exposed in logs, **rotate or reset the database password in the Neon Console prior to production deployment**.

Neon provides two distinct connection strings:
1. **Pooled Connection String (`DATABASE_URL`)**: Contains `-pooler` in the hostname. Used by the running Node.js application for high-concurrency client connection pooling.
   ```text
   postgresql://[user]:[password]@[ep-xyz-pooler.region].neon.tech/careeros?sslmode=require
   ```
2. **Direct Connection String (`DIRECT_URL`)**: Connects directly to the compute instance without pgbouncer. Required by Prisma Migrate to execute DDL operations, advisory locks, and schema migrations:
   ```text
   postgresql://[user]:[password]@[ep-xyz.region].neon.tech/careeros?sslmode=require
   ```

### 2.2 Generate Production JWT Secrets
Generate two cryptographically random 64-character strings for access and refresh tokens:
```bash
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### 2.3 Strict Git Hygiene
- Ensure `.env` is never committed.
- Verify `git status` does not track `.env`, `.postgres-data/`, or `migration-history-backup/`.

---

## 3. Database Deployment (Neon)

### 3.1 Initializing Schema
Deploy all 3 immutable baseline migrations to your Neon database:

```bash
# Set environment variables for the migration run
export DATABASE_URL="postgresql://[user]:[password]@[ep-xyz-pooler].neon.tech/careeros?sslmode=require"
export DIRECT_URL="postgresql://[user]:[password]@[ep-xyz].neon.tech/careeros?sslmode=require"

# Execute production migrations
npx prisma migrate deploy --schema=prisma/schema.prisma
```

### 3.2 Verify Migration Status
```bash
npx prisma migrate status --schema=prisma/schema.prisma
```
Expected output:
```text
Database schema is up to date!
```

> [!CAUTION]
> **NO PRODUCTION SEEDING**: Never run `prisma db seed` or `npm run prisma:seed` in production. Demo data must only exist in development/staging.

---

## 4. Backend Deployment (Render)

### 4.1 Create Web Service
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Configure service settings:
   - **Name**: `careeros-api`
   - **Region**: Choose the region closest to your Neon database region (e.g., Oregon / Frankfurt / Singapore).
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm ci && npm run prisma:generate
     ```
   - **Start Command**:
     ```bash
     npm run prisma:migrate:deploy && node src/app.js
     ```

### 4.2 Configure Render Environment Variables
Add the following in Render **Environment**:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production security & logging |
| `PORT` | `10000` | Port assigned by Render |
| `DATABASE_URL` | `postgresql://...-pooler...` | Neon Pooled connection string |
| `DIRECT_URL` | `postgresql://...` | Neon Direct connection string |
| `CLIENT_URL` | `https://<your-careeros-app>.vercel.app` | Vercel production frontend URL |
| `JWT_ACCESS_SECRET` | *(64-character random string)* | Production access secret |
| `JWT_REFRESH_SECRET` | *(64-character random string)* | Production refresh secret |
| `JWT_ACCESS_EXPIRY` | `15m` | Access token lifespan |
| `JWT_REFRESH_EXPIRY` | `7d` | Refresh token lifespan |

---

## 5. Frontend Deployment (Vercel)

### 5.1 Import Project
1. Log in to [Vercel Dashboard](https://vercel.com/).
2. Click **Add New...** → **Project**.
3. Import your GitHub repository.
4. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`

### 5.2 Configure Vercel Environment Variables
Add the following in Vercel **Environment Variables**:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://careeros-api.onrender.com/api` | Render backend API endpoint |

### 5.3 Verify SPA Routing
Ensure `client/vercel.json` exists in the repository:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 6. Post-Deployment Verification

### 6.1 Health & Readiness Checks
Run HTTP checks against your deployed Render API:

```bash
# Health Check
curl -s https://careeros-api.onrender.com/api/health | jq .
# Expected: { "status": "ok", "data": { "status": "healthy", "environment": "production" } }

# Readiness Check (verifies Neon DB connection)
curl -s https://careeros-api.onrender.com/api/ready | jq .
# Expected: { "status": "ok", "data": { "status": "ready", "database": "connected", "environment": "production" } }
```

### 6.2 Full V1 Product Smoke Test
Execute the automated 21-step smoke test pointing to the production API:

```bash
API_URL=https://careeros-api.onrender.com/api node server/tests/v1-smoke-flow.test.js
```
Expected output:
```text
==================================================
CAREEROS V1 PRODUCT SMOKE FLOW: 21/21 PASS
ALL CORE USER LIFECYCLE SCENARIOS VALIDATED
==================================================
```

### 6.3 Manual E2E Check
1. Open `https://<your-careeros-app>.vercel.app`.
2. Register a new test account (`test-prod-user@careeros.com`).
3. Complete onboarding (Role: *Full Stack Engineer*, Horizon: *90 days*).
4. Create a Goal, Target Role, and Pillar.
5. Add a Task in Today's Focus and toggle completion.
6. Trigger a Focus Session (25 min timer) and complete it.
7. Log out and log back in to verify session refresh and persistence.

---

## 7. Troubleshooting & Rollbacks

- **Database Migration Issue**: If a migration fails, verify `DIRECT_URL` is configured correctly and does not route through `pgbouncer` connection pooling.
- **CORS Error in Browser**: Check that `CLIENT_URL` on Render exactly matches `https://<your-careeros-app>.vercel.app` (including https and no trailing slash).
- **Refresh Cookie Issues**: Ensure `credentials: true` is sent in requests and that production cookies use `secure: true` and `SameSite: None` (or custom sibling domains).
