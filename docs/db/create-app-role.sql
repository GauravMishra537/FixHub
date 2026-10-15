-- Run once per machine as postgres, AFTER creating the fixhub DB, BEFORE first app start.
-- Owner (gaurav) runs Flyway and owns tables/triggers. fixhub_app is app-only, cannot drop triggers.

CREATE ROLE fixhub_app LOGIN PASSWORD :'app_password';

GRANT CONNECT ON DATABASE fixhub TO fixhub_app;
GRANT USAGE ON SCHEMA public TO fixhub_app;

-- Tables created later by gaurav (Flyway) get these grants automatically
ALTER DEFAULT PRIVILEGES FOR ROLE gaurav IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO fixhub_app;
ALTER DEFAULT PRIVILEGES FOR ROLE gaurav IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO fixhub_app;