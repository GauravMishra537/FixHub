ALTER TABLE users ADD COLUMN rejection_reason varchar(255);
ALTER TABLE users ADD COLUMN last_login_at timestamp(6) with time zone;