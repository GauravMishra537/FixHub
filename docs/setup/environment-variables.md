# Environment variables

The backend reads its settings from `application.yml`. Secrets and local values do not go in that file. They come from one of two places:

1. **`backend/src/main/resources/application-local.yml`** (listed in `.gitignore`, never committed). Good for a machine you use every day.
2. **Environment variables** exported in the terminal that starts the backend.

An environment variable beats the same setting in a file. A variable lives only in the terminal window where you set it. In a new terminal, set it again.

Spring does **not** read a `.env` file by itself. If you keep one, load it before you start the backend:
```bash
set -a; source .env; set +a
```

## Required

| Name | What it is |
|---|---|
| `JWT_SECRET` | Key that signs login tokens. No default, the backend will not start without it. Make one with `openssl rand -base64 32`. |
| `SPRING_DATASOURCE_URL` | Database address, for example `jdbc:postgresql://localhost:5432/fixhub` |
| `SPRING_DATASOURCE_USERNAME` | Database login, for example `gaurav` |
| `SPRING_DATASOURCE_PASSWORD` | Its password |

## Sign-in and email

| Name | Default | What it is |
|---|---|---|
| `GOOGLE_CLIENT_ID` | none | Client ID from Google Cloud, for Google sign-in |
| `SPRING_MAIL_USERNAME` | none | Gmail address that sends the verification email |
| `SPRING_MAIL_PASSWORD` | none | A Gmail **app password** (not your normal password) |

Mail goes through `smtp.gmail.com` on port 587 with STARTTLS. If sending fails, the backend log prints a line starting `Fallback verification URL`. Open that link to verify the account while developing.

## Optional

| Name | Default | What it is |
|---|---|---|
| `SERVER_PORT` | `8080` | Backend port |
| `app.frontend.url` | `http://localhost:5173` | Address used in links inside emails |
| `app.jwt.expiration-ms` | `86400000` (24 hours) | How long a login lasts |
| `app.auth.verification-token-expiry-hours` | `24` | How long the email link works |

## First administrator

Used once, with the bootstrap command. See [admin bootstrap](admin-bootstrap.md).

| Name | What it is |
|---|---|
| `ADMIN_EMAIL` | Email of the first admin |
| `ADMIN_PASSWORD` | At least 8 characters |
| `ADMIN_NAME` | Display name. Default `FixHub Administrator` |
| `APP_BOOTSTRAP_ADMIN` | `true` turns the bootstrap on (the command-line flag does the same) |

## File storage

Attachments are sent in parts from the browser straight to object storage with signed links. The storage section of `application.yml` has the address and keys of your storage, plus these limits:

- largest file size
- files per ticket
- upload part size (the page sends 5 MiB parts)
- unfinished uploads per user
- how long a download link lives
- how many hours before an unfinished upload is cleaned up

The page checks the same limits in the browser (25 MB per file, 10 files per ticket, types png, jpg, pdf, txt, docx, xlsx) for a quick answer, and the backend checks them again.

## Keep secrets out of git

- Never commit `application-local.yml` or a `.env` with real values.
- Commit `.env.example` with empty values only.
- If a secret was ever pushed to GitHub, treat it as public and replace it.