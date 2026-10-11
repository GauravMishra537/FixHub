# Project Structure

Reference for FixHub's folder layout and conventions.

---

## Root Structure

```
FixHub/
├── backend/                        # Spring Boot application
├── frontend/                       # React application
├── docs/                           # Documentation
│   ├── setup/                      # Setup and configuration guides
│   └── architecture/               # Architecture and design documents
├── .env.example                    # Environment variable template
├── .gitignore                      # Git ignore rules
└── README.md                       # Project overview
```

---

## Backend Structure

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/fixhub/
│   │   │   ├── FixHubApplication.java
│   │   │   ├── auth/               # Authentication and authorization
│   │   │   ├── user/               # User management
│   │   │   ├── ticket/             # Universal ticket engine
│   │   │   ├── room/               # Meeting room booking
│   │   │   ├── resource/           # Resource requests
│   │   │   ├── notification/       # Notifications
│   │   │   ├── admin/              # Admin-specific logic
│   │   │   ├── routing/            # Assignment and routing
│   │   │   ├── dashboard/          # Dashboard APIs
│   │   │   ├── audit/              # Audit logging
│   │   │   └── common/             # Shared configuration, exceptions, DTOs
│   │   │       ├── config/         # Spring Security & CORS configuration
│   │   │       └── exception/      # Global exception handling
│   │   └── resources/
│   │       └── application.yml     # Main configuration (PostgreSQL + Hibernate)
│   └── test/
│       └── java/com/fixhub/        # Test classes
├── pom.xml                         # Maven project configuration (Java 23, Boot 4)
├── mvnw                            # Maven Wrapper (Unix)
└── mvnw.cmd                        # Maven Wrapper (Windows)
```

---

## Frontend Structure

```
frontend/
├── public/                         # Static assets
├── src/
│   ├── components/                 # Reusable UI components
│   ├── features/                   # Feature-specific components
│   ├── hooks/                      # Custom React hooks
│   ├── pages/                      # Page-level route components
│   ├── routes/                     # Route definitions
│   ├── App.jsx                     # Root application component
│   ├── main.jsx                    # Application entry point
│   └── index.css                   # Global styles (Tailwind imports)
├── index.html                      # HTML entry point
├── package.json                    # npm dependencies
├── vite.config.js                  # Vite configuration
└── tailwind.config.js              # Tailwind CSS configuration
```

---

## Conventions

### Backend

| Convention | Rule |
|-----------|------|
| Package base | `com.fixhub` |
| Package structure | Feature-based (`auth`, `user`, `ticket`, etc.) |
| Entity naming | Singular (`User`, `Ticket`, `Room`) |
| Table naming | Lowercase plural (`users`, `tickets`, `rooms`) |
| DTO suffix | `Request` / `Response` (`LoginRequest`, `TicketResponse`) |
| Schema management | Hibernate auto update (`ddl-auto: update`) |
| Test naming | `{ClassName}Test.java` |

### Frontend

| Convention | Rule |
|-----------|------|
| Language | JavaScript (JSX) |
| Components | PascalCase (`LoginForm.jsx`, `TicketList.jsx`) |
| Hooks | camelCase with `use` prefix (`useAuth.js`, `useTickets.js`) |
| Pages | PascalCase (`DashboardPage.jsx`, `LoginPage.jsx`) |
| CSS | Tailwind utility classes |

### Git

| Convention | Rule |
|-----------|------|
| Branch | `main` |
| Commit format | Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`) |
