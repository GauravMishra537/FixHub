# Project structure

Folder layout, naming rules, and how a new feature fits in. For how to run the project, see the [README](../../README.md).

---

## Root

```
FixHub/
├── backend/            Spring Boot application
├── frontend/           React application
├── docs/
│   ├── setup/          database, environment, first admin, startup
│   ├── architecture/   this file
│   └── user-guide.md   for people who use the app
├── .gitignore
└── README.md
```

---

## Backend

Base package `com.fixhub`. Code is grouped by feature, and each feature repeats the same layers.

```
backend/
├── pom.xml
├── mvnw / mvnw.cmd                     Maven wrapper
└── src/
    ├── main/
    │   ├── java/com/fixhub/
    │   │   ├── FixHubApplication.java
    │   │   │
    │   │   ├── common/                 shared by every feature
    │   │   │   ├── auth/               login, registration, JWT filter, admin bootstrap
    │   │   │   ├── audit/              audit log
    │   │   │   ├── config/             security, CORS, web settings
    │   │   │   ├── storage/            object storage client, signed upload links
    │   │   │   ├── dto/                ApiResponse, PageResponse
    │   │   │   ├── entity/             AuditEntity (created/updated/deleted columns)
    │   │   │   └── exception/          global error handling
    │   │   │
    │   │   ├── user/                   users, departments, skills, org setup
    │   │   │
    │   │   ├── ticket/                 the shared ticket engine
    │   │   │   ├── entity/  repository/  dto/  mapper/
    │   │   │   ├── service/            TicketService, TicketRules, TicketWorkflow,
    │   │   │   │   └── impl/           claims, comments, attachments, routing, history
    │   │   │   └── controller/
    │   │   │
    │   │   ├── infra/                  bookings, sessions, availability
    │   │   ├── resource/               catalog, stock, approvers, resource requests
    │   │   ├── topic/                  skill-routed help requests, learning links
    │   │   └── notification/           the bell
    │   │
    │   └── resources/
    │       ├── application.yml         main settings
    │       ├── application-local.yml   your secrets (not committed)
    │       └── db/migration/           Flyway files V1__... to V19__...
    └── test/java/com/fixhub/           tests
```

### Layers inside a feature

```
controller   →   service (interface)   →   service.impl   →   repository   →   entity
   HTTP             the rules in               the work         database
                    one place
```

- **controller**: reads the request, finds who is calling, calls one service method, wraps the answer in `ApiResponse`. No rules here.
- **service / impl**: the rules and the transaction. Ticket rules live in `TicketRules` (view, edit, claim) and `TicketWorkflow` (which status can move where, and who may do it).
- **repository**: Spring Data interfaces. A feature that only reads another feature's table uses its own small read-only repository, so features do not reach into each other's code.
- **dto**: what goes over HTTP. Entities are never returned directly.
- **mapper**: entity to DTO.

### The ticket engine and the types

One `ticket` table holds every kind of ticket. A `type` column tells them apart: `ISSUE`, `INFRA_BOOKING`, `RESOURCE_REQUEST`, `TOPIC_REQUEST`.

- The `ticket` package never imports `infra`, `resource` or `topic`.
- A type that needs its own rows when the status changes implements `TicketLifecycleHook`. Booking sessions and the topic "I'm busy" hand-back work this way. The workflow calls the hook in the same transaction, before the ticket is saved.
- Every change writes a row in `ticket_history`. That is the Activity timeline.

### Adding a new ticket type

1. Add the value to `TicketType` and a migration that widens any CHECK constraint on `type` or `status`.
2. Add the type's table in `TicketWorkflow`, its start status in `TicketRules`, and any button labels.
3. If it keeps its own rows, add a `TicketLifecycleHook`.
4. Create its feature package: entities, repositories, a create service, a controller.
5. Add notification types if it needs new messages.
6. On the frontend, add a module folder (see below) and a card on the dashboard.

### Database changes

- Every schema change is a new file `V<next>__short_name.sql` in `db/migration/`.
- Never edit a migration that has already run. Flyway checks file checksums and refuses to start.
- Hibernate is set to `validate`. It checks, it never changes tables.
- Tables with soft delete have `created_on`, `updated_on`, `deleted_on` and the matching `_by` columns. Entities hide deleted rows with `@SQLRestriction("deleted_on IS NULL")`.

---

## Frontend

```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── public/                     static files
└── src/
    ├── main.jsx                entry point
    ├── App.jsx                 routes
    ├── index.css               Tailwind and theme
    │
    ├── api/                    one file per backend area (auth, admin, org,
    │                           ticketCore, attachments, infra, resources, topics ...)
    ├── context/                AuthContext (signed-in user, admin flag)
    ├── hooks/                  useTicketFilters, useBoardColumn, useApprovalCount ...
    ├── utils/                  format, options, time, icons
    ├── pages/                  top-level pages: dashboard, login, tickets, account, admin
    │
    ├── components/             shared UI
    │   ├── common/             Alert, SelectMenu, Editable, EditBar, FilterMenu, ThemeToggle ...
    │   ├── tickets/            the ticket page: details, action bar, claim box,
    │   │                       assign panel, comments, attachments, timeline, drawer
    │   ├── board/              the dashboard board and its columns
    │   ├── account/            account page parts
    │   └── admin/              admin page parts
    │
    ├── infra/                  infra booking:  pages/  components/  utils/
    ├── resources/              resource request: pages/  components/  utils/
    └── topics/                 topic request:  pages/  components/
```

Each ticket type has its own module folder (`infra`, `resources`, `topics`). Anything every type uses stays in `components/`.

### How the frontend talks to the backend

- All calls go through `apiClient` in `src/api/client.js`. It adds `/api`, sends the token, and returns the `data` part of the answer.
- Each area has an `xxxApi` object in its own file. Example: `topicsApi.queue()`.
- A change that other parts of the page must notice fires `window.dispatchEvent(new Event('tickets:changed'))`. The queue, the stats and the navbar badge listen for it.
- The ticket page asks the server which buttons the person may press (`ticket.actions`) and draws one for each. Status rules are not repeated in the browser.

---

## Naming rules

### Backend

| Item | Rule | Example |
|---|---|---|
| Package | lowercase, feature first | `com.fixhub.topic.service.impl` |
| Entity | singular noun | `Ticket`, `TopicLink` |
| Table | lowercase, snake_case. Mostly singular | `ticket`, `topic_link`, `users` |
| Request / response objects | `Dto` suffix, or a `record` | `TicketResponseDto`, `TopicRequestDto` |
| Service | interface plus `Impl` | `TopicRequestService`, `TopicRequestServiceImpl` |
| Migration | `V<number>__snake_case.sql` | `V19__topic_request.sql` |
| Enum values | UPPER_SNAKE_CASE | `DEPT_APPROVED` |
| Tests | `{ClassName}Test.java` | `TicketRulesTest.java` |

### Frontend

| Item | Rule | Example |
|---|---|---|
| Language | JavaScript with JSX | |
| Components and pages | PascalCase file | `TopicCard.jsx`, `TopicRequestPage.jsx` |
| Hooks | `use` prefix, camelCase | `useApprovalCount.js` |
| API files | camelCase, exports `xxxApi` | `topics.js` → `topicsApi` |
| Styling | Tailwind utility classes | |

### Git

| Item | Rule |
|---|---|
| Branch | `main` |
| Commits | Conventional Commits: `feat(topic): ...`, `fix: ...`, `docs: ...`, `chore: ...` |
| One commit | one feature step, backend and frontend in separate commits |