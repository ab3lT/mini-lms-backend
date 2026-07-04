# Mini LMS Backend

A NestJS + TypeScript + Prisma/PostgreSQL backend for a small Learning
Management System. There is no public registration - the only account that
exists until an admin creates more is the Super Admin created by the seed
script.

## Roles

| Role | Can do |
|---|---|
| `ADMIN` (Super Admin) | Full user management: create/update/delete any account, assign students to classes, reset passwords. Also has admin/moderator-level access to classes, subjects, schedules. |
| `MODERATOR` | CRUD on classes and subjects; creates schedule slots (binds class + subject + resource + teacher + date + Google Meet link). |
| `TEACHER` | Read-only access to classes/subjects; sees only the schedules they are assigned to teach. |
| `STUDENT` | Read-only access to classes/subjects; sees only schedules for their own class, with date-gating applied to the resource link and Google Meet link. |
| `ACCOUNTANT` | Full access to `/payments` only - viewing and editing payment records per student, and a global list of students grouped by class. Every other module rejects this role. |

Role checks are enforced by a global `RolesGuard` reading `@Roles(...)`
metadata - unauthorized roles get an HTTP 403 directly from the guard, not a
UI-level restriction.

## Requirements

- Node.js 18+
- PostgreSQL 13+

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and fill in real values:

   ```bash
   cp .env.example .env
   ```

   - `DATABASE_URL` - PostgreSQL connection string.
   - `JWT_SECRET` - long random string used to sign access tokens.
   - `JWT_EXPIRY` - token lifetime (e.g. `1d`, `12h`).
   - `SUPER_ADMIN_USERNAME` / `SUPER_ADMIN_PASSWORD` - used once by the seed
     script to create the first account.

3. Create the database schema:

   ```bash
   npm run prisma:migrate
   ```

4. Seed the Super Admin account:

   ```bash
   npm run seed
   ```

5. Start the API:

   ```bash
   npm run start:dev
   ```

The API listens on `PORT` (default `3000`).

## Running with Docker

This spins up Postgres and the API together - no local Node/Postgres install
needed.

1. Copy the environment template (Docker Compose reads the same `.env`):

   ```bash
   cp .env.example .env
   ```

   You can leave `DATABASE_URL` as-is - `docker-compose.yml` overrides it to
   point at the `postgres` service automatically.

2. Build and start both containers:

   ```bash
   docker compose up --build
   ```

   The `api` container waits for Postgres to report healthy, then
   `docker-entrypoint.sh` runs `prisma migrate deploy` automatically before
   starting the server, so the schema is always up to date on boot.

3. In a separate terminal, seed the Super Admin account (one-off, only
   needs to run once):

   ```bash
   docker compose --profile seed run --rm seed
   ```

4. The API is now available at `http://localhost:3000`.

Other useful commands:

```bash
docker compose logs -f api      # tail API logs
docker compose down             # stop containers, keep the postgres_data volume
docker compose down -v          # stop containers AND wipe the database volume
```

To run just the database in Docker while developing the API locally with
`npm run start:dev`, start only that service:

```bash
docker compose up postgres
```

## Authentication

```
POST /auth/login
Body: { "username": "...", "password": "..." }
Response: { "accessToken": "...", "user": { id, username, role, classId } }
```

Send the token on every other request as `Authorization: Bearer <accessToken>`.

## Module overview

- **AuthModule** - `passport-jwt` strategy, bcrypt password hashing, `JwtAuthGuard` + `RolesGuard` + `@Roles()` for RBAC.
- **UsersModule** (`/users`, ADMIN only) - create users of any role, list/get/update/delete, `PATCH /users/:id/assign-class`, `PATCH /users/:id/reset-password`.
- **ClassesModule** (`/classes`) - writes are ADMIN/MODERATOR; reads are open to any authenticated role.
- **SubjectsModule** (`/subjects`) - same pattern as classes.
- **SchedulesModule** (`/schedules`, `schedules_and_resources` table) - ADMIN/MODERATOR create and manage slots; `GET` results are scoped per-role in the service layer (see date-gating below).
- **PaymentsModule** (`/payments`, ACCOUNTANT only) - CRUD on payment records, `GET /payments/student/:studentId`, and `GET /payments/by-class` for the grouped-by-class view.

## Date-gating logic (`SchedulesModule`)

All comparisons use the **UTC calendar date** only (year/month/day), never
local server or client time, to avoid timezone bugs:

- `now (UTC date) < scheduled_date` → **LOCKED**: resource and Google Meet link are both hidden.
- `now (UTC date) == scheduled_date` → **ACTIVE**: resource and Google Meet link are both visible.
- `now (UTC date) > scheduled_date` → **EXPIRED**: resource stays visible, Google Meet link is hidden.

This gating is applied when a **STUDENT** reads schedules for their class.
Admins, moderators, and the assigned teacher always see the ungated record so
they can prepare/manage content ahead of the scheduled date. See
`src/schedules/utils/gate-status.util.ts`.

## Project layout

```
Dockerfile             # multi-stage build (deps -> compile -> slim runtime)
docker-compose.yml      # postgres + api (+ one-off seed) services
docker-entrypoint.sh    # runs `prisma migrate deploy` then starts the server
prisma/
  schema.prisma       # User, Class, Subject, Schedule, Payment models
  seed.ts             # creates the one Super Admin account
src/
  common/             # Role enum, PaymentStatus enum, RolesGuard, JwtAuthGuard,
                       # @Roles()/@CurrentUser() decorators, global exception filter
  prisma/             # PrismaService (injectable singleton) + PrismaModule
  auth/               # login endpoint, JwtStrategy
  users/              # admin-only user management
  classes/
  subjects/
  schedules/          # schedule CRUD + date-gating
  payments/           # accountant-only payment records
```

## Error responses

Every thrown error (validation, Prisma, or unexpected) is normalized by the
global `AllExceptionsFilter` into:

```json
{
  "statusCode": 403,
  "message": "...",
  "error": "Forbidden",
  "path": "/payments",
  "timestamp": "2026-07-04T12:00:00.000Z"
}
```

## Useful scripts

- `npm run start:dev` - watch mode
- `npm run build` - compile to `dist/`
- `npm run prisma:studio` - browse the database
- `npm run lint` - ESLint
