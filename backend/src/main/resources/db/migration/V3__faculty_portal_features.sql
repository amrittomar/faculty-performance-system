ALTER TABLE faculty
    ADD COLUMN job_title VARCHAR(100),
    ADD COLUMN expertise VARCHAR(1000),
    ADD COLUMN phone VARCHAR(40),
    ADD COLUMN office_location VARCHAR(160),
    ADD COLUMN bio VARCHAR(2000);

CREATE TABLE faculty_goals (
    id BIGSERIAL PRIMARY KEY,
    faculty_id BIGINT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    description VARCHAR(1000),
    category VARCHAR(40) NOT NULL,
    target_date DATE NOT NULL,
    progress INTEGER NOT NULL CHECK (progress BETWEEN 0 AND 100)
);
CREATE INDEX idx_goals_faculty_date ON faculty_goals(faculty_id, target_date);

CREATE TABLE faculty_reminders (
    id BIGSERIAL PRIMARY KEY,
    faculty_id BIGINT NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    title VARCHAR(160) NOT NULL,
    details VARCHAR(1000),
    due_date DATE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_reminders_faculty_date ON faculty_reminders(faculty_id, due_date);
