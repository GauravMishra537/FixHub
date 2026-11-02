-- V17: new ticket status PARTIALLY_APPROVED (some sessions approved, some rejected).
-- The status column has a CHECK list. Drop the old one by what it contains (its name is not known here),
-- then add the full list again with the new value.

DO $$
DECLARE c record;
BEGIN
    FOR c IN
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'ticket'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%PENDING_APPROVAL%'
    LOOP
        EXECUTE format('ALTER TABLE ticket DROP CONSTRAINT %I', c.conname);
    END LOOP;
END $$;

ALTER TABLE ticket DROP CONSTRAINT IF EXISTS ck_ticket_status;

ALTER TABLE ticket ADD CONSTRAINT ck_ticket_status CHECK (status IN (
    'NEW', 'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'REOPENED', 'CLOSED', 'CANCELLED',
    'PENDING_APPROVAL', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'ISSUED', 'RETURNED', 'ACCEPTED'));