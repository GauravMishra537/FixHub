-- ticket.requester_id becomes ticket.author_id
-- index and constraint names that contain "requester" are renamed too
DO $$
DECLARE
    r record;
BEGIN
    IF EXISTS (SELECT 1
               FROM information_schema.columns
               WHERE table_schema = current_schema()
                 AND table_name = 'ticket'
                 AND column_name = 'requester_id') THEN
        ALTER TABLE ticket RENAME COLUMN requester_id TO author_id;
    END IF;

    FOR r IN SELECT indexname
             FROM pg_indexes
             WHERE schemaname = current_schema()
               AND tablename = 'ticket'
               AND indexname LIKE '%requester%'
    LOOP
        EXECUTE format('ALTER INDEX %I RENAME TO %I',
                       r.indexname, replace(r.indexname, 'requester', 'author'));
    END LOOP;

    FOR r IN SELECT conname
             FROM pg_constraint
             WHERE conrelid = 'ticket'::regclass
               AND conname LIKE '%requester%'
    LOOP
        EXECUTE format('ALTER TABLE ticket RENAME CONSTRAINT %I TO %I',
                       r.conname, replace(r.conname, 'requester', 'author'));
    END LOOP;
END $$;