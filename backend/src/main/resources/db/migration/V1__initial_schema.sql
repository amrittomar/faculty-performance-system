CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    code VARCHAR(80)
);

CREATE TABLE faculty (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN','DEAN','HOD','FACULTY')),
    department_id BIGINT NOT NULL REFERENCES departments(id),
    active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX idx_faculty_department ON faculty(department_id);

CREATE TABLE contributions (
    id BIGSERIAL PRIMARY KEY,
    faculty_id BIGINT NOT NULL REFERENCES faculty(id),
    category VARCHAR(40) NOT NULL,
    title VARCHAR(180) NOT NULL,
    description VARCHAR(2000),
    points DOUBLE PRECISION NOT NULL CHECK (points > 0),
    occurred_on DATE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING','APPROVED','REJECTED')),
    reviewer_id BIGINT REFERENCES faculty(id),
    review_comment VARCHAR(1000),
    created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_contributions_faculty_status ON contributions(faculty_id, status);

CREATE TABLE workloads (
    id BIGSERIAL PRIMARY KEY,
    faculty_id BIGINT NOT NULL REFERENCES faculty(id),
    academic_year VARCHAR(20) NOT NULL,
    term VARCHAR(20) NOT NULL,
    teaching_hours DOUBLE PRECISION NOT NULL CHECK (teaching_hours >= 0),
    research_hours DOUBLE PRECISION NOT NULL CHECK (research_hours >= 0),
    service_hours DOUBLE PRECISION NOT NULL CHECK (service_hours >= 0),
    CONSTRAINT uq_workload_period UNIQUE (faculty_id, academic_year, term)
);

CREATE TABLE academic_events (
    id BIGSERIAL PRIMARY KEY,
    faculty_id BIGINT NOT NULL REFERENCES faculty(id),
    title VARCHAR(180) NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    location VARCHAR(500),
    CONSTRAINT ck_event_time CHECK (end_at > start_at)
);
CREATE INDEX idx_events_faculty_time ON academic_events(faculty_id, start_at, end_at);

CREATE TABLE development_records (
    id BIGSERIAL PRIMARY KEY,
    faculty_id BIGINT NOT NULL REFERENCES faculty(id),
    record_type VARCHAR(30) NOT NULL CHECK (record_type IN ('FDP','MENTORING')),
    title VARCHAR(180) NOT NULL,
    details VARCHAR(1200),
    start_date DATE,
    end_date DATE,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT ck_development_dates CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE responsibilities (
    id BIGSERIAL PRIMARY KEY,
    faculty_id BIGINT NOT NULL REFERENCES faculty(id),
    title VARCHAR(160) NOT NULL,
    description VARCHAR(1000),
    start_date DATE,
    end_date DATE,
    effort_hours DOUBLE PRECISION NOT NULL CHECK (effort_hours >= 0),
    CONSTRAINT ck_responsibility_dates CHECK (start_date IS NULL OR end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_email VARCHAR(180) NOT NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id VARCHAR(80),
    details VARCHAR(2000),
    occurred_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_audit_occurred ON audit_logs(occurred_at DESC);
