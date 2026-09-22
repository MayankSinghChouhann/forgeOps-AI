# ForgeOps AI

[![CI/CD](https://github.com/MayankSinghChouhann/forgeOps-AI/actions/workflows/ci.yml/badge.svg)](https://github.com/MayankSinghChouhann/forgeOps-AI/actions/workflows/ci.yml)
![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.1-green?logo=springboot)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Tests](https://img.shields.io/badge/backend-70_tests-brightgreen)

ForgeOps AI is a production-oriented DevOps assistant for incident diagnosis,
infrastructure generation, shell-command safety, and platform telemetry. It
combines a Spring Boot API, React SPA, PostgreSQL, Redis, Gemini, Prometheus,
Grafana, Docker Compose, Kubernetes, and enforced CI/CD quality gates.

> Repository implementation status: **36 of 40 audit tasks complete, 1 partial,
> 3 require owner/production access**. No live production deployment is claimed.
> See [Release status](#release-status) for the exact remaining work.

## Capabilities

- JWT registration/login with rotating, SHA-256-at-rest refresh tokens,
  server-side logout, USER/ADMIN roles, and environment-driven CORS.
- AI assistant with persisted sessions, complete conversation context, Gemini
  retry/backoff, structured response parsing, DevOps scope guardrails, local
  fallback knowledge, and SSE response delivery.
- Jenkins, Docker, and Kubernetes log analysis with stored RCA history.
- Terraform, Kubernetes, Helm, Dockerfile, GitHub Actions, and GitLab CI
  generation. Generation occurs only after an explicit user action.
- Shell command generation and explanation with mandatory safety classification.
- Live JVM, HikariCP, PostgreSQL, Redis, Gemini, activity, and platform metrics.
- Paginated history APIs, bounded dashboard queries, Redis dashboard caching,
  input-size limits, RFC 7807 errors, OpenAPI, and structured JSON logs.
- Prometheus scraping with dedicated credentials and an auto-provisioned
  eight-panel Grafana dashboard.
- GitHub and GitLab pipelines, Trivy, OWASP ZAP workflow, Playwright, Vitest,
  Testcontainers, and k6 thresholds for 500 virtual users.

## Architecture

```text
Browser / React 18 + Vite 8
            |
            | JWT + JSON / SSE
            v
Spring Boot 4.1 / Java 21
  |-- Auth and RBAC          |-- Log analyzer
  |-- AI assistant          |-- IaC generator
  |-- Shell safety          |-- Dashboard and Actuator
            |
            +---- PostgreSQL 16 (Flyway V1-V8)
            +---- Redis 7 (short-lived dashboard cache)
            +---- Gemini 3.8 Flash (optional; local fallback available)
            +---- Prometheus -> Grafana
```

The backend uses package-by-feature boundaries under `auth`, `assistant`,
`analyzer`, `generator`, `terminal`, and `dashboard`. Production schema changes
are Flyway-only; Hibernate runs with `ddl-auto=validate`.

## Technology

| Layer | Stack |
|---|---|
| Backend | Java 21, Spring Boot 4.1, Spring Security, JPA/Hibernate, Flyway |
| Data | PostgreSQL 16, Redis 7, HikariCP |
| AI | Gemini 3.8 Flash REST API with local fallback |
| Frontend | React 18, TypeScript, Vite 8, Tailwind CSS 4 |
| Testing | JUnit 5, Mockito, MockMvc, Testcontainers, Vitest, Playwright, k6 |
| Operations | Docker Compose, Kubernetes/Kustomize, Prometheus, Grafana |
| Delivery | GitHub Actions, GitLab CI, Trivy, OWASP ZAP |

## Quick start with Docker

Requirements: Docker Desktop with Compose v2 and at least 4 GB of available
memory.

From the repository root:

```powershell
Copy-Item infra/docker/.env.example infra/docker/.env
```

Replace every placeholder in `infra/docker/.env`. Generate fresh secrets rather
than copying sample or historical values:

```bash
openssl rand -base64 48  # FORGEOPS_JWT_SECRET
openssl rand -base64 32  # POSTGRES_PASSWORD
openssl rand -base64 32  # REDIS_PASSWORD
openssl rand -base64 32  # FORGEOPS_METRICS_PASSWORD
openssl rand -base64 32  # GRAFANA_ADMIN_PASSWORD
```

`GEMINI_API_KEY` is optional. Without it, the local expert engine handles
supported DevOps scenarios.

Start the application:

```bash
docker compose --env-file infra/docker/.env \
  -f infra/docker/docker-compose.yml up --build -d
```

Open:

- Frontend: <http://localhost:3000>
- API health: <http://localhost:8080/actuator/health>
- Swagger UI: <http://localhost:8080/swagger-ui.html>

No default application account is created unless bootstrap is explicitly
enabled. Normally, register through the UI. For a one-time admin bootstrap, set
all three values, start once, then disable bootstrap:

```dotenv
FORGEOPS_BOOTSTRAP_ENABLED=true
FORGEOPS_BOOTSTRAP_ADMIN_EMAIL=admin@example.com
FORGEOPS_BOOTSTRAP_ADMIN_PASSWORD=<unique-strong-password>
```

## Local development

Requirements: Java 21, Maven 3.9+, Node.js 20+, npm, and PostgreSQL 16.

Backend:

```bash
export SPRING_PROFILES_ACTIVE=dev
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/forgeops_db
export SPRING_DATASOURCE_USERNAME=forgeops_user
export SPRING_DATASOURCE_PASSWORD='<local-password>'
export FORGEOPS_JWT_SECRET="$(openssl rand -base64 48)"
mvn -f backend/pom.xml spring-boot:run
```

On PowerShell, assign the same values through `$env:NAME='value'` before running
Maven.

Frontend:

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

`VITE_API_URL=/api` uses the Vite/Nginx same-origin proxy. Set an absolute API
URL only when the frontend and backend are hosted separately, and add that
frontend origin to `FORGEOPS_ALLOWED_ORIGINS`.

## Configuration

| Variable | Required | Purpose |
|---|---:|---|
| `SPRING_DATASOURCE_URL` | yes | PostgreSQL JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | yes | Database user |
| `SPRING_DATASOURCE_PASSWORD` | yes | Database password |
| `FORGEOPS_JWT_SECRET` | yes | Base64-encoded signing secret, 256 bits or stronger |
| `FORGEOPS_ALLOWED_ORIGINS` | yes in prod | Comma-separated trusted browser origins |
| `REDIS_PASSWORD` | when Redis enabled | Redis authentication password |
| `FORGEOPS_REDIS_CACHE_ENABLED` | no | Enables Redis dashboard cache |
| `FORGEOPS_METRICS_PASSWORD` | for Prometheus | Dedicated `/actuator/prometheus` password |
| `GRAFANA_ADMIN_PASSWORD` | with Grafana | Grafana administrator password |
| `GEMINI_API_KEY` | no | Enables remote Gemini responses |
| `GEMINI_MODEL` | no | Defaults to `gemini-3.8-flash` |
| `DB_POOL_MAX_SIZE` / `DB_POOL_MIN_IDLE` | no | Production HikariCP tuning |

The complete Docker-oriented template is `infra/docker/.env.example`. Never
commit a populated `.env` file.

## API and security

| Area | Endpoint |
|---|---|
| Auth | `POST /api/auth/register`, `/login`, `/refresh`, `/logout` |
| Assistant | session CRUD, `POST /api/assistant/chat`, `/chat/stream` |
| Analyzer | `POST /api/analyzer/analyze`, paginated `/history` |
| Generator | `POST /api/generator/generate`, paginated `/history` |
| Terminal | `POST /api/terminal/explain`, `/generate` |
| Dashboard | `GET /api/dashboard/metrics` |
| Docs | `GET /swagger-ui.html`, `/v3/api-docs` |
| Probes | `/actuator/health/liveness`, `/actuator/health/readiness` |
| Metrics | `/actuator/prometheus` with monitoring Basic credentials |

Access and refresh tokens are currently stored in browser `localStorage`.
Refresh tokens are rotated and stored only as SHA-256 hashes in PostgreSQL. The
frontend refreshes proactively before access-token expiry and falls back to one
coordinated refresh after a 401. For a public internet deployment, migrating the
refresh token to a Secure, HttpOnly, SameSite cookie is recommended defense in
depth against token theft through an XSS defect.

Auth and AI mutation routes have per-IP rate limits. This implementation is
in-process, so a multi-replica production deployment should enforce an
additional distributed limit at the ingress/API gateway.

## Observability

Start the optional observability profile:

```bash
docker compose --env-file infra/docker/.env \
  -f infra/docker/docker-compose.yml --profile observability up --build -d
```

- Grafana: <http://localhost:3001> (`admin` plus the configured password)
- Prometheus: <http://localhost:9090>
- Dashboard: **ForgeOps / ForgeOps AI Overview**

The dashboard covers HTTP rate and p95 latency, JVM heap, system/process CPU,
HikariCP activity, uptime, and live threads. Prometheus reads its monitoring
password from a Compose secret; application JWT credentials are not reused.

## Tests and quality gates

Backend:

```bash
mvn -f backend/pom.xml clean verify
```

The suite currently contains 70 tests across services, authentication,
controller contracts, OpenAPI, secured metrics, and PostgreSQL/Flyway. The
Testcontainers test skips only when Docker is unavailable; GitHub CI runs it
against a real PostgreSQL container.

Frontend:

```bash
cd frontend
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm audit
```

Playwright covers four core journeys: authentication/dashboard, log analysis,
explicit infrastructure generation, and shell safety.

Load test:

```bash
k6 run -e BASE_URL=http://localhost:8080 \
  -e ACCESS_TOKEN='<jwt>' tests/load/forgeops.js
```

The script targets 500 virtual users and fails when configured p95 latency or
error-rate thresholds are exceeded. Run it against an isolated staging system,
not a developer laptop or production without an approved test window.

CI blocks merges on backend verification, frontend lint/typecheck/unit/build/E2E,
and Trivy HIGH/CRITICAL vulnerability, secret, and misconfiguration findings.
OWASP ZAP is available as a manually triggered isolated API scan.

## Kubernetes deployment

The Kustomize base in `infra/k8s` includes namespace, ConfigMap, PostgreSQL,
Redis, backend, frontend, HPA, Services, and TLS ingress resources. Images run
as non-root with dropped capabilities, resource requests/limits, probes, and
rolling updates.

Before deployment:

1. Replace `forgeops.example.com` in the ConfigMap and ingress.
2. Configure the `forgeops-tls` secret and an ingress controller.
3. Create `forgeops-secrets` as documented in `infra/k8s/README.md`.
4. Prefer managed PostgreSQL/Redis and a cloud secret manager in production.

Validate and apply:

```bash
kubectl kustomize infra/k8s > /dev/null
kubectl apply -k infra/k8s
kubectl -n forgeops rollout status deployment/backend
kubectl -n forgeops rollout status deployment/frontend
```

GitHub deployment is deliberately gated by the `ENABLE_K8S_DEPLOY` repository
variable and `KUBE_CONFIG_B64` environment secret. GitLab uses the equivalent
variables. CI publishes immutable commit-SHA image tags before rollout.

## Rollback

Application rollback:

```bash
kubectl -n forgeops rollout history deployment/backend
kubectl -n forgeops rollout undo deployment/backend
kubectl -n forgeops rollout undo deployment/frontend
```

For an exact version, set both deployments to a previously verified commit-SHA
image tag. Every implementation unit was merged through a dedicated feature PR,
so a Git rollback can also revert one merge commit without mixing unrelated
changes.

Database migrations are forward-only. Take a verified PostgreSQL backup before
release; restore that backup or apply a reviewed compensating migration if a
schema rollback is required. Never delete an applied Flyway migration.

## Secret rotation and history cleanup

Runtime secrets are no longer stored in tracked files, but the original audit
found credentials in older Git history. Treat every historical value as
compromised.

1. Rotate the Gemini key in Google AI Studio and rotate JWT/database/Redis
   credentials in the target secret manager.
2. Confirm applications use only the new values.
3. Schedule a repository maintenance window and freeze pushes.
4. Use `git filter-repo` on a fresh mirror to remove the historical `.env` and
   replace any old inline values, review the rewritten object database, then
   force-push all affected refs.
5. Revoke old credentials again if they were ever used after the rewrite began,
   invalidate open PR branches, and require every contributor to re-clone.

History was intentionally not rewritten automatically during this work because
the operation is destructive, invalidates existing clones/PR SHAs, and conflicts
with the requirement to preserve easy backtracking. Rotation must happen before
history cleanup; rewriting history alone does not revoke a leaked credential.

## Release status

Repository-scoped engineering is complete and all merged feature PRs passed CI.
The audit's 40-task roadmap currently stands at:

| State | Count | Details |
|---|---:|---|
| Complete | 36 | Application, migrations, security, AI, frontend, tests, CI/CD, K8s, observability |
| Partial | 1 | Task 40: OpenAPI and ZAP workflow complete; staging/production execution pending |
| External | 3 | Gemini rotation, production JWT rotation/secret-manager entry, coordinated Git history purge |

Operational actions still requiring repository-owner or environment access:

- Rotate all credentials that existed before the audit.
- Run the coordinated history rewrite after rotation.
- Configure staging secrets/DNS/TLS/cluster credentials and execute ZAP + k6.
- Promote the verified SHA to production, validate probes/dashboards, and perform
  a rollback drill.

Accordingly, the repository implementation is approximately **95% complete**;
end-to-end production release readiness is approximately **85%** until those
external operations are performed and evidenced.

## Implementation PR ledger

The project was deliberately split into reviewable, reversible feature branches:

- [#5 — security and schema foundation](https://github.com/MayankSinghChouhann/forgeOps-AI/pull/5)
- [#6 — authentication hardening](https://github.com/MayankSinghChouhann/forgeOps-AI/pull/6)
- [#7 — pagination and dashboard performance](https://github.com/MayankSinghChouhann/forgeOps-AI/pull/7)
- [#8 — AI context, SSE, retry, and safety](https://github.com/MayankSinghChouhann/forgeOps-AI/pull/8)
- [#9 — frontend session and health integration](https://github.com/MayankSinghChouhann/forgeOps-AI/pull/9)
- [#10 — Redis caching and structured observability](https://github.com/MayankSinghChouhann/forgeOps-AI/pull/10)
- [#11 — Kubernetes and CI/CD](https://github.com/MayankSinghChouhann/forgeOps-AI/pull/11)
- [#12 — API documentation and quality gates](https://github.com/MayankSinghChouhann/forgeOps-AI/pull/12)
- [#13 — Gemini 3.8 Flash upgrade](https://github.com/MayankSinghChouhann/forgeOps-AI/pull/13)
- [#14 — secure Prometheus and Grafana dashboard](https://github.com/MayankSinghChouhann/forgeOps-AI/pull/14)
- [#15 — final generator and logging cleanup](https://github.com/MayankSinghChouhann/forgeOps-AI/pull/15)

## Repository layout

```text
backend/                 Spring Boot API, migrations, and backend tests
frontend/                React SPA, Vitest, and Playwright journeys
infra/docker/            Docker Compose and environment template
infra/k8s/               Kustomize production base
infra/observability/     Prometheus and Grafana provisioning
tests/load/              k6 load scenario and thresholds
.github/workflows/       CI/CD and manually triggered OWASP ZAP scan
.gitlab-ci.yml            GitLab build, test, scan, package, and deploy pipeline
```

## License

No license file is currently included. Add an explicit license before public
distribution or third-party reuse.
