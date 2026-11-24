# Creating the first administrator

New people register themselves, verify their email, and wait for an admin to approve them. That leaves one problem: the very first admin has nobody to approve them. A one-time startup command creates that account.

## Run the bootstrap

Stop the backend if it is running. In the terminal, from the `backend` folder:

```bash
ADMIN_EMAIL="admin@example.com" \
ADMIN_PASSWORD="choose-a-strong-password" \
ADMIN_NAME="System Administrator" \
sh mvnw spring-boot:run -Dspring-boot.run.arguments="--app.bootstrap-admin=true"
```

(Windows: set the three variables first, then run `mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--app.bootstrap-admin=true"`.)

Make sure the other required variables are set in the same terminal. See [environment variables](environment-variables.md).

Rules:
- The password must be at least 8 characters.
- The email must be a valid address.
- If an admin already exists, nothing is created. This is safe to run again.

When the log shows the admin was created (or that one already exists), stop the backend with Ctrl+C and start it again without the flag:

```bash
sh mvnw spring-boot:run
```

## Sign in

Open http://localhost:5173, choose **Login**, and use the email and password you gave. Change the password if you used a throwaway one.

## Approving everyone else

1. A person registers and opens the link in their email.
2. Their request appears for the admin under **Users**.
3. The admin approves it, and sets their department and role. Only then can the person sign in.

## If it does not work

| Problem | What to check |
|---|---|
| Nothing is created and no admin appears | The email or password is missing or invalid, or an admin already exists. Read the `[Admin Bootstrap]` lines in the log. |
| You cannot sign in | Use exactly the email and password from the command. Check that the backend was started again without the flag. |
| Wrong values were used | Delete the user row in the database for that email, or reset the development database ([database setup](database-setup.md)), then run the bootstrap again. |