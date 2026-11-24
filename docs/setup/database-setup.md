# Database setup

FixHub uses PostgreSQL 14 or newer. You create an empty database and a login. The tables are created by Flyway when the backend starts.

## 1. Install PostgreSQL

**Ubuntu / Debian**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

**Windows**
Download the installer from postgresql.org, keep the default port 5432, and remember the password you set for the `postgres` user.

**macOS**
```bash
brew install postgresql@16
brew services start postgresql@16
```

## 2. Create the role and the database

Open a SQL session as the PostgreSQL superuser.

```bash
# Ubuntu / Debian
sudo -u postgres psql
# Windows / macOS: open psql and sign in as postgres
```

Then run:
```sql
CREATE ROLE gaurav WITH LOGIN PASSWORD 'your_password';
CREATE DATABASE fixhub OWNER gaurav;
```

Use your own role name and a strong password. Whatever you pick goes into the backend settings (see [environment variables](environment-variables.md)).

Check that the login works:
```bash
psql -h localhost -U gaurav -d fixhub -c "select 1"
```

## 3. Tables come from Flyway

You do not create tables by hand.

- The migration files are in `backend/src/main/resources/db/migration/`, named `V1__...`, `V2__...` and so on.
- When the backend starts, Flyway runs every migration that has not run yet and records it in the `flyway_schema_history` table.
- Hibernate is set to `validate`. It checks that the entities match the tables and never changes the schema.
- Never edit a migration that has already run. Add a new `V<next>__name.sql` instead. Flyway refuses to start if an applied file has changed.

Some migrations contain a guarded `GRANT` for a role named `fixhub_app`. It only runs if that role exists, so you can ignore it on a local machine.

## 4. Look at the data

Any client works. DBeaver is a good free one: connect to `localhost:5432`, database `fixhub`, with the role you created.

Main tables:

| Table | Holds |
|---|---|
| `users`, `registration_request` | Accounts and sign-up requests |
| `department`, `skill`, `user_skill` | Departments and skills |
| `ticket`, `ticket_history`, `ticket_comment`, `attachment` | The shared ticket engine |
| `ticket_claim`, `ticket_category` | Claims and categories |
| `booking` and the infra tables | Infra booking |
| resource tables | Resource catalog, stock and approvers |
| `topic_request_skill`, `topic_link`, `topic_decline` | Topic requests |
| `notification`, `audit_logs` | The bell and the audit trail |

## 5. Start again from nothing (development only)

This deletes all data.

```sql
-- as the superuser
DROP DATABASE fixhub;
CREATE DATABASE fixhub OWNER gaurav;
```
Start the backend. Flyway rebuilds every table. Then create the first admin again ([admin bootstrap](admin-bootstrap.md)).

## Troubleshooting

| Message | Cause and fix |
|---|---|
| `password authentication failed` | Wrong password in the backend settings, or the role does not exist. |
| `database "fixhub" does not exist` | Create it as in step 2. |
| `Connection refused` | PostgreSQL is not running (`sudo systemctl status postgresql`) or the port is not 5432. |
| `Validate failed: Migration checksum mismatch` | A migration that already ran was edited. Restore the file, or reset the development database. |
| `Schema-validation: missing table` | The migrations did not run. Check that Flyway is enabled and look at the first error in the backend log. |