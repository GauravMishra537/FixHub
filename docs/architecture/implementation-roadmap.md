# Implementation Roadmap

FixHub is developed across 35 planned commits, each independently reviewed and tested.

---

## Phase 1 — Foundation (Commits 1–4)

### Commit 1: Repository Inspection and Project Foundation
- **Scope:** Inspect the existing repository. Establish folder structure. Add README, `.gitignore`, environment templates, and documentation.

### Commit 2: Backend and Frontend Build Setup
- **Scope:** Configure Spring Boot 4 + Maven backend (Java 23). Configure React + JavaScript + Vite frontend. Add compatible dependencies. Verify both applications build and start.

### Commit 3: PostgreSQL and Hibernate Schema Foundation
- **Scope:** Configure database connectivity with environment variables. Configure Hibernate `ddl-auto: update` for automatic schema updates. Verify clean database connection and table creation. Document setup for both computers.

### Commit 4: Common API and Test Infrastructure
- **Scope:** Add global exception handling and API response conventions. Configure backend and frontend test frameworks. Verify frontend-to-backend connectivity.

---

## Phase 2 — Authentication Vertical Slice (Commits 5–10)


#### Commit 5 — User Data Model and Minimal Application Shell
- **Backend:**
  - Entity: `User` (`users` table) with fields: `id`, `email` (unique, lowercase), `passwordHash`, `fullName`, `role` (`Role`: `ADMIN`, `USER`), `status` (`AccountStatus`: `PENDING`, `ACTIVE`, `REJECTED`, `SUSPENDED`), `department`, `designation`, `createdAt`, `updatedAt`.
  - Repository: `UserRepository` with `findByEmail`, `existsByEmail`.
  - DTOs: `UserRequestDto`, `UserResponseDto`.
  - Mapper: `UserMapper`.
  - Service: `UserService`, `UserServiceImpl`.
  - Controller: `UserController` (basic profile endpoint or user retrieval).
  - Tests: Persistence, constraints, and business logic tests.
- **Frontend:**
  - Establish minimal application shell, routing (`react-router-dom`), shared layout (`Layout`, `Navbar`, `Footer`), error boundary (`ErrorBoundary`), and home/fallback view.
- **Acceptance:** User data persists; unique constraints work; frontend shell and router render cleanly; tests and builds pass.

#### Commit 6 — Complete Registration Module
- **Backend:** Registration DTO, validation, mapper, `RegistrationService`, `RegistrationController`, BCrypt password hashing, pending account creation, email verification token generation & expiry, simulated/SMTP email sending.
- **Frontend:** Complete registration page, validation, password confirmation, loading states, duplicate email feedback, registration success screen, email verification screen.
- **Acceptance:** Registration works browser-to-database; passwords hashed; verification required.

#### Commit 7 — Complete Login, Initial Admin Provisioning, and Security Reconciliation
- **Backend:**
  - Login & Auth: Login DTOs, `AuthenticationService`, credential verification via BCrypt, account status enforcement (`PENDING`, `SUSPENDED`, `REJECTED` rejected), JWT generation via `JwtService`, `JwtAuthenticationFilter`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`.
  - Secure Admin Bootstrap: Command-line runner (`AdminBootstrapRunner` requiring `--app.bootstrap-admin=true`), `AdminBootstrapService` with mandatory single-admin safety check, email collision prevention, no password logging, and BCrypt encoding.
  - Security Reconciliation: SHA-256 verification token hashing, invalidation of all prior active tokens upon resend, and centralized append-only `AuditLog` infrastructure recording `USER_REGISTERED`, `EMAIL_VERIFIED`, `LOGIN_SUCCESS`, `LOGIN_FAILED`, and `ADMIN_BOOTSTRAPPED`.
  - Admin APIs: Protected `/api/admin/overview`, `/api/admin/pending-users`, `/api/admin/users` requiring `hasRole('ADMIN')`.
- **Frontend:** Interactive login page with role-based redirection, `AuthContext` with JWT persistence, `AdminRoute` security guard, `AdminDashboardPage` console with live metrics and approval queue preview, and authenticated `Navbar` session controls.
- **Acceptance:** Initial administrator provisioned and authenticated; active users log in; unverified/pending accounts rejected; ordinary users denied admin access; 53 automated tests passing.

#### Commit 8 — Google OAuth 2.0 Without OIDC
- **Backend:** State validation, callback processing, identity verification via Google UserInfo API (no OIDC), safe account linking.
- **Frontend:** Google sign-in button on login/register screens, callback handler page, loading and error states.
- **Acceptance:** Secure Google authentication without OIDC; browser-supplied email alone is never trusted.

#### Commit 9 — Password Recovery and Account Linking
- **Backend:** Password reset request, expiring single-use reset tokens, non-revealing response, password reset completion API.
- **Frontend:** Forgot password page, reset password page, validation, feedback, navigation back to login.
- **Acceptance:** End-to-end recovery; expired/reused tokens rejected.

#### Commit 10 — Admin Approval and Account Lifecycle
- **Backend:** Admin approval/rejection/suspension endpoints, privilege verification, audit logging.
- **Frontend:** Admin approval queue, user detail card, approve/reject confirmation modals, status messaging for pending users.
- **Acceptance:** Admins approve pending users; regular users cannot access approval endpoints.

---

### PHASE 3 — USER MANAGEMENT AND CORE TICKETS

#### Commit 11 — Complete User Management Module
- **Backend:** User listing, pagination, search, detail, permitted updates, safe deactivation.
- **Frontend:** User management page, search/filter controls, user table, edit modal, status toggles.
- **Acceptance:** Full administrative user management functioning end-to-end.

#### Commit 12 — Core Ticket Data Model
- **Backend:** `Ticket` entity, types (`ISSUE`, `ROOM_BOOKING`, `RESOURCE_REQUEST`, `TOPIC_REQUEST`), statuses, creator, assignee, visibility (`PUBLIC`, `PRIVATE`), repository.
- **Frontend:** Shared ticket types, status badges, ticket primitives, API contracts.
- **Acceptance:** Ticket entity and relationships persist correctly.

#### Commit 13 — Complete Ticket Creation and Details
- **Backend:** Ticket DTOs, mapper, service, controller for creating and viewing tickets.
- **Frontend:** Ticket creation forms, category selector, ticket detail view, validation, loading and success states.
- **Acceptance:** Users create and view persisted tickets through the UI.

#### Commit 14 — Ticket Search and Filtering
- **Backend:** Search by title/description, filters by status/category/assignee, pagination, authorized visibility queries.
- **Frontend:** Search input, filter drawer/bar, sorting dropdown, pagination controls.
- **Acceptance:** Filtered and paginated search queries work accurately.

#### Commit 15 — Ticket Assignment and Routing
- **Backend:** Assignment and reassignment endpoints, eligibility checks, assignment history.
- **Frontend:** Assignee picker, assignment confirmation, assignment history display.
- **Acceptance:** Assignments persist and record audit history.

#### Commit 16 — Ticket Status Workflow
- **Backend:** State transition engine, permission verification, transition audit records.
- **Frontend:** Status flow actions (e.g., In Progress, Resolved, Closed), transition controls, confirmation modals.
- **Acceptance:** Invalid state transitions rejected by backend.

#### Commit 17 — Ticket Comments
- **Backend:** `Comment` entity, repository, DTO, mapper, service, controller, visibility checks.
- **Frontend:** Comment timeline, reply box, formatting, error states.
- **Acceptance:** Authorized users post and view ticket comments in real-time.

#### Commit 18 — Attachments and Audit History
- **Backend:** File metadata entity, storage service, size/MIME validation, protected download endpoint, audit history log.
- **Frontend:** Drag-and-drop file upload, file list, download buttons, audit event timeline.
- **Acceptance:** Secure file upload/download and immutable audit logs.

---

### PHASE 4 — SPECIALIZED REQUEST MODULES

#### Commit 19 — Workplace Issue Module
- **Backend:** Issue categories (Electrical, Plumbing, IT/Network, Furniture/Maintenance), routing rules.
- **Frontend:** Specialized issue reporting form, location field, severity selector.
- **Acceptance:** Workplace issues logged with domain-specific fields.

#### Commit 20 — Room Booking Module
- **Backend:** `Room` and `Booking` models, conflict prevention, atomic reservation locks, cancel/reschedule logic.
- **Frontend:** Room availability calendar/picker, timeslot selector, booking form, conflict alerts.
- **Acceptance:** Overlapping room reservations strictly prevented by database and service locks.

#### Commit 21 — Resource Request Module
- **Backend:** Resource catalog model, request workflow, quantity tracking, approval steps.
- **Frontend:** Resource catalog view, quantity selector, request modal, status tracker.
- **Acceptance:** Resource requests created and managed end-to-end.

#### Commit 22 — Inventory, Issuing, and Returns
- **Backend:** Stock balance tracking, issue/return transactions, actor logging, atomic quantity updates.
- **Frontend:** Inventory management view, quick issue/return actions, transaction history log.
- **Acceptance:** Accurate stock count maintained atomically under concurrent requests.

#### Commit 23 — Topic and Learning Request Module
- **Backend:** Topic request model, skill tags, "I Can Help" responder interest, session scheduling.
- **Frontend:** Learning request board, tag search, helper response button, collaboration notes.
- **Acceptance:** Requesters and helpers connect through working UI.

#### Commit 24 — Resolution Confirmation and Reopening
- **Backend:** Resolution verification flow, requester confirmation, reopen with mandatory reason, same ticket ID retention.
- **Frontend:** Resolution banner, confirm button, reopen modal with required reason textarea.
- **Acceptance:** Tickets reopened cleanly without duplicate ticket creation.

#### Commit 25 — Notifications and Dashboard APIs
- **Backend:** Persistent `Notification` entity, unread badge count, mark as read, role-based dashboard metrics.
- **Frontend:** Notification dropdown bell, mark-read interaction, interactive dashboard cards.
- **Acceptance:** Real-time persistence of notifications and real database metric widgets.

---

### PHASE 5 — UI COMPLETION AND CONSOLIDATION

#### Commit 26 — Shared UI System and Navigation
- Consolidate shared component library, responsive navigation drawer, keyboard accessibility, unified design system.
#### Commit 27 — Landing and Authentication Refinement
- Polish public landing page, hero section, feature showcases, auth forms styling and responsive design.
#### Commit 28 — Account Lifecycle UI Completion
- Refine approval queues, user status banners, and account state feedback screens.
#### Commit 29 — User Dashboard and Ticket Creation Experience
- Streamline personal dashboard, quick actions, recent tickets, and category shortcuts.
#### Commit 30 — Ticket Browsing and Details Refinement
- Refine ticket list views, detail page layout, activity tabs, and responsive tables.
#### Commit 31 — Collaboration UI Completion
- Polish comment threads, audit timeline, file attachments view, and activity history.
#### Commit 32 — Admin Dashboard and Management UI
- Complete admin control room, system analytics charts, bulk user actions, and queue overviews.
#### Commit 33 — Specialized Workflow UI Completion
- Polish room scheduler, resource checkout desk, and peer learning exchanges.

---

### PHASE 6 — QUALITY AND DELIVERY

#### Commit 34 — Full Regression, Integration, and Security Testing
- Complete automated end-to-end integration tests, security test suite, permission boundaries, frontend test suite, production build validation.
#### Commit 35 — Documentation, Windows Setup, Backup, and Optional Deployment
- Complete developer guide, production build instructions, PostgreSQL manual setup guide, backup/restore scripts, safe admin promotion procedure.

---

MANDATORY BACKEND ARCHITECTURE

Every relevant backend module must follow this layered architecture:

**Entity → Repository → DTO → Mapper → Service Interface → Service Implementation → Controller → Global Exception Handling**

### 1. Entity Layer
- JPA-mapped persistence model (`@Entity`, `@Table`, `@Id`, etc.).
- Fields, relationships, constraints, and persistence metadata.
- No controller or repository access.
- No direct exposure through REST responses.
- Model relationships deliberately; prevent circular JSON serialization and leaks.

### 2. Repository Layer
- Interfaces extending `JpaRepository<Entity, ID>`.
- Persistence queries only (derived methods, `@Query` when justified).
- No business workflows.
- Never accessed directly from controllers or mappers.

### 3. DTO Layer
- Separate request (`*RequestDto`) and response (`*ResponseDto`) objects.
- Appropriate Jakarta validation annotations (`@NotBlank`, `@NotNull`, `@Email`, `@Size`, etc.).
- Never expose password hashes, secrets, or protected server-controlled fields.
- Use focused DTOs for specialized operations (login, registration, status updates).

### 4. Mapper Layer
- Dedicated conversion between DTOs and entities (`UserMapper`, etc.).
- No database access or business logic.
- Do not blindly copy protected fields from client input.

### 5. Service Interface Layer
- Defines application-level contracts.
- Controllers depend on service abstractions.

### 6. Service Implementation Layer
- Applies business rules.
- Coordinates repositories and mappers.
- Uses constructor injection with final fields.
- Owns appropriate transaction boundaries.
- Ensures related database operations are atomic when required.
- Uses `@Transactional` for operations requiring atomic database changes.
- Uses `@Transactional(readOnly = true)` for suitable read-only operations.
- Unchecked exceptions trigger rollback; use `rollbackFor` for checked exceptions. Default propagation is `REQUIRED`.

### 7. Controller Layer
- Receives HTTP requests.
- Validates request DTOs using `@Valid`.
- Delegates to the service interface.
- Returns appropriate `ResponseEntity<ApiResponse<T>>`.
- Contains no business workflows or transaction boundaries.

### 8. Global Exception Handling
- Handled by `GlobalExceptionHandler` with `@RestControllerAdvice`.
- Consistent safe error responses for validation errors, custom exceptions, and unexpected failures.
- Never exposes internal stack traces or secrets.

### 9. Security Infrastructure
- Spring Security, JWT filters, authentication service, and `UserDetailsService`.
- Backend enforces authorization; never rely only on frontend route guards.

---
FRONTEND IMPLEMENTATION STANDARD

1. **Every page must be functional:**
   - Real form fields and event handlers.
   - Client-side validation and backend validation feedback.
   - Real API requests.
   - Proper loading and disabled states.
   - Success and failure messages.
   - Empty states and retry options where applicable.
   - Navigation to relevant screens.
   - Responsive behavior for desktop and smaller screens.
   - Keyboard-accessible controls and meaningful labels.
   - Appropriate confirmation dialogs for consequential operations.
   - Correct role-based presentation.
   - Safe handling of authentication expiration and unauthorized responses.
2. **Shared API integration:**
   - Consistent API client (`src/api/client.js`) handling base URL, headers, parsing, and errors.
   - Environment-based configuration via `VITE_API_BASE_URL`.
   - No scattered duplicate fetch logic.
3. **Authentication state:**
   - Secure token/session storage.
   - Restores authentication state safely on page reload.
   - Handles logout and expired credentials.
   - Prevents unauthorized access to protected routes.
4. **Forms and reusable components:**
   - Reusable inputs, buttons, tables, dialogs, badges, loaders, error alerts, and empty states.
5. **UI design:**
   - Professional office application: clean typography, coherent design system, practical layouts.
   - Usability and clear workflows over superficial gradients and decorative widgets.
6. **Frontend testing:**
   - Test validation, API behavior, routing, conditional rendering, and errors.
   - Verify production build passes cleanly (`npm run build`).

---

## PART 5 — PRODUCT RULES

- **Ticket Categories:** `ISSUE`, `ROOM_BOOKING`, `RESOURCE_REQUEST`, `TOPIC_REQUEST`.
- **Roles:** `ADMIN`, `USER`.
- **Account Statuses:** `PENDING` (default on registration), `ACTIVE`, `REJECTED`, `SUSPENDED`.
- **Visibility:** Public tickets visible to active users. Private tickets visible only to creator, assignees, and admins.
- **Audit Logging:** Actor, timestamp, action, and old/new values.
- **Authentication:**
  - Email/password with BCrypt hashing.
  - Email verification with expiring tokens.
  - Password recovery with expiring single-use tokens.
  - Google OAuth 2.0 **without OIDC** (verified identity via supported Google API).
  - No automatic admin promotion for first user; safe manual promotion procedure documented.
- **Database:** Local PostgreSQL (`fixhub`, role `gaurav`, password local).

---


