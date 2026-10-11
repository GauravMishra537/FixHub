# FixHub

**Report. Book. Request. Learn.**

FixHub is an office-wide ticket and request management platform. Employees can report office problems, book meeting rooms, request office resources, and seek technical or learning assistance — all through one universal ticket engine with type-specific workflows.

---

## Features

| Module | Description |
|--------|-------------|
| **Issue Reporting** | Electrical, plumbing, IT/network, furniture, and general maintenance tickets |
| **Room Booking** | Meeting room availability, booking requests, approval, and conflict prevention |
| **Resource Requests** | Office equipment requests, inventory management, issuing, and returns |
| **Learning & Help** | Topic requests, skill-based discovery, voluntary acceptance, and resolution |

All request types share a universal ticket engine with common identity, status tracking, comments, attachments, history, and notifications.

---

## Technology Stack

### Backend
- Java 23
- Spring Boot 4.x
- Maven (with Maven Wrapper)
- Spring Security
- Spring Data JPA + Hibernate (`ddl-auto: update`)
- PostgreSQL
- Jakarta Bean Validation
- Springdoc OpenAPI / Swagger
- JUnit 5 + Mockito

### Frontend
- React 18
- JavaScript (JSX)
- Vite
- React Router
- Tailwind CSS
- TanStack Query
- React Hook Form

---

## Project Structure

```
FixHub/
├── backend/                    # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/fixhub/
│   │   │   └── resources/
│   │   └── test/
│   ├── pom.xml
│   └── mvnw / mvnw.cmd
├── frontend/                   # React application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── setup/                  # Setup and configuration guides
│   └── architecture/           # Architecture and design docs
├── .env.example                # Environment variable template
├── .gitignore
└── README.md
```

See [docs/architecture/project-structure.md](docs/architecture/project-structure.md) for the full structure reference.

---

## Quick Start

> **Prerequisites:** Java 23, Node.js 18+, npm 9+, PostgreSQL 14+

### 1. Clone the repository

```bash
git clone https://github.com/GauravMishra537/FixHub.git
cd FixHub
```

### 2. Set up PostgreSQL

Create the database and role (if they don't already exist):

```sql
-- Connect as a PostgreSQL superuser
CREATE ROLE gaurav WITH LOGIN PASSWORD 'your_password';
CREATE DATABASE fixhub OWNER gaurav;
```

See [docs/setup/database-setup.md](docs/setup/database-setup.md) for detailed instructions.

### 3. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your local PostgreSQL credentials
```

See [docs/setup/environment-variables.md](docs/setup/environment-variables.md) for the full variable reference.

### 4. Start the backend

```bash
cd backend
./mvnw spring-boot:run
# Windows: mvnw.cmd spring-boot:run
```

The backend starts at `http://localhost:8080`. Hibernate creates and updates tables automatically on startup.

### 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts at `http://localhost:5173`.

### 6. Bootstrap the first administrator

After registering through the UI, promote your account using the documented SQL procedure:

See [docs/setup/admin-bootstrap.md](docs/setup/admin-bootstrap.md)

---

## Documentation

| Document | Description |
|----------|-------------|
| [Database Setup](docs/setup/database-setup.md) | PostgreSQL installation and configuration |
| [Startup Guide](docs/setup/startup-guide.md) | Complete startup instructions for Windows |
| [Environment Variables](docs/setup/environment-variables.md) | All configuration variables |
| [Admin Bootstrap](docs/setup/admin-bootstrap.md) | How to create the first administrator |
| [Project Structure](docs/architecture/project-structure.md) | Folder layout and conventions |
| [Implementation Roadmap](docs/architecture/implementation-roadmap.md) | Implementation roadmap |

---

## Roles

| Role | Description |
|------|-------------|
| `ADMIN` | System management, user approval, ticket assignment, configuration |
| `USER` | Create tickets, be assigned to handle tickets, collaborate |

New accounts start as `PENDING` until an administrator approves them.

---

## Authentication

- **Email/password** — Registration, email verification, login, password recovery
- **Google OAuth 2.0** — Google sign-in with account linking

---

## License

This project is for educational and professional development purposes.
