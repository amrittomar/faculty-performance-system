# FPIS backend

Spring Boot 3.5 / Java 25 REST API for the Faculty Performance Information System. PostgreSQL is the source of truth; Flyway applies the schema and Hibernate validates it at startup. The API includes JWT/BCrypt authentication, role-protected faculty and department management, contribution approvals, workload, calendar conflict detection and availability recommendations, explainable performance scoring, FDP/mentoring records, responsibilities, dashboards, audit logs, OpenAPI and Actuator.

## Requirements

- JDK 25 (LTS)
- Maven 3.9+ or use the included Maven wrapper (`mvnw.cmd`)
- PostgreSQL 14+ (database `fpis`)

## Run locally

Create a local database/user, then launch using the `local` profile. The profile defaults below are **demo-only** and must not be used in a deployed environment.
For a fresh local PostgreSQL install, run as a database administrator:

```sql
CREATE USER fpis WITH PASSWORD 'fpis_local_only';
CREATE DATABASE fpis OWNER fpis;
```

PowerShell (Maven installed):

```powershell
$env:SPRING_PROFILES_ACTIVE = "local"
$env:DB_URL = "jdbc:postgresql://localhost:5432/fpis"
$env:DB_USERNAME = "fpis"
$env:DB_PASSWORD = "fpis_local_only"
mvn spring-boot:run
```

Alternatively, run `.\mvnw.cmd spring-boot:run` to download and use Maven without installing it globally.

Start the application with `SPRING_PROFILES_ACTIVE=local`. PostgreSQL must be reachable and the `fpis` database must exist; demo users are seeded once when the schema has no departments. The requested admin login is `admin@fpis.edu` / `Admin@123` (local profile only). Other demo users:

### Quick demo without installing PostgreSQL

The `demo` profile uses an in-memory H2 database and seeds sample accounts/data each time the app starts. This profile is for trying the application locally; its data resets at restart. Run from this directory:

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=demo"
```

In another terminal, run the frontend from `frontend/` and sign in with `admin@fpis.edu` / `Admin@123`. Use the `local` profile above when you specifically want PostgreSQL persistence.
In VS Code, select **FPIS backend (demo)** in Run and Debug to start this profile. Do not run the default Spring profile for the demo: the default profile expects PostgreSQL settings and a configured JWT secret, and the API will not listen on port 8080 if startup fails.

The requested admin login is `admin@fpis.edu` / `Admin@123` (demo/local profiles only). Other demo users:

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@fpis.edu` | `Admin@123` |
| DEAN | `dean@fpis.local` | `DeanDemo!2026` |
| HOD | `hod@fpis.local` | `HodDemo!2026` |
| FACULTY | `faculty@fpis.local` | `FacultyDemo!2026` |

The demo accounts display the supplied names **Dr Goldy Sharma** (admin) and **Dr Amrit Tomar** (faculty). Their designation remains unset until an admin enters the correct title in the Faculty directory; the app does not infer academic designations from a login role.

Authenticate with `POST /api/auth/login` and use the returned token as `Authorization: Bearer <token>`. API docs are at `/swagger-ui.html`; health is at `/actuator/health`.

### Docker

From the project root, run `docker compose up --build` to start the API and PostgreSQL together. Wait for the backend to finish starting before signing in. The compose configuration is for local development only and uses a demo database password.

## Production configuration

Do not enable `local`. Set `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `JWT_SECRET` through a secret manager/environment injection; `JWT_SECRET` must be at least 32 bytes. There are deliberately no production database/password/JWT defaults. Set `JWT_EXPIRATION_MS` as appropriate. Schema changes are versioned in `src/main/resources/db/migration`.

## Main endpoints

- `POST /api/auth/login`
- `GET/PUT /api/faculty/me` (signed-in profile)
- `GET/POST/PUT/DELETE /api/goals` (signed-in goals)
- `GET/POST/PATCH/DELETE /api/reminders` (signed-in reminders)
- `/api/faculty`, `/api/departments`
- `/api/contributions`, `/api/contributions/pending`, `/api/contributions/{id}/review`
- `/api/workloads`, `/api/workloads/{facultyId}`
- `/api/calendar`, `/api/calendar/recommendations`
- `/api/development` (`recordType` is `FDP` or `MENTORING`)
- `/api/responsibilities`
- `/api/performance/me/score`, `/api/performance/{facultyId}/score`
- `/api/dashboard`, `/api/audit`

Validation errors return HTTP 400 with field details; missing resources return 404, conflicts 409, unauthenticated requests 401, and forbidden roles 403. Scores use approved contribution points capped at 100 per category before applying the fixed category weights (teaching 35%, research 35%, service 20%, development 10%).

## Tests

Run `mvn test` from this directory. Focused tests cover score calculation, workload totals/ratios and schedule availability.
