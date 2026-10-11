# Startup Guide

Step-by-step instructions to set up and run FixHub on Windows.

---

## Prerequisites

Install the following tools locally:

| Tool | Minimum Version | Download |
|------|----------------|----------|
| Java (JDK) | 17 | [Adoptium](https://adoptium.net/) or [Oracle](https://www.oracle.com/java/technologies/downloads/) |
| Node.js | 18 | [nodejs.org](https://nodejs.org/) |
| npm | 9 | Included with Node.js |
| PostgreSQL | 14 | [postgresql.org](https://www.postgresql.org/download/windows/) |
| Git | Latest | [git-scm.com](https://git-scm.com/) |

> **Note:** Maven is NOT required globally. The project includes Maven Wrapper (`mvnw.cmd`), which downloads Maven automatically.

Verify installations:

```bash
java -version
node -v
npm -v
psql --version
git --version
```

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/GauravMishra537/FixHub.git
cd FixHub
```

---

## Step 2: Set Up PostgreSQL

If you haven't already created the database and role:

```bash
psql -U postgres
```

```sql
-- Create the role (skip if it exists)
CREATE ROLE gaurav WITH LOGIN PASSWORD 'your_password';

-- Create the database (skip if it exists)
CREATE DATABASE fixhub OWNER gaurav;

-- Exit
\q
```

See [database-setup.md](database-setup.md) for detailed instructions.

---

## Step 3: Configure Environment Variables

```bash
# From the project root
cp .env.example .env
```

Edit `.env` with your local credentials:

```properties
DB_PASSWORD=your_actual_password
SPRING_DATASOURCE_PASSWORD=your_actual_password
FLYWAY_PASSWORD=your_actual_password
JWT_SECRET=a_secure_random_string_at_least_32_characters
```

See [environment-variables.md](environment-variables.md) for the full reference.

---

## Step 4: Start the Backend

```bash
cd backend

# Windows
mvnw.cmd spring-boot:run

# PowerShell
.\mvnw.cmd spring-boot:run

# Git Bash / WSL
./mvnw spring-boot:run
```

The backend starts at **http://localhost:8080**.

On first startup, Flyway automatically applies all database migrations.

### Verify the backend

- Health check: `http://localhost:8080/actuator/health` (when Actuator is configured)
- API docs: `http://localhost:8080/swagger-ui.html` (when Springdoc is configured)

---

## Step 5: Start the Frontend

Open a **new terminal**:

```bash
cd frontend

# Install dependencies (first time or after dependency changes)
npm install

# Start the dev server
npm run dev
```

The frontend starts at **http://localhost:5173**.

---

## Step 6: Open the Application

Open your browser and navigate to:

```
http://localhost:5173
```

---

## Step 7: Register and Set Up Admin

1. Register a new account through the UI
2. The account will be in `PENDING` status
3. Promote your account to `ADMIN` using the database procedure documented in [admin-bootstrap.md](admin-bootstrap.md)
4. Log in as the admin and approve other registrations

---

## Running Tests

### Backend tests

```bash
cd backend
mvnw.cmd test
```

### Frontend tests

```bash
cd frontend
npm run test
```

### Frontend type checking

```bash
cd frontend
npx tsc --noEmit
```

### Frontend build verification

```bash
cd frontend
npm run build
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| `mvnw.cmd` not found | Ensure you are in the `backend/` directory |
| Port 8080 already in use | Stop the other process or change `SERVER_PORT` in `.env` |
| Port 5173 already in use | Vite will auto-select the next available port |
| Database connection failed | Verify PostgreSQL is running and `.env` credentials are correct |
| `npm install` fails | Delete `node_modules/` and `package-lock.json`, then retry |
| Java version mismatch | The project targets Java 17. JDK 17+ is required. |

---

## Stopping the Application

- **Backend:** Press `Ctrl+C` in the backend terminal
- **Frontend:** Press `Ctrl+C` in the frontend terminal
- **PostgreSQL:** The database service continues running in the background
