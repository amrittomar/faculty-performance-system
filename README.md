# Faculty Performance Intelligence System

FPIS is a full-stack academic operations application with a React/Vite dashboard and a Java/Spring Boot REST API. It supports role-based access, faculty contributions and reviews, workload visibility, academic scheduling, and explainable performance scoring.

## Project layout

- `frontend/` — React 18, Vite, Tailwind CSS, React Router, Axios, Recharts, and Lucide.
- `backend/` — Java 25, Spring Boot 3.5, Maven, Spring Security/JWT, Spring Data JPA, PostgreSQL, Flyway, and OpenAPI.

## Requirements

- Java 25 (LTS)
- Maven 3.9+ (or the backend's Maven wrapper, which downloads Maven on first use)
- Node.js 20+ and npm
- PostgreSQL 15+

## Quick demo (no PostgreSQL required)

The demo profile uses an in-memory H2 database, so it is the fastest way to try the login and dashboards. From the project root, run:

```powershell
npm install
npm run backend:demo
```

In another terminal, start the frontend from the project root:

```powershell
npm run dev
```

Sign in with `admin@fpis.edu` / `Admin@123`. Demo data resets whenever the backend restarts. Use the PostgreSQL instructions below for persistent data.

## Start PostgreSQL

Create a local database and application user (or use a local PostgreSQL instance):

```sql
CREATE USER fpis WITH PASSWORD 'choose-a-local-password';
CREATE DATABASE fpis OWNER fpis;
```

The backend runs Flyway migrations at startup. Never use the example local password for a deployed environment.

### One-command local backend setup with Docker

If Docker Desktop is installed and running, start PostgreSQL and the Spring Boot API from the project root:

```powershell
docker compose up --build
```

Wait for the backend to finish starting, then open `http://localhost:5173` and sign in with the local demo credentials in `backend/README.md`. Leave this terminal running while using FPIS. Stop the services with `Ctrl+C`; the database volume keeps local data between runs.

## Configure and run the backend

From `backend/`, configure these environment variables for your shell:

| Variable | Purpose | Local default |
|---|---|---|
| `DB_URL` | PostgreSQL JDBC URL | `jdbc:postgresql://localhost:5432/fpis` |
| `DB_USERNAME` | Database user | `fpis` |
| `DB_PASSWORD` | Database password | `fpis` |
| `JWT_SECRET` | Base64-encoded signing secret (at least 256 bits) | Local-only development key |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins | `http://localhost:5173` |

PowerShell example:

```powershell
$env:DB_URL = "jdbc:postgresql://localhost:5432/fpis"
$env:DB_USERNAME = "fpis"
$env:DB_PASSWORD = "choose-a-local-password"
$env:JWT_SECRET = "<base64-encoded-secret>"
mvn spring-boot:run
```

The API is served at `http://localhost:8080/api`. Swagger UI is available at `http://localhost:8080/swagger-ui.html` and the OpenAPI definition at `http://localhost:8080/v3/api-docs`.

## Configure and run the frontend

From `frontend/`:

```powershell
npm install
$env:VITE_API_URL = "http://localhost:8080/api"
npm run dev
```

Open `http://localhost:5173`. The frontend obtains dashboard and module records from the API; it does not use seeded frontend business data.

## Authentication and demo users

Development accounts and their credentials are documented in `backend/README.md`. Demo accounts must only be enabled in the local development profile. Change their passwords and set a private JWT secret before deploying.

## Faculty self-service portal

Faculty can open **My timetable** from the navigation menu to view their scheduled classes and academic activities by date. They can also add contributions from **My profile** or the **Contributions** page; submitted activities appear in the contribution list for departmental review. Faculty can view their name, designation, department, teaching assignments, and timetable from **My profile**; identity and schedule fields are read-only to faculty. They can update contact details and expertise, submit research, patents, teaching, development, and service progress, and manage goals and reminders. **Download report** exports a CSV snapshot with the faculty profile, performance score and category breakdown, contributions, workload, goals, and reminders. Personal records remain scoped to the signed-in account.

Administrators can filter **Faculty** by department and review each member's designation, teaching timetable, submitted progress, and performance score. They can update the faculty name/designation, maintain teaching calendar entries, and set a replacement password. Passwords are always hashed and cannot be viewed; a reset replaces the credential without disclosing it. Department heads are restricted to faculty and records in their own department.

The faculty self-service APIs are `GET/PUT /api/faculty/me`, `GET/POST/PUT/DELETE /api/goals`, and `GET/POST/PATCH/DELETE /api/reminders`. Administrative faculty APIs include `GET/PUT /api/faculty/{id}`, `PUT /api/faculty/{id}/password`, and `POST /api/calendar/faculty/{id}`.

## Scoring and scheduling

The backend calculates category scores only from approved contributions. Category targets and weights are configurable; the configured weights must total 100%. Scheduling recommendations must satisfy expertise, availability, existing-event, and capacity constraints, and include an explanation. The frontend displays those API results rather than generating scores or recommendations locally.

## Tests and production

Run backend tests from `backend/` with `mvn test`; build the frontend from `frontend/` with `npm run build`. Configure PostgreSQL, a high-entropy secret, allowed CORS origins, and HTTPS for deployed environments. Do not expose local demo credentials or secrets.
