-- topic request: which topics (skills) a ticket is about, the learning material a helper adds,
-- and who said "I'm busy". everything else is reused: ticket, ticket_claim, comments, attachments

-- topics of a ticket. a topic is a skill, so people with that approved skill are asked to help
CREATE TABLE IF NOT EXISTS topic_request_skill (
    id         BIGSERIAL PRIMARY KEY,
    ticket_id  BIGINT      NOT NULL REFERENCES ticket(id),
    skill_id   BIGINT      NOT NULL REFERENCES skill(id),
    created_on TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by BIGINT,
    updated_on TIMESTAMPTZ,
    updated_by BIGINT,
    deleted_on TIMESTAMPTZ,
    deleted_by BIGINT
);
CREATE UNIQUE INDEX IF NOT EXISTS uk_topic_request_skill
    ON topic_request_skill (ticket_id, skill_id) WHERE deleted_on IS NULL;
CREATE INDEX IF NOT EXISTS idx_topic_request_skill_skill
    ON topic_request_skill (skill_id) WHERE deleted_on IS NULL;

-- links, videos and documents the helper shares. PDFs and files use the normal attachments
CREATE TABLE IF NOT EXISTS topic_link (
    id         BIGSERIAL PRIMARY KEY,
    ticket_id  BIGINT        NOT NULL REFERENCES ticket(id),
    added_by   BIGINT        NOT NULL REFERENCES users(id),
    title      VARCHAR(200)  NOT NULL,
    url        VARCHAR(1000) NOT NULL,
    kind       VARCHAR(20)   NOT NULL DEFAULT 'LINK',
    created_on TIMESTAMPTZ   NOT NULL DEFAULT now(),
    created_by BIGINT,
    updated_on TIMESTAMPTZ,
    updated_by BIGINT,
    deleted_on TIMESTAMPTZ,
    deleted_by BIGINT,
    CONSTRAINT ck_topic_link_kind CHECK (kind IN ('LINK', 'VIDEO', 'DOCUMENT')),
    -- only web links, so a javascript: link can never be stored
    CONSTRAINT ck_topic_link_url CHECK (url ~* '^https?://')
);
CREATE INDEX IF NOT EXISTS idx_topic_link_ticket ON topic_link (ticket_id) WHERE deleted_on IS NULL;

-- "I'm busy": a helper gave the ticket back. he cannot claim it again, and admin sees who was busy.
-- append only, like the history
CREATE TABLE IF NOT EXISTS topic_decline (
    id         BIGSERIAL PRIMARY KEY,
    ticket_id  BIGINT      NOT NULL REFERENCES ticket(id),
    user_id    BIGINT      NOT NULL REFERENCES users(id),
    note       VARCHAR(500),
    created_on TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_topic_decline_ticket_user ON topic_decline (ticket_id, user_id);

-- app role: normal access, and the busy log is insert only
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'fixhub_app') THEN
        GRANT SELECT, INSERT, UPDATE ON topic_request_skill, topic_link TO fixhub_app;
        GRANT SELECT, INSERT ON topic_decline TO fixhub_app;
        REVOKE UPDATE, DELETE ON topic_decline FROM fixhub_app;
        GRANT USAGE, SELECT ON SEQUENCE
            topic_request_skill_id_seq, topic_link_id_seq, topic_decline_id_seq
            TO fixhub_app;
    END IF;
END $$;