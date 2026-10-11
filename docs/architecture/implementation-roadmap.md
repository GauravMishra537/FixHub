# Implementation Roadmap

FixHub is developed across 35 planned commits, each independently reviewed, tested, and documented.

---

## Phase 1 — Foundation (Commits 1–4)

### Commit 1: Repository Inspection and Project Foundation
- **Status:** 🔄 In Progress
- **Scope:** Inspect the existing repository. Establish folder structure. Add README, `.gitignore`, environment templates, and documentation.
- **Acceptance:** Structure created, docs complete, no code dependencies.

### Commit 2: Backend and Frontend Build Setup
- **Status:** ⬜ Planned
- **Scope:** Configure Spring Boot + Maven backend. Configure React + TypeScript + Vite frontend. Add compatible dependencies. Verify both applications build and start. Add basic health checks.
- **Acceptance:** Both apps build, start, and serve responses.

### Commit 3: PostgreSQL and Flyway Foundation
- **Status:** ⬜ Planned
- **Scope:** Configure database connectivity with environment variables. Add initial Flyway migration. Verify clean database initialization. Document setup for two-computer workflow.
- **Acceptance:** Backend connects to PostgreSQL, Flyway runs, schema is created.

### Commit 4: Common API and Test Infrastructure
- **Status:** ⬜ Planned
- **Scope:** Add global exception handling and API response conventions. Configure backend and frontend test frameworks. Verify frontend-to-backend connectivity.
- **Acceptance:** Standard error responses, test suites run, CORS works.

---

## Phase 2 — Authentication Vertical Slice (Commits 5–10)

### Commit 5: User and Authentication Data Model
- **Status:** ⬜ Planned
- **Scope:** Create user entity, roles, account status, and authentication identity tables. Write Flyway migrations. Test entity relationships.
- **Acceptance:** Schema created, entities mapped, repository tests pass.

### Commit 6: Registration and Email Verification
- **Status:** ⬜ Planned
- **Scope:** Registration API + UI. Email verification. Create PENDING accounts. Validate duplicates and invalid tokens.
- **Prerequisites:** Email/SMTP provider configuration.
- **Acceptance:** User can register, receives verification email, account is PENDING.

### Commit 7: Email/Password Login and Logout
- **Status:** ⬜ Planned
- **Scope:** Login API + UI. BCrypt hashing. JWT/session handling. Protected routes. Logout.
- **Acceptance:** User can log in through UI, access protected pages, and log out.

### Commit 8: Google OAuth 2.0
- **Status:** ⬜ Planned
- **Scope:** OAuth 2.0 flow (NOT OIDC). Google login button + backend callback. State validation. Identity verification via Google API. Account linking safety.
- **Prerequisites:** Google Cloud OAuth credentials.
- **Acceptance:** User can sign in with Google, account is created/linked correctly.

### Commit 9: Password Recovery and Account Linking
- **Status:** ⬜ Planned
- **Scope:** Forgot password, reset password, password setup for Google-only users. Secure token handling. Account linking rules.
- **Acceptance:** Password reset works end-to-end, expired tokens rejected.

### Commit 10: Admin Approval Workflow
- **Status:** ⬜ Planned
- **Scope:** Admin registration queue. Approve/reject accounts. Pending/rejected account screens. Role and organizational detail assignment. Backend access restrictions.
- **Acceptance:** Admin can review, approve, and reject registrations. PENDING users see waiting screen.

---

## Phase 3 — User Administration and Ticket Engine (Commits 11–18)

### Commit 11: User Management and Authorization
- **Scope:** User management APIs + UI. ADMIN/USER role changes. Account status management. Document SQL for admin promotion.

### Commit 12: Ticket Model and Relationships
- **Scope:** Ticket entities, DTOs, repositories, migrations. Define types (ISSUE, ROOM_BOOKING, RESOURCE_REQUEST, TOPIC_REQUEST), statuses, priorities, visibility.

### Commit 13: Create and View Tickets
- **Scope:** Ticket creation API + form. Basic ticket list. Connect frontend to PostgreSQL-backed APIs.

### Commit 14: Search, Filtering, and Pagination
- **Scope:** Server-side search, filtering, sorting, pagination. All Tickets, My Tickets, Assigned to Me views.

### Commit 15: Assignment and Routing
- **Scope:** Assignment APIs. Configurable routing rules. Assignment controls. Authorization tests.

### Commit 16: Ticket Status Workflow
- **Scope:** Valid state transitions. Resolve, close, reopen logic. Authorized action display. Invalid transition tests.

### Commit 17: Comments and Discussion
- **Scope:** Comments API + UI. Internal notes (for authorized users). History recording. Visibility enforcement.

### Commit 18: Attachments and Ticket History
- **Scope:** Secure upload/download. File storage. Attachment uploader + ticket timeline. Audit history. File validation and access control.

---

## Phase 4 — Specialized Workflows (Commits 19–25)

### Commit 19: Issue Categories and Handling
- **Scope:** Electrical, plumbing, maintenance, network, IT categories. Routing configuration. Category-aware forms. Complete issue lifecycle.

### Commit 20: Room Booking
- **Scope:** Room data model. Booking forms. Approval/rejection. Availability checks. Conflict prevention.

### Commit 21: Resource Requests
- **Scope:** Resource catalog. Request workflows. Request forms and management screens. Stock availability.

### Commit 22: Resource Issuing and Returns
- **Scope:** Issue/return operations. Transaction integrity. Insufficient stock and concurrency tests.

### Commit 23: Topic and Learning Requests
- **Scope:** Request discovery by tags/skills. "I Can Help" voluntary acceptance. Links, notes, PDFs. Prevent conflicting handler acceptance.

### Commit 24: Resolution Confirmation and Reopening
- **Scope:** Requester confirmation. Reopen with reason (same ticket ID). Handler notification. History preservation.

### Commit 25: Notifications and Dashboard APIs
- **Scope:** Persistent notifications. Unread counts. Notification UI. User/admin dashboard statistics. Recipient and read-state verification.

---

## Phase 5 — Main Frontend Completion (Commits 26–32)

### Commit 26: Shared UI and Navigation
- **Scope:** Reusable design components. Responsive layouts, navigation, forms, tables, badges, dialogs.

### Commit 27: Public and Authentication Screens
- **Scope:** Landing, registration, login, password pages. Validation polish. Real API integration.

### Commit 28: Account Lifecycle Screens
- **Scope:** Pending/rejected screens. Approval feedback. Status restrictions and redirects.

### Commit 29: User Dashboard and Ticket Creation
- **Scope:** Dashboard metrics, recent activity, quick actions. Ticket creation forms. Real backend data.

### Commit 30: Ticket Browsing and Details
- **Scope:** Ticket lists, filters, search, pagination, details. UI updates after mutations. Visibility and permission tests.

### Commit 31: Ticket Collaboration Interface
- **Scope:** Comments, attachments, timeline, resolution, closure, reopening. Notifications integration.

### Commit 32: Admin Dashboard and Management
- **Scope:** Approvals, user management, categories, routing, rooms, resources, audit interfaces. Real backend operations.

---

## Phase 6 — Final Workflows and Release Readiness (Commits 33–35)

### Commit 33: Specialized Workflow UI
- **Scope:** Room, resource, and learning-request interfaces. Validation and error states. End-to-end verification per ticket type.

### Commit 34: Regression, Integration, and Security Hardening
- **Scope:** Complete test suite. Missing integration and regression tests. Role/status enforcement. Migration safety. Critical defect fixes.

### Commit 35: Documentation and Deployment
- **Scope:** Finalize README, Swagger/OpenAPI, environment examples, two-computer setup docs. Assess Docker (NOT installed — ask before implementing). Final project handover report.

---

## Development Rules

1. One commit at a time — no skipping ahead
2. Each commit is reviewed, tested, and documented with a PDF report
3. Manual Git commits only — never auto-committed
4. Full-stack vertical slices — backend + frontend together
5. No destructive database operations
6. Environment variables for all credentials
7. Tests must actually run before reporting results
