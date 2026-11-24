# Startup guide

How to start FixHub on your own machine, from nothing to a working app. Allow about 15 minutes.

## Before you start

| Tool | Version | Check with |
|---|---|---|
| Java (JDK) | 23 | `java -version` |
| Node.js | 18 or newer | `node -v` |
| npm | 9 or newer | `npm -v` |
| PostgreSQL | 14 or newer | `psql --version` |
| Git | any | `git --version` |

## 1. Get the code
```bash
git clone https://github.com/GauravMishra537/FixHub.git
cd FixHub
```

## 2. Database
Create the role and the empty database. Steps are in [database setup](database-setup.md).

## 3. Settings
Set the required values from [environment variables](environment-variables.md) in the terminal that will run the backend:

**Linux / macOS**
```bash
export JWT_SECRET="$(openssl rand -base64 32)"
export SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/fixhub"
export SPRING_DATASOURCE_USERNAME="gaurav"
export SPRING_DATASOURCE_PASSWORD="your_password"
```

**Windows (PowerShell)**
```powershell
$env:JWT_SECRET = "a-long-random-text"
$env:SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:5432/fixhub"
$env:SPRING_DATASOURCE_USERNAME = "gaurav"
$env:SPRING_DATASOURCE_PASSWORD = "your_password"
```

A generated `JWT_SECRET` changes every time you export a new one, and that logs everyone out. For daily work, put the values in `application-local.yml` instead.

## 4. First admin (once)
Follow [admin bootstrap](admin-bootstrap.md). After that, start the backend normally.

## 5. Backend
```bash
cd backend
sh mvnw spring-boot:run
```
Windows: `mvnw.cmd spring-boot:run`

Wait for the line saying the application started. The first start also runs all the database migrations. The backend is at http://localhost:8080 and the API docs are at http://localhost:8080/swagger-ui.html.

## 6. Frontend
Open a second terminal.
```bash
cd frontend
npm install
npm run dev
```
The app opens at http://localhost:5173.

## 7. Check that it works
1. Open http://localhost:5173 and sign in as the admin.
2. Register a second account in a private window and verify its email. If email is not set up, copy the `Fallback verification URL` from the backend log.
3. As admin, approve that user under **Users**.
4. Sign in as that user and raise an issue ticket.

## Stopping
Press Ctrl+C in each terminal. PostgreSQL can keep running.

## Common problems

| Problem | Fix |
|---|---|
| Backend stops at once, `Could not resolve placeholder 'JWT_SECRET'` | `JWT_SECRET` is not set in this terminal. Export it again. |
| `password authentication failed` | The database login in your settings is wrong. |
| `Port 8080 was already in use` | Another program uses it. Stop it or set `SERVER_PORT`. |
| `PKIX path building failed` when sending email or signing in with Google | A company network is replacing certificates. Import your company root certificate into Java's `cacerts` with `keytool`, then restart the backend. Java reads certificates only at startup. |
| The page loads but every call fails | The backend is not running, or the frontend is pointed at another address. |
| Verification email never arrives | Check the Gmail app password, or use the fallback link from the log. |
| `npm install` fails | Node is older than 18. Update Node. |