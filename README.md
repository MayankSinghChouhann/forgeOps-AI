# ForgeOps-AI

ForgeOps-AI is a full-stack DevOps intelligence platform designed to provide automated infrastructure-as-code generation, log analysis, and shell command safety verification. It unifies operations, security scanning, and platform observability into a self-hostable ecosystem.

## Overview

ForgeOps-AI serves as an operational hub for DevOps and Platform Engineering teams. The system provides a centralized interface for infrastructure provisioning workflows, incident diagnosis, and real-time environment monitoring. The core functionality integrates a Spring Boot backend, a React frontend, and language models to analyze telemetry, generate secure deployment pipelines, and validate administrative shell commands prior to execution.

Intended users include DevOps engineers, system administrators, and site reliability engineers (SREs).

> Screenshot provenance: every image in `docs/images/` is an original, manually captured project or deployment artifact. No image in this README was AI-generated or synthetically recreated.

## Contents

- [Capabilities](#capabilities)
- [Architecture](#system-architecture)
- [Product tour](#product-tour)
- [Local setup](#local-setup)
- [Validation](#validation)
- [Delivery and deployment](#delivery-and-deployment)
- [Security](#security)

## Capabilities

| Area | What it provides |
| --- | --- |
| Infrastructure generation | Reviewable Terraform, Kubernetes, Helm, Dockerfile, GitHub Actions, and GitLab CI templates. |
| Incident diagnostics | Analysis workflows for Jenkins, Docker, and Kubernetes logs with retained RCA history. |
| Command safety | Shell-command risk assessment before an operator runs a change. |
| Observability | JVM, HikariCP, Redis, PostgreSQL, and AI-integration metrics through Prometheus and Grafana. |
| Identity and access | JWT access tokens, rotating refresh tokens, server-side logout, and role-based access control. |
| Operator experience | Responsive dark-mode workspace with shared design-system components and environment status. |

## System Architecture

The system follows a standard three-tier architecture augmented with an external language model integration. The frontend communicates with the backend via REST over HTTPS, utilizing Server-Sent Events (SSE) for streaming operations. The backend handles business logic, security validation, and orchestrates downstream calls to PostgreSQL (relational data), Redis (caching), and the Gemini API (inference).

```mermaid
flowchart TD
    Client[Browser / React SPA] -->|HTTPS / REST / SSE| API[Spring Boot API]
    API -->|JDBC| DB[(PostgreSQL 16)]
    API -->|TCP| Cache[(Redis 7)]
    API -->|HTTPS| LLM[Gemini REST API]
    API -->|Metrics| Prom[Prometheus]
    Prom -->|Data Source| Grafana[Grafana Dashboard]
```

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite 8
- Tailwind CSS 4

### Backend
- Java 21
- Spring Boot 4.1
- Spring Security
- JPA / Hibernate
- Flyway

### Database & Caching
- PostgreSQL 16
- Redis 7
- HikariCP

### AI/ML
- Gemini 3.8 Flash (REST API integration)

### DevOps & Infrastructure
- Docker & Docker Compose
- Kubernetes & Kustomize

### Testing
- JUnit 5 & Mockito
- Testcontainers
- Vitest
- Playwright
- k6

### Monitoring
- Prometheus
- Grafana

## Project Structure

```text
forgeOps-AI/
├── backend/                 # Spring Boot application, flyway migrations, and backend tests
├── frontend/                # React SPA, UI components, and E2E tests
├── infra/
│   ├── docker/              # Docker Compose configuration and environment templates
│   ├── k8s/                 # Kustomize base for Kubernetes deployment
│   └── observability/       # Prometheus and Grafana provisioning definitions
├── tests/
│   └── load/                # k6 load testing scripts and scenarios
├── .github/workflows/       # GitHub Actions CI/CD pipelines
└── .gitlab-ci.yml           # GitLab CI/CD pipeline definition
```

## How It Works

1. **User Authentication**: The client authenticates via the `/api/auth/login` endpoint. A short-lived JWT is issued in memory, while a secure, HttpOnly refresh token is stored in the browser and hashed in PostgreSQL.
2. **Request Processing**: User requests (e.g., log analysis or IaC generation) are sent to the Spring Boot backend. Rate limits and RBAC are enforced at the controller level.
3. **Execution**: The backend constructs an isolated context and queries the Gemini API. If the API is unavailable or unconfigured, the system falls back to a local rules engine.
4. **Delivery**: Results are returned to the client. Long-running operations utilize Server-Sent Events (SSE) to stream chunks to the React frontend, updating the UI dynamically.
5. **Observability**: Metrics from the request cycle are scraped by Prometheus and visualized in Grafana.

## Product Tour

### Authentication and Operations

| Sign-in | Operations dashboard |
| --- | --- |
| ![Live ForgeOps sign-in page](docs/images/release-2026-09-25-login.png) | ![Authenticated live operations dashboard](docs/images/release-2026-09-25-dashboard.png) |

### Investigation and Automation

| Log analysis | CI/CD generator | Infrastructure generator |
| --- | --- | --- |
| ![Live log analysis result](docs/images/release-2026-09-25-log-analysis.png) | ![ForgeOps CI/CD workflow generator](docs/images/cicd-generator.png) | ![ForgeOps infrastructure generator](docs/images/infrastructure-generator.png) |

### Additional Interfaces

| API playground | Responsive navigation |
| --- | --- |
| ![ForgeOps API playground](docs/images/api-playground.png) | ![ForgeOps mobile navigation drawer](docs/images/mobile-navigation.png) |

## Local Setup

### Prerequisites

- Java 21
- Maven 3.9+
- Node.js 20+
- npm
- Docker Engine & Docker Compose (for local deployment)
- PostgreSQL 16 (for bare-metal execution)

### Installation

```bash
git clone https://github.com/MayankSinghChouhann/forgeOps-AI.git
cd forgeOps-AI

# Install frontend dependencies
cd frontend
npm ci
cd ..
```

### Environment Configuration

Configuration is managed via environment variables. Create `.env` files based on the provided templates. Never commit populated `.env` files containing actual secrets.

Example configuration keys:

```env
SPRING_DATASOURCE_URL=
SPRING_DATASOURCE_USERNAME=
SPRING_DATASOURCE_PASSWORD=
FORGEOPS_JWT_SECRET=
FORGEOPS_ALLOWED_ORIGINS=
REDIS_PASSWORD=
FORGEOPS_METRICS_PASSWORD=
GRAFANA_ADMIN_PASSWORD=
GEMINI_API_KEY=
```

### Run Locally

### Using Docker Compose

```bash
cp infra/docker/.env.example infra/docker/.env
# Populate infra/docker/.env with secure values
docker compose --env-file infra/docker/.env -f infra/docker/docker-compose.yml up --build -d
```

### Bare-Metal Execution

Backend:
```bash
export SPRING_PROFILES_ACTIVE=dev
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/forgeops_db
export SPRING_DATASOURCE_USERNAME=forgeops_user
export SPRING_DATASOURCE_PASSWORD=your_password
export FORGEOPS_JWT_SECRET=your_jwt_secret
mvn -f backend/pom.xml spring-boot:run
```

Frontend:
```bash
cd frontend
cp .env.example .env.local
npm run dev
```

## Validation

### Backend Unit and Integration Tests

The backend utilizes JUnit 5 and Testcontainers for PostgreSQL integration.

```bash
mvn -f backend/pom.xml clean verify
```

### Frontend Tests

The frontend includes unit testing with Vitest and end-to-end testing with Playwright.

```bash
cd frontend
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
```

### Load Testing

Load testing is performed via k6 targeting 500 virtual users.

```bash
k6 run -e BASE_URL=http://localhost:8080 -e ACCESS_TOKEN='<jwt>' tests/load/forgeops.js
```

### Build

To compile the production artifacts:

Backend:
```bash
mvn -f backend/pom.xml clean package -DskipTests
```

Frontend:
```bash
cd frontend
npm run build
```

## Delivery and Deployment

### CI/CD Pipelines

The repository includes GitHub Actions (`.github/workflows/ci.yml`) and GitLab CI (`.gitlab-ci.yml`) definitions. Pipelines enforce Trivy vulnerability scanning, ESLint validation, Playwright E2E tests, and Java unit testing prior to container publishing.

The captured GitHub Actions run below completed backend tests, frontend checks, repository scanning, container publishing, image scanning, and Kubernetes deployment successfully. It is included as deployment evidence, not as a claim that an always-on public environment is currently exposed.

![GitHub Actions CI/CD pipeline completed successfully](docs/images/github-actions-pipeline-success-manual.png)

The generator’s pipeline-security gates are also visible in the product capture below.

![Generated CI pipeline with blocking security scan](docs/images/release-2026-09-25-pipeline-gates.png)

### Kubernetes

A Kustomize base is provided for Kubernetes deployment. This includes manifests for namespaces, ConfigMaps, Deployments, HorizontalPodAutoscalers (HPA), Services, PodDisruptionBudgets (PDB), NetworkPolicies, and Ingress.

```bash
kubectl apply -k infra/k8s
kubectl -n forgeops rollout status deployment/backend
kubectl -n forgeops rollout status deployment/frontend
```

*Note: For production, externalize the PostgreSQL and Redis instances to managed services and supply credentials via a Kubernetes Secret or native cloud secret manager.*

### One-Time AWS Demo Evidence

The EC2 material below records a one-time, operator-led demo deployment. It should not be interpreted as a permanent public production endpoint; stop the instance after the demonstration to avoid unnecessary AWS charges.

![AWS EC2 instance launch completed successfully](docs/images/aws-ec2-launch-success-manual.png)
![Successful SSH session to the Ubuntu EC2 host](docs/images/aws-ssh-session-manual.png)
![Initial Docker Compose services running on EC2](docs/images/aws-compose-services-manual.png)

## API Documentation

The REST API documentation is generated automatically via OpenAPI. When the backend is running locally, it can be accessed at:

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Security

- **Authentication**: JWTs are stored in memory. Refresh tokens are persisted as SHA-256 hashes and transmitted via `HttpOnly`, `Secure`, and `SameSite=Strict` cookies.
- **Authorization**: Role-Based Access Control (RBAC) enforces `USER` and `ADMIN` boundaries at the controller and method levels.
- **Rate Limiting**: Per-IP rate limiting is applied to authentication and LLM invocation endpoints.
- **Dependency Scanning**: Trivy is integrated into the CI/CD pipeline to block deployments of images with HIGH or CRITICAL vulnerabilities.
- **Container Hardening**: Docker images drop unnecessary capabilities, run as non-root users, and enforce read-only filesystems where possible.

## License

Released under the MIT License. See the `LICENSE` file for full text.

## Authors / Maintainers

- Mayank Singh Chouhan
