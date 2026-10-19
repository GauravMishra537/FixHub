-- allow this migration to touch the admin row (V2 trigger), transaction-local
SELECT set_config('app.allow_admin_write', 'true', true);

-- departments
CREATE TABLE IF NOT EXISTS department (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_on  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by  BIGINT,
    updated_on  TIMESTAMPTZ,
    updated_by  BIGINT,
    deleted_on  TIMESTAMPTZ,
    deleted_by  BIGINT
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_department_name
    ON department (lower(name)) WHERE deleted_on IS NULL;

-- skill catalog (user-created names stay inactive until admin accepts)
CREATE TABLE IF NOT EXISTS skill (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_on  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by  BIGINT,
    updated_on  TIMESTAMPTZ,
    updated_by  BIGINT,
    deleted_on  TIMESTAMPTZ,
    deleted_by  BIGINT
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_skill_name
    ON skill (lower(name)) WHERE deleted_on IS NULL;

-- user <-> skill with admin review
CREATE TABLE IF NOT EXISTS user_skill (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT      NOT NULL REFERENCES users(id),
    skill_id      BIGINT      NOT NULL REFERENCES skill(id),
    status        VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewed_by   BIGINT,
    reviewed_on   TIMESTAMPTZ,
    reject_reason VARCHAR(500),
    created_on    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by    BIGINT,
    updated_on    TIMESTAMPTZ,
    updated_by    BIGINT,
    deleted_on    TIMESTAMPTZ,
    deleted_by    BIGINT,
    CONSTRAINT ck_user_skill_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_user_skill
    ON user_skill (user_id, skill_id) WHERE deleted_on IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_skill_status
    ON user_skill (status) WHERE deleted_on IS NULL;

-- users: new columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id BIGINT REFERENCES department(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS work_location VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_users_department ON users (department_id);

-- keep old text department, move to table, then drop text column (only if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'users' AND column_name = 'department') THEN

        INSERT INTO department (name)
        SELECT DISTINCT trim(u.department) FROM users u
        WHERE u.department IS NOT NULL AND trim(u.department) <> ''
          AND NOT EXISTS (SELECT 1 FROM department d
                          WHERE lower(d.name) = lower(trim(u.department))
                            AND d.deleted_on IS NULL);

        UPDATE users u SET department_id = d.id
        FROM department d
        WHERE d.deleted_on IS NULL
          AND lower(trim(u.department)) = lower(d.name);

        ALTER TABLE users DROP COLUMN department;
    END IF;
END $$;