-- V15: room booking is now infra booking. The type value changes in the three places that check it.
-- Constraint names come from the live tables. No ticket of this type exists yet, the updates are only a safety net.

ALTER TABLE ticket          DROP CONSTRAINT IF EXISTS ck_ticket_type;
ALTER TABLE ticket_category DROP CONSTRAINT IF EXISTS ck_ticket_category_type;
ALTER TABLE routing_rule    DROP CONSTRAINT IF EXISTS ck_routing_type;

UPDATE ticket          SET type        = 'INFRA_BOOKING' WHERE type        = 'ROOM_BOOKING';
UPDATE ticket_category SET ticket_type = 'INFRA_BOOKING' WHERE ticket_type = 'ROOM_BOOKING';
UPDATE routing_rule    SET ticket_type = 'INFRA_BOOKING' WHERE ticket_type = 'ROOM_BOOKING';

ALTER TABLE ticket ADD CONSTRAINT ck_ticket_type
    CHECK (type IN ('ISSUE', 'INFRA_BOOKING', 'RESOURCE_REQUEST', 'TOPIC_REQUEST'));
ALTER TABLE ticket_category ADD CONSTRAINT ck_ticket_category_type
    CHECK (ticket_type IN ('ISSUE', 'INFRA_BOOKING', 'RESOURCE_REQUEST', 'TOPIC_REQUEST'));
ALTER TABLE routing_rule ADD CONSTRAINT ck_routing_type
    CHECK (ticket_type IN ('ISSUE', 'INFRA_BOOKING', 'RESOURCE_REQUEST', 'TOPIC_REQUEST'));