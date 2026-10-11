# Database Setup Guide

This guide covers PostgreSQL setup for FixHub on Windows.

---

## Prerequisites

- **PostgreSQL 14+** installed locally
- Access to `psql` or pgAdmin

---

## 1. Install PostgreSQL

Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/windows/).

During installation:
- Note the superuser (`postgres`) password you set
- Default port is `5432`
- Add PostgreSQL `bin` directory to your system PATH if not done automatically

Verify installation:

```bash
psql --version
```

---

## 2. Create the Login Role

Connect as the PostgreSQL superuser:

```bash
psql -U postgres
```

Create the `gaurav` role (skip if it already exists):

```sql
-- Check if the role exists
SELECT rolname FROM pg_roles WHERE rolname = 'gaurav';

-- Create the role if it doesn't exist
CREATE ROLE gaurav WITH LOGIN PASSWORD 'your_password_here';

-- Grant the ability to create databases (optional, useful for testing)
ALTER ROLE gaurav CREATEDB;
```

> **Note:** Replace `your_password_here` with your actual password. Use the same password on both computers for consistency. Never commit this password to Git.

---

## 3. Create the Database

```sql
-- Check if the database exists
SELECT datname FROM pg_database WHERE datname = 'fixhub';

-- Create the database if it doesn't exist
CREATE DATABASE fixhub OWNER gaurav;
```

Verify access:

```bash
psql -U gaurav -d fixhub
```

You should see the `fixhub=>` prompt.

---

## 4. Verify the Connection

Test the JDBC connection string that Spring Boot will use:

| Property | Value |
|----------|-------|
| Host | `localhost` |
| Port | `5432` |
| Database | `fixhub` |
| Username | `gaurav` |
| JDBC URL | `jdbc:postgresql://localhost:5432/fixhub` |

---

## 5. Flyway Migrations

FixHub uses [Flyway](https://flywaydb.org/) for incremental database migrations.

- Migration files are located in `backend/src/main/resources/db/migration/`
- Naming convention: `V1__description.sql`, `V2__description.sql`, etc.
- Flyway runs automatically when the Spring Boot application starts
- Migrations are applied in version order
- **Never edit a migration that has already been applied.** Create a new migration instead.

On a fresh database, all migrations run in order to build the complete schema.

---

## 6. Two-Computer Setup

The same codebase works on both computers. Each computer has its own local PostgreSQL installation.

### What Git stores (shared between computers):
- Source code
- Flyway migration files
- Configuration templates (`.env.example`)
- Documentation

### What stays local (NOT shared through Git):
- `.env` file with your credentials
- PostgreSQL database contents
- Uploaded files (in the `uploads/` directory)

### Steps on a new computer:

1. Clone the repository
2. Install PostgreSQL locally
3. Create the `gaurav` role with your local password
4. Create the empty `fixhub` database
5. Copy `.env.example` to `.env` and fill in your local credentials
6. Start the backend — Flyway applies all migrations automatically

---

## 7. Database Backup and Restore

### Backup

```bash
pg_dump -U gaurav -d fixhub -F c -f fixhub_backup.dump
```

### Restore to another computer

```bash
# Create the empty database first
createdb -U gaurav fixhub

# Restore the backup
pg_restore -U gaurav -d fixhub fixhub_backup.dump
```

### Export as SQL (human-readable)

```bash
pg_dump -U gaurav -d fixhub > fixhub_backup.sql
```

> **Important:** Backup files contain data. Do not commit them to Git.

---

## 8. Troubleshooting

| Problem | Solution |
|---------|----------|
| `FATAL: role "gaurav" does not exist` | Create the role: `CREATE ROLE gaurav WITH LOGIN PASSWORD '...';` |
| `FATAL: database "fixhub" does not exist` | Create the database: `CREATE DATABASE fixhub OWNER gaurav;` |
| `FATAL: password authentication failed` | Verify the password in your `.env` file matches the role's password |
| `Connection refused on port 5432` | Ensure PostgreSQL service is running |
| Flyway migration conflict | Never edit applied migrations. Create a new migration file. |
| `psql` not found | Add PostgreSQL `bin` directory to your system PATH |

---

## Important Rules

1. **Never** use `DROP DATABASE fixhub` or `DROP SCHEMA public CASCADE`
2. **Never** use Hibernate `ddl-auto=create` or `ddl-auto=create-drop`
3. **Never** edit a Flyway migration that has already been applied
4. **Never** commit database credentials to Git
5. **Always** create new versioned migrations for schema changes
6. **Always** test migrations on an isolated database if they involve data transformation
