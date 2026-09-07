# CareerOS v1 Release Checklist

A comprehensive pre-flight, release, and post-deployment verification checklist for **CareerOS v1**.

---

## 1. Pre-Deployment Integrity & Migrations
- [ ] **Migration Immutability**: Verify that existing migrations in `prisma/migrations/` have not been altered or renamed.
  - Baseline: `00000000000000_careeros_baseline`
  - Phase 1E: `20260907220000_phase1e_progress_reviews`
  - Phase 1F: `20260907230000_phase1f_opportunities`
  - Phase 1G: `20260907173803_phase1g_projects_learning_evidence`
  - Phase 1H: `20260907180438_phase1h_notifications_settings`
- [ ] **Forward-Only Schema**: All schema changes must be applied strictly via `npx prisma migrate deploy`. Never use `db push` or manual DDL modifications.
- [ ] **Schema Drift Verification**: Verify zero schema drift using `npx prisma migrate diff`.
- [ ] **Database Pre-Release Backup**: Perform a snapshot or `pg_dump` before applying migrations to production PostgreSQL instances.

---

## 2. Environment & Configuration
- [ ] **Required Variables Set**:
  - `NODE_ENV=production`
  - `PORT`: Set by platform host (e.g. 5000, 8080).
  - `DATABASE_URL`: Connection string pointing to managed PostgreSQL instance.
  - `CLIENT_URL`: Exact production origin for CORS (e.g., `https://app.careeros.com`). Wildcards (`*`) are disallowed.
  - `JWT_ACCESS_SECRET`: Cryptographically strong random string (≥ 32 characters).
  - `JWT_REFRESH_SECRET`: Cryptographically strong random string (≥ 32 characters, distinct from access secret).
- [ ] **Optional Integrations**:
  - `EMAIL_PROVIDER`: Set to `resend`, `sendgrid`, or `smtp` for production email dispatch; defaults to `console` in test/staging.
  - `EMAIL_FROM`: Configured verified sender address.
  - `EMAIL_API_KEY`: Configured provider secret.
  - `SENTRY_DSN` / `POSTHOG_KEY`: Configured if error tracking/product analytics are desired.
- [ ] **Client Environment**:
  - `VITE_API_URL`: Configured to production API domain (`https://api.careeros.com/api` or `/api` if reverse proxied).

---

## 3. Security Hardening
- [ ] **HTTP Security Headers**: `helmet` is active with default security headers (`X-Content-Type-Options`, `Referrer-Policy`, etc.).
- [ ] **Cookie Security**: Refresh token issued via `httpOnly: true`, `SameSite: Lax`, and `secure: true` in production environments.
- [ ] **Refresh Token Rotation**: Old refresh tokens are invalidated upon use; sessions revoked on logout and password reset.
- [ ] **Rate Limiting**:
  - Auth rate limiter: Protects `/api/auth/login` and `/api/auth/register` (max 10 attempts / 15 minutes per IP).
  - API rate limiter: Conservatively limits general endpoints to protect against DoS.
- [ ] **Request Correlation**: `X-Request-ID` is stamped on all incoming requests and included in server log output.
- [ ] **Information Exposure**: Error handler sanitizes internal Prisma/SQL errors and stack traces in production (`success: false, message: "..."`).

---

## 4. Test & Verification Suites
- [ ] **All 7 Phases Green**:
  - Phase 1B (User Foundation): 65/65 PASS
  - Phase 1C (Career Planning): 94/94 PASS
  - Phase 1D (Daily Execution): 87/87 PASS
  - Phase 1E (Reviews & Adaptation): 69/69 PASS
  - Phase 1F (Opportunities Engine): 108/108 PASS
  - Phase 1G (Projects & Portfolio): 96/96 PASS
  - Phase 1H (Notifications & Release): ALL PASS
- [ ] **Zero Regressions**: 0 failed tests across all suites.

---

## 5. Build & Deployment Artifacts
- [ ] **Frontend Production Build**: Run `npm run build` inside `client/`. Ensure zero build errors and correct asset bundling.
- [ ] **Backend Production Startup**: Start backend with `NODE_ENV=production node server/src/server.js`. Confirm clean bootstrap.
- [ ] **Seed Idempotency**: Verify `npm run seed` or `node prisma/seed.js` can run repeatedly without primary key or unique constraint violations.

---

## 6. Post-Deployment Verification (Smoke Test)
- [ ] **Health Endpoint**: `GET /api/health` returns `200 OK` with database status `"connected"`.
- [ ] **Readiness Endpoint**: `GET /api/ready` returns `200 OK`.
- [ ] **User Registration & Login**: Create test user, confirm refresh cookie is set and access token received.
- [ ] **Onboarding & Planning**: Complete onboarding, create Career Goal, generate Roadmap, and add Skill.
- [ ] **Daily Execution**: Add Task, view My Day, start and finish a Focus Session, record Daily Review.
- [ ] **Progress & Review**: View Progress dashboard, generate Weekly Review.
- [ ] **Opportunities & Projects**: Add Job/Freelance opportunity, create Project, attach Evidence item.
- [ ] **Reminders & Notifications**: Add a reminder, trigger scheduler check, verify in-app notification appears in bell dropdown and mark as read.
- [ ] **Settings & Profile**: Update profile details, change career preferences, test password change, verify session revocation.
- [ ] **Logout & Logout-All**: Confirm tokens revoked, refresh cookie cleared, and protected endpoints return 401.
