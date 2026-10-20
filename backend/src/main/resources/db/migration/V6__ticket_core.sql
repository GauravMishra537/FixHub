-- ticket categories (per ticket type)
CREATE TABLE IF NOT EXISTS ticket_category (
    id          BIGSERIAL PRIMARY KEY,
    ticket_type VARCHAR(30)  NOT NULL,
    name        VARCHAR(100) NOT NULL,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_on  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by  BIGINT,
    updated_on  TIMESTAMPTZ,
    updated_by  BIGINT,
    deleted_on  TIMESTAMPTZ,
    deleted_by  BIGINT,
    CONSTRAINT ck_ticket_category_type CHECK (
        ticket_type IN ('ISSUE', 'ROOM_BOOKING', 'RESOURCE_REQUEST', 'TOPIC_REQUEST'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_ticket_category_type_name
    ON ticket_category (ticket_type, lower(name)) WHERE deleted_on IS NULL;

-- ticket number source: FH-000001, FH-000002 ...
CREATE SEQUENCE IF NOT EXISTS ticket_no_seq START 1;

-- common ticket data (type specific data goes to detail tables in later commits)
CREATE TABLE IF NOT EXISTS ticket (
    id            BIGSERIAL PRIMARY KEY,
    ticket_no     VARCHAR(20)  NOT NULL,
    type          VARCHAR(30)  NOT NULL,
    title         VARCHAR(200) NOT NULL,
    description   TEXT,
    status        VARCHAR(30)  NOT NULL DEFAULT 'NEW',
    priority      VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM',
    visibility    VARCHAR(20)  NOT NULL DEFAULT 'PRIVATE',
    requester_id  BIGINT       NOT NULL REFERENCES users(id),
    assignee_id   BIGINT       REFERENCES users(id),
    category_id   BIGINT       REFERENCES ticket_category(id),
    department_id BIGINT       REFERENCES department(id),
    resolved_on   TIMESTAMPTZ,
    closed_on     TIMESTAMPTZ,
    reopen_count  INT          NOT NULL DEFAULT 0,
    version       BIGINT       NOT NULL DEFAULT 0,
    created_on    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_by    BIGINT,
    updated_on    TIMESTAMPTZ,
    updated_by    BIGINT,
    deleted_on    TIMESTAMPTZ,
    deleted_by    BIGINT,
    CONSTRAINT ck_ticket_type CHECK (
        type IN ('ISSUE', 'ROOM_BOOKING', 'RESOURCE_REQUEST', 'TOPIC_REQUEST')),
    -- superset of all statuses; allowed flow per type is checked in code (Commit 16)
    CONSTRAINT ck_ticket_status CHECK (status IN (
        'NEW', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'REOPENED',
        'CLOSED', 'CANCELLED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED',
        'ISSUED', 'RETURNED', 'ACCEPTED')),
    CONSTRAINT ck_ticket_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    CONSTRAINT ck_ticket_visibility CHECK (visibility IN ('PRIVATE', 'PUBLIC')),
    CONSTRAINT ck_ticket_reopen_count CHECK (reopen_count >= 0)
);
-- numbers are never reused, so no partial filter
CREATE UNIQUE INDEX IF NOT EXISTS uk_ticket_no ON ticket (ticket_no);
CREATE INDEX IF NOT EXISTS idx_ticket_requester  ON ticket (requester_id)  WHERE deleted_on IS NULL;
CREATE INDEX IF NOT EXISTS idx_ticket_assignee   ON ticket (assignee_id)   WHERE deleted_on IS NULL;
CREATE INDEX IF NOT EXISTS idx_ticket_status     ON ticket (status)        WHERE deleted_on IS NULL;
CREATE INDEX IF NOT EXISTS idx_ticket_type       ON ticket (type)          WHERE deleted_on IS NULL;
CREATE INDEX IF NOT EXISTS idx_ticket_category   ON ticket (category_id)   WHERE deleted_on IS NULL;
CREATE INDEX IF NOT EXISTS idx_ticket_department ON ticket (department_id) WHERE deleted_on IS NULL;
CREATE INDEX IF NOT EXISTS idx_ticket_created    ON ticket (created_on DESC) WHERE deleted_on IS NULL;

-- timeline, append only (no update, no delete, no soft delete)
CREATE TABLE IF NOT EXISTS ticket_history (
    id         BIGSERIAL PRIMARY KEY,
    ticket_id  BIGINT      NOT NULL REFERENCES ticket(id),
    actor_id   BIGINT,
    action     VARCHAR(40) NOT NULL,
    field_name VARCHAR(50),
    from_value TEXT,
    to_value   TEXT,
    note       VARCHAR(500),
    created_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_ticket_history_action CHECK (action IN (
        'CREATED', 'UPDATED', 'STATUS_CHANGED', 'ASSIGNED', 'COMMENTED', 'ATTACHED',
        'REOPENED', 'CANCELLED', 'BOOKING_RESCHEDULED', 'STOCK_ISSUED',
        'STOCK_RETURNED', 'OFFER_ACCEPTED'))
);
CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket
    ON ticket_history (ticket_id, created_on);

-- app role: normal access, and history is insert only
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'fixhub_app') THEN
        GRANT SELECT, INSERT, UPDATE ON ticket_category, ticket TO fixhub_app;
        GRANT SELECT, INSERT ON ticket_history TO fixhub_app;
        REVOKE UPDATE, DELETE ON ticket_history FROM fixhub_app;
        GRANT USAGE, SELECT ON SEQUENCE
            ticket_category_id_seq, ticket_id_seq, ticket_history_id_seq, ticket_no_seq
            TO fixhub_app;
    END IF;
END $$;