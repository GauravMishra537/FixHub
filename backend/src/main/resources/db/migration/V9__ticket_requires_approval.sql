-- V9: the requester can tick "needs admin approval" when raising a ticket.
ALTER TABLE ticket ADD COLUMN IF NOT EXISTS requires_approval boolean NOT NULL DEFAULT false