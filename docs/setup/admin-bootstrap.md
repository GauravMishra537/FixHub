# Administrator Bootstrap Guide

FixHub does not automatically promote any user to `ADMIN`. The first administrator must be created manually through a safe, documented database procedure.

---

## Why Manual Bootstrap?

- **Security:** Prevents self-assignment of admin privileges during registration
- **No public admin endpoint:** There is no API to grant admin access
- **No auto-promotion:** The first registered user is NOT automatically made an admin
- **Controlled access:** Only someone with direct database access can create the initial admin

---

## Procedure

### Step 1: Register a Normal Account

Register through the FixHub UI at `http://localhost:5173/register`.

Your account will be created with:
- Role: `USER`
- Account status: `PENDING`

### Step 2: Find Your User ID

Connect to PostgreSQL:

```bash
psql -U gaurav -d fixhub
```

Find your registered account:

```sql
SELECT id, email, role, account_status FROM users WHERE email = 'your_email@example.com';
```

### Step 3: Promote to ADMIN and Activate

```sql
-- Promote the user to ADMIN and activate the account
UPDATE users
SET role = 'ADMIN', account_status = 'ACTIVE'
WHERE email = 'your_email@example.com';
```

> **Important:** Replace `your_email@example.com` with the actual email address you registered with.

### Step 4: Verify the Change

```sql
SELECT id, email, role, account_status FROM users WHERE email = 'your_email@example.com';
```

Expected result:

| id | email | role | account_status |
|----|-------|------|----------------|
| *(uuid)* | your_email@example.com | ADMIN | ACTIVE |

### Step 5: Log In

Log in through the UI. You should now have administrator access.

---

## Important Notes

1. **Run this procedure only once** — to create the first admin who can then approve and manage other accounts
2. **Keep it minimal** — promote only one account initially; additional admins can be managed through the admin dashboard
3. **Don't share the SQL** — this procedure requires direct database access, which should be limited to developers/operators
4. **Column names may vary** — the exact column names (`role`, `account_status`) will be confirmed when the user model is implemented in Commit 5. This document will be updated accordingly.

---

## After Bootstrap

Once you have an `ADMIN` account:

1. Log in to the admin dashboard
2. Review pending registrations
3. Approve or reject new accounts
4. Assign roles and organizational details through the UI

All subsequent admin operations should be done through the application, not through direct database manipulation.

---

## If the Schema Uses a Separate Roles Table

If the database model uses a normalized roles table (e.g., `user_roles`) instead of a role column, the SQL will be adjusted. Example:

```sql
-- Find the ADMIN role ID
SELECT id FROM roles WHERE name = 'ADMIN';

-- Assign ADMIN role to your user
INSERT INTO user_roles (user_id, role_id)
VALUES (
    (SELECT id FROM users WHERE email = 'your_email@example.com'),
    (SELECT id FROM roles WHERE name = 'ADMIN')
);

-- Activate the account
UPDATE users SET account_status = 'ACTIVE' WHERE email = 'your_email@example.com';
```

The exact SQL will be finalized in Commit 5 when the user data model is implemented.
