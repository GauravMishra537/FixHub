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
│   ├── architecture/               # Architecture and design documents
│   └── commit-reports/             # PDF reports for each commit
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
│   │   │   │   ├── controller/
│   │   │   │   ├── dto/
│   │   │   │   ├── entity/
│   │   │   │   ├── repository/
│   │   │   │   ├── service/
│   │   │   │   └── security/
│   │   │   ├── user/               # User management
│   │   │   │   ├── controller/
│   │   │   │   ├── dto/
│   │   │   │   ├── entity/
│   │   │   │   ├── repository/
│   │   │   │   ├── service/
│   │   │   │   └── mapper/
│   │   │   ├── ticket/             # Universal ticket engine
│   │   │   │   ├── controller/
│   │   │   │   ├── dto/
│   │   │   │   ├── entity/
│   │   │   │   ├── repository/
│   │   │   │   ├── service/
│   │   │   │   ├── mapper/
│   │   │   │   └── workflow/
│   │   │   ├── room/               # Meeting room booking
│   │   │   ├── resource/           # Resource requests
│   │   │   ├── notification/       # Notifications
│   │   │   ├── admin/              # Admin-specific logic
│   │   │   ├── routing/            # Assignment and routing
│   │   │   ├── dashboard/          # Dashboard APIs
│   │   │   ├── audit/              # Audit logging
│   │   │   └── common/             # Shared utilities
│   │   │       ├── config/         # Spring configuration
│   │   │       ├── dto/            # Shared DTOs (ApiResponse, etc.)
│   │   │       ├── exception/      # Global exception handling
│   │   │       ├── validation/     # Custom validators
│   │   │       └── util/           # Utility classes
│   │   └── resources/
│   │       ├── application.yml     # Main configuration
│   │       ├── application-dev.yml # Dev profile
│   │       └── db/
│   │           └── migration/      # Flyway migration files
│   └── test/
│       └── java/com/fixhub/        # Test classes (mirrors main structure)
├── pom.xml                         # Maven project configuration
├── mvnw                            # Maven Wrapper (Unix)
└── mvnw.cmd                        # Maven Wrapper (Windows)
```

---

## Frontend Structure

```
frontend/
├── public/                         # Static assets
├── src/
│   ├── api/                        # API client and service functions
│   ├── components/                 # Reusable UI components
│   │   ├── common/                 # Buttons, inputs, badges, etc.
│   │   ├── layout/                 # Header, sidebar, footer
│   │   └── forms/                  # Shared form components
│   ├── features/                   # Feature-specific components
│   │   ├── auth/                   # Login, register, password reset
│   │   ├── dashboard/              # User and admin dashboards
│   │   ├── tickets/                # Ticket views and forms
│   │   ├── rooms/                  # Room booking
│   │   ├── resources/              # Resource requests
│   │   ├── notifications/          # Notification components
│   │   └── admin/                  # Admin management screens
│   ├── hooks/                      # Custom React hooks
│   ├── lib/                        # Utility functions and configuration
│   ├── pages/                      # Page-level route components
│   ├── routes/                     # Route definitions and guards
│   ├── types/                      # TypeScript type definitions
│   ├── App.tsx                     # Root application component
│   ├── main.tsx                    # Application entry point
│   └── index.css                   # Global styles (Tailwind imports)
├── index.html                      # HTML entry point
├── package.json                    # npm dependencies
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite configuration
├── tailwind.config.js              # Tailwind CSS configuration
└── vitest.config.ts                # Test configuration
```

---

## Documentation Structure

```
docs/
├── setup/
│   ├── database-setup.md           # PostgreSQL setup guide
│   ├── startup-guide.md            # Complete startup instructions
│   ├── environment-variables.md    # Environment variable reference
│   └── admin-bootstrap.md         # First administrator setup
├── architecture/
│   ├── project-structure.md        # This file
│   └── implementation-roadmap.md   # 35-commit development plan
└── commit-reports/
    ├── commit-01-report.pdf        # Commit 1 report
    ├── commit-02-report.pdf        # Commit 2 report
    └── ...                         # One PDF per commit
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
| Migration naming | `V{N}__{description}.sql` (double underscore) |
| Test naming | `{ClassName}Test.java` |

### Frontend

| Convention | Rule |
|-----------|------|
| Components | PascalCase (`LoginForm.tsx`, `TicketList.tsx`) |
| Hooks | camelCase with `use` prefix (`useAuth.ts`, `useTickets.ts`) |
| API services | camelCase (`authApi.ts`, `ticketApi.ts`) |
| Types | PascalCase (`User`, `Ticket`, `ApiResponse`) |
| Pages | PascalCase (`DashboardPage.tsx`, `LoginPage.tsx`) |
| Tests | `{component}.test.tsx` |
| CSS | Tailwind utility classes (no custom CSS unless necessary) |

### Git

| Convention | Rule |
|-----------|------|
| Branch | `main` |
| Commit format | Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`) |
| Commit scope | Module name (`auth`, `ticket`, `room`, `docs`) |
