# FixHub Backend

Spring Boot 3.x application with Java 17.

## Setup

See [../docs/setup/startup-guide.md](../docs/setup/startup-guide.md) for complete instructions.

## Build and Run

```bash
# Build
mvnw.cmd clean package

# Run
mvnw.cmd spring-boot:run

# Test
mvnw.cmd test
```

## Configuration

Backend configuration uses environment variables. See [../docs/setup/environment-variables.md](../docs/setup/environment-variables.md).

## Structure

The backend uses a feature-based package structure under `com.fixhub`. See [../docs/architecture/project-structure.md](../docs/architecture/project-structure.md) for details.
