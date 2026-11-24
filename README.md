# FixHub

*Report. Book. Request. Learn.*

FixHub is a web app for the everyday requests of an office. Staff can report a broken thing, book a room or a lab, ask for equipment or software, or ask a colleague to explain a topic. Each of these is a ticket. They share one ticket engine (numbering, status, comments, files, history, notifications) and each type has its own workflow on top.

This README is for developers: how the project is built and how to run it. If you want to use the app, read the [User Guide](docs/user-guide.md).

## What it does

| Module | What happens |
|---|---|
| Issue ticket | An employee reports a problem with a category. Routing rules send it to a department. Someone in that department claims it (first one wins, or an admin approves the claim when the author asked for that), works on it, and resolves it. The author confirms or reopens. |
| Infra booking | A room, lab or space is booked for one or more sessions. The server checks for clashes. An admin approves or rejects. A booking can be partly approved, and it closes by itself after its last session ends. |
| Resource request | An employee asks for an item from a catalog (hardware, software, cloud, office items). The department approver decides first, then an admin. Physical items have stock that is held and released. |
| Topic request | An employee picks 1 to 3 topics (skills) and describes the problem. Users who hold a matching approved skill are notified and see it in My queue. One of them takes it, or an admin assigns someone. The helper shares links, files and an explanation. The author says solved or not solved. A helper who gets too busy can hand it back. |

All four share the same ticket number sequence, comments, attachments, timeline and bell notifications.

## Tech stack

**Backend**
- Java 23, Spring Boot 4.1
- Maven (wrapper included)
- Spring Security with JWT login, Google OAuth 2.0
- Spring Data JPA, Hibernate
- PostgreSQL, schema managed by Flyway
- Springdoc OpenAPI (Swagger UI)
- Lombok

**Frontend**
- React, JavaScript (JSX)
- Vite
- React Router
- Tailwind CSS (with a dark theme)
- lucide-react icons

Files are uploaded in parts straight from the browser to object storage with signed links, so file bytes never pass through the backend.

## Project structure

```
FixHub/
├── backend/
│   ├── src/main/java/com/fixhub/
│   │   ├── ticket/          shared ticket engine: rules, workflow, claims, comments, files
│   │   ├── infra/           bookings and availability
│   │   ├── resources/       catalog, stock, approvers
│   │   ├── topic/           skill-routed help requests
│   │   ├── notification/    the bell
│   │   ├── user/            users, departments, skills
│   │   └── common/          auth, storage, shared DTOs
│   ├── src/main/resources/
│   │   └── db/migration/    Flyway files, V1 to V19
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── api/             one file per backend area
│   │   ├── components/      shared UI and ticket page parts
│   │   ├── infra/  resources/  topics/    module pages and components
│   │   └── hooks/  context/  utils/
│   ├── package.json
│   └── vite.config.js
├── docs/
│   ├── setup/               database, environment, first admin
│   ├── architecture/        structure and design notes
│   └── user-guide.md        for people who use the app
├── .env.example
└── README.md
```

## How the ticket engine works

- One `ticket` table holds every type. A `type` column tells them apart.
- `TicketWorkflow` has one table per type: which status can move to which, and who may do it (assignee, author, admin). The ticket page asks the server which buttons the current user may press, so the rules live in one place.
- `TicketRules` holds view, edit and claim rules.
- A type that keeps its own rows plugs in through `TicketLifecycleHook` (booking sessions, topic helper hand-back). The ticket package never imports a type package.
- Every change writes a row to `ticket_history`, which feeds the Activity timeline.

## Running it locally

Needs Java 23, Node.js 18 or newer, and PostgreSQL 14 or newer.

**1. Clone**
```bash
git clone https://github.com/GauravMishra537/FixHub.git
cd FixHub
```

**2. Create the database**
```sql
-- as a PostgreSQL superuser
CREATE ROLE gaurav WITH LOGIN PASSWORD 'your_password';
CREATE DATABASE fixhub OWNER gaurav;
```
Tables are created by Flyway when the backend starts, so there is nothing else to run. Details are in [database setup](docs/setup/database-setup.md).

**3. Settings**
Set the required values in the terminal that runs the backend (database login and `JWT_SECRET`), or put them in `backend/src/main/resources/application-local.yml`, which is not committed. The list is in [environment variables](docs/setup/environment-variables.md). `.env.example` shows the names.

**4. Start the backend**
```bash
cd backend
sh mvnw spring-boot:run
```
It runs at http://localhost:8080. Swagger UI is served by Springdoc.

**5. Start the frontend**
```bash
cd frontend
npm install
npm run dev
```
It runs at http://localhost:5173.

**6. Make the first admin**
A one-time command creates the first admin account. See [admin bootstrap](docs/setup/admin-bootstrap.md). After that, new users register, verify their email and wait for the admin to approve them under Users.

## Roles and sign-in

- **ADMIN** manages users, departments, categories, the infra catalog, the resource catalog and approvers. Admins assign tickets and approve bookings and requests. They do not claim tickets.
- **USER** raises tickets, claims or is assigned work, and can approve resource requests when set as a department approver.

Sign-in is email and password (with email verification and password reset) or Google.

## Documentation

| Document | For |
|---|---|
| [User Guide](docs/user-guide.md) | People using FixHub: how to raise, track and handle each kind of request |
| [Database setup](docs/setup/database-setup.md) | PostgreSQL install and database creation |
| [Environment variables](docs/setup/environment-variables.md) | Every configuration value |
| [Admin bootstrap](docs/setup/admin-bootstrap.md) | Creating the first administrator |
| [Project structure](docs/architecture/project-structure.md) | Folder layout and naming |
| [Startup guide](docs/setup/startup-guide.md) | Start everything on your machine, step by step |

## License

Built for learning and professional development. Not licensed for redistribution.