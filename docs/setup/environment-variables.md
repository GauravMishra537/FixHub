# Environment Variables Reference

All configuration is managed through environment variables.

> **Never commit `.env` files to Git.** The `.gitignore` is configured to exclude them.

---

## Database Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `fixhub` |
| `DB_USERNAME` | Database username | `gaurav` |
| `DB_PASSWORD` | Database password | *(your local password)* |
| `SPRING_DATASOURCE_URL` | Full JDBC URL | `jdbc:postgresql://localhost:5432/fixhub` |
| `SPRING_DATASOURCE_USERNAME` | Spring datasource username | `gaurav` |
| `SPRING_DATASOURCE_PASSWORD` | Spring datasource password | *(your local password)* |

---

## Flyway Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `FLYWAY_URL` | Migration target JDBC URL | `jdbc:postgresql://localhost:5432/fixhub` |
| `FLYWAY_USER` | Migration username | `gaurav` |
| `FLYWAY_PASSWORD` | Migration password | *(your local password)* |

---

## Authentication and Security

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) | *(random secure string)* |
| `JWT_EXPIRATION_MS` | JWT token expiration in milliseconds | `86400000` (24 hours) |

---

## Google OAuth 2.0

> Configure these when implementing Commit 8 (Google OAuth).

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google Cloud OAuth client ID | *(from Google Cloud Console)* |
| `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth client secret | *(from Google Cloud Console)* |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | `http://localhost:8080/api/auth/google/callback` |

---

## Email / SMTP

> Configure these when implementing Commit 6 (Registration and email verification).

| Variable | Description | Example |
|----------|-------------|---------|
| `MAIL_HOST` | SMTP server host | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP server port | `587` |
| `MAIL_USERNAME` | SMTP login username | *(your email)* |
| `MAIL_PASSWORD` | SMTP login password / app password | *(your email app password)* |
| `MAIL_FROM` | Sender address for outgoing emails | `noreply@fixhub.local` |

---

## File Storage

| Variable | Description | Example |
|----------|-------------|---------|
| `UPLOAD_DIR` | Directory for uploaded files | `./uploads` |
| `MAX_FILE_SIZE_MB` | Maximum upload file size in MB | `10` |

---

## Server Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `SERVER_PORT` | Backend server port | `8080` |

---

## Frontend Configuration

> Frontend variables must be prefixed with `VITE_` to be accessible in the browser.

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8080/api` |

> **Security:** Never expose backend secrets (database passwords, JWT secrets, OAuth secrets) through `VITE_` variables. Vite embeds these into the client-side JavaScript bundle.

---

## Configuration by Phase

| Phase | Variables Required |
|-------|-------------------|
| Commit 2–4 (Foundation) | Database, Server, Frontend |
| Commit 5–7 (Auth basics) | + JWT |
| Commit 6 (Email verification) | + Email/SMTP |
| Commit 8 (Google OAuth) | + Google OAuth |
| Commit 18 (Attachments) | + File storage |
