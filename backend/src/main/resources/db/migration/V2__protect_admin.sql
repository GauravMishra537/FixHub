-- V2: protect ADMIN rows in users from direct DB edits.
-- Bypass: session flag app.allow_admin_write = 'on' (transaction-local, used by bootstrap).

CREATE OR REPLACE FUNCTION protect_admin_rows() RETURNS trigger AS $$
BEGIN
    IF COALESCE(current_setting('app.allow_admin_write', true), '') = 'on' THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF NEW.role = 'ADMIN' THEN
            RAISE EXCEPTION 'Admin rows cannot be created directly';
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN
        IF OLD.role = 'ADMIN' THEN
            RAISE EXCEPTION 'Admin rows cannot be deleted';
        END IF;
        RETURN OLD;
    END IF;

    -- UPDATE
    IF NEW.role IS DISTINCT FROM OLD.role
       AND (OLD.role = 'ADMIN' OR NEW.role = 'ADMIN') THEN
        RAISE EXCEPTION 'Admin role cannot be changed';
    END IF;

    IF OLD.role = 'ADMIN' THEN
        IF NEW.email IS DISTINCT FROM OLD.email THEN
            RAISE EXCEPTION 'Admin email cannot be changed';
        END IF;
        IF NEW.password_hash IS DISTINCT FROM OLD.password_hash THEN
            RAISE EXCEPTION 'Admin password cannot be changed';
        END IF;
        IF NEW.deleted_on IS DISTINCT FROM OLD.deleted_on THEN
            RAISE EXCEPTION 'Admin cannot be deleted';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_admin_rows ON users;

CREATE TRIGGER trg_protect_admin_rows
    BEFORE INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION protect_admin_rows();