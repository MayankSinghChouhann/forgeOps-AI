# ForgeOps AI

[![CI Pipeline](https://github.com/MayankSinghChouhann/forgeOps-AI/actions/workflows/ci.yml/badge.svg)](https://github.com/MayankSinghChouhann/forgeOps-AI/actions/workflows/ci.yml)
![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3-green?logo=springboot)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Docker](https://img.shields.io/badge/Docker-Containerized-blue?logo=docker)
![Gemini AI](https://img.shields.io/badge/AI-Gemini_2.0_Flash-purple?logo=google)
![Tests](https://img.shields.io/badge/Tests-55%20Passing%20(100%25)-brightgreen?logo=junit5)

**AI-Powered DevOps Intelligence Platform**

> A production-grade, enterprise-ready SaaS platform engineered as a flagship portfolio project — not a tutorial CRUD app, but a real-world engineering build designed to be discussed in interviews at Google, Amazon, Microsoft, Atlassian, Razorpay, and Flipkart.

🔗 **Live Demo (AWS Hosted):** *[Coming in DevOps Deployment Phase]*

---

## Table of Contents

- [Why ForgeOps AI Exists](#why-forgeops-ai-exists)
- [Features Implemented](#features-implemented)
- [Quality Hardening & Testing Architecture](#quality-hardening--testing-architecture)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start with Docker](#quick-start-with-docker)
- [Local Development & Testing](#local-development--testing)
- [API Reference](#api-reference)
- [Default Credentials](#default-credentials)
- [Roadmap / Project Status](#roadmap--project-status)
- [Advanced Engineering Standards](#advanced-engineering-standards)
- [Learning Goals](#learning-goals)
- [Author](#author)

---

## Why ForgeOps AI Exists

When a Jenkins build fails, a Docker container refuses to start, or a Kubernetes pod enters `CrashLoopBackOff`, most engineers face the same friction: scroll through hundreds of log lines, paste the scariest error into Google, and dig through stale Stack Overflow threads hoping one applies.

**ForgeOps AI eliminates that friction.** Feed it a Jenkins build log, a `kubectl describe pod` output, or a Dockerfile error — it gives you Root Cause Analysis (RCA) the way a Senior SRE would: structured, specific, and immediately actionable.

---

## Features Implemented

### ✅ Feature 1 — JWT Authentication & User Management
- Spring Security 6 with stateless JWT access + refresh token rotation
- BCrypt password hashing, explicit `ProviderManager` configuration
- PostgreSQL persistence: `users` and `refresh_tokens` tables
- React login/register UI with Zod form validation
- Seeded default admin and user accounts on startup via `DatabaseInitializer`

### ✅ Feature 2 — AI DevOps Assistant with Chat History
- Real-time conversation with Google **Gemini 2.0 Flash** AI
- Persistent chat sessions stored in PostgreSQL (`chat_sessions`, `chat_messages`)
- Intelligent local `DevOpsKnowledgeEngine` fallback when Gemini is rate-limited or offline
- Glassmorphic chat UI with Markdown rendering, syntax-highlighted code blocks, and 1-click copy
- Session sidebar with chat history, delete, and new session controls

### ✅ Feature 3 — Jenkins / GitLab CI Log Analyzer
- Pastes raw CI/CD failure logs → returns structured Root Cause Analysis
- Expert rule engine classifies: Maven Compilation Failure, NPM ERESOLVE conflict, Git SCM auth failures, generic runner errors
- Gemini AI augments analysis with detailed contextual RCA and remediation scripts
- Results stored in PostgreSQL with full analysis history and ANSI escape sequence stripping

### ✅ Feature 4 — Docker Container Error Analyzer
- Diagnoses Docker container errors: OOMKilled (Exit 137), Host Port Conflicts (EADDRINUSE), Docker socket permission errors
- Generates production-grade bash remediation scripts ready to run
- Container-specific RCA with cgroup and kernel-level memory management explanations
- 1-click preset loading with real dirty log samples

### ✅ Feature 5 — Kubernetes Cluster Troubleshooter
- Analyzes `kubectl describe pod` / event stream outputs
- Classifies: `CrashLoopBackOff`, `ImagePullBackOff`, scheduling failures (0/N nodes available)
- Generates exact `kubectl` remediation commands and manifest patches
- Preloaded real K8s incident scenarios for instant testing

### ✅ Feature 6 — IaC & CI/CD Pipeline Generator
**Supports generation of:**
| Format | Description |
|---|---|
| **Terraform (AWS)** | Production VPC, EKS Cluster, S3 remote state backend, DynamoDB locking |
| **Kubernetes Manifests** | Deployment, Service, HPA, Ingress with TLS via cert-manager, Liveness/Readiness probes |
| **Helm Values YAML** | Production-ready `values.yaml` with autoscaling and resource limits |
| **GitLab CI/CD** | Multi-stage pipeline: test → docker build → Trivy security scan → K8s rollout |
| **GitHub Actions** | GHCR image build/push + zero-downtime K8s deployment workflow |
| **Dockerfile** | Multi-stage builds for Java 21 (Spring Boot) and Node.js (React/Vite/Nginx) |

Features: interactive provider/environment/runtime selectors, AI custom prompt override, syntax-highlighted code editor, 1-click copy, and file download.

### ✅ Feature 7 — Linux Shell Assistant & Destructive Guard
- **Command Audit Mode**: Analyzes any Linux/Docker/K8s command for safety
  - `DANGEROUS`: `rm -rf /`, `dd if=/dev/zero`, `kill -9 1`, `DROP DATABASE`
  - `CAUTION`: `docker system prune -a`, `git push --force`, `reboot`
  - `SAFE`: Standard read-only/informational commands
- Breaks down every flag/modifier with semantic explanations
- Suggests safe alternatives for destructive commands
- **CLI Synthesizer Mode**: Describe your goal in plain English → get the exact one-liner
- AI-enhanced via Gemini with local rule-based expert engine fallback

### ✅ Feature 8 — Live System Telemetry Dashboard
Real-time platform health metrics sourced from actual runtime data:
| Metric | Source |
|---|---|
| JVM Heap Memory (used/max/%) | `Runtime.getRuntime()` |
| CPU Cores & Load Average | `ManagementFactory.getOperatingSystemMXBean()` |
| Database Connection Pool | `HikariPoolMXBean` (active/idle/total) |
| Platform Counters | JPA repository `.count()` queries |
| Live Activity Feed | Chronological merge of DB analyzer + generator + chat records |
| System Uptime | `RuntimeMXBean.getUptime()` |

Auto-refreshes every 10 seconds. Zero static or hardcoded values.

---

## Quality Hardening & Testing Architecture

### 🛡️ 1. RFC 7807 Standardized Error Handling
- **Domain Exceptions**: Created strongly typed domain exceptions: `ResourceNotFoundException` (404 Not Found) and `BusinessRuleViolationException` (400/409 Conflict).
- **Centralized Controller Advice**: `GlobalExceptionHandler` interceptor implements Spring Boot 3 `ProblemDetail`, ensuring all error payloads follow the RFC 7807 specification:
  ```json
  {
    "type": "about:blank",
    "title": "Resource Not Found",
    "status": 404,
    "detail": "User with email 'devops@forgeops.io' was not found",
    "instance": "/api/auth/profile",
    "timestamp": "2026-08-07T08:20:00Z"
  }
  ```
- Eliminates scattered try/catch blocks across controllers and prevents sensitive internal stack traces from leaking to clients.

### 🔒 2. Production Actuator Security
- In `SecurityConfig`, metric and monitoring endpoints (`/actuator/metrics`, `/actuator/prometheus`) are restricted behind JWT authentication.
- Health endpoints (`/actuator/health`, `/actuator/info`) remain publicly available for Kubernetes Liveness/Readiness probes and Docker health checks.

### 🧪 3. 55 Automated Unit & Integration Tests (100% Pass Rate)
- **Hermetic Testing**: Configured in-memory H2 database (`src/test/resources/application.properties`) for fast, isolated test execution that runs independently of external Docker/PostgreSQL containers.
- **Suite Breakdown**:
  - `LogAnalyzerServiceTest`: Jenkins failures, Docker Exit 137, K8s CrashLoopBackOff, ANSI sanitization, and fallback behavior (10 tests).
  - `ShellSafetyServiceTest`: Parameterized tests for command categorization, destructive syntax detection, and flag analysis (27 tests).
  - `TemplateGeneratorServiceTest`: Terraform S3 state backends, K8s probes, Trivy security stages, and AI customization (14 tests).
  - `AuthServiceTest`: User registration, BCrypt password hashing, duplicate email prevention, and token refresh validation (5 tests).
  - `BackendApplicationTests`: Spring Boot context boot and JPA repository bootstrap verification.

---

## Architecture

ForgeOps AI follows a strict **layered architecture** with **package-by-feature** domain organization:

```
Client (React/Vite)
     │  JWT Bearer Token
     ▼
Spring Boot 3 REST API (port 8080)
     │  JwtAuthenticationFilter
     ▼
┌─────────────────────────────────────────┐
│  Controllers (thin — route + validate)  │
│  /api/auth  /api/assistant  /api/analyzer│
│  /api/generator  /api/terminal          │
│  /api/dashboard/metrics                 │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  Services (all business logic lives here)│
│  LogAnalyzerService (RCA Engine)        │
│  TemplateGeneratorService (IaC Synth)   │
│  ShellSafetyService (Guard Engine)      │
│  DashboardService (JVM Telemetry)       │
│  AssistantService (Chat Orchestration)  │
└─────────────────────────────────────────┘
     │                    │
     ▼                    ▼
PostgreSQL           GeminiAiService
(JPA/Hibernate)      (Google Gemini 2.0 Flash)
                     + Local Expert Fallback
```

**Architecture Decisions:**
- **Package-by-Feature (DDD)**: `auth/`, `assistant/`, `analyzer/`, `generator/`, `terminal/`, `dashboard/`, `common/` — each domain is self-contained and can be extracted to a microservice without touching other modules.
- **JWT Stateless Security**: No server-side session state — horizontally scalable across multiple instances behind a load balancer.
- **AI with Graceful Degradation**: Never hard-fails when Gemini is rate-limited; expert rule engines ensure 100% production availability.
- **Container-First**: Every service designed to run inside Docker from day one.

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Java | 21 | Runtime (LTS) |
| Spring Boot | 3.3 | Framework |
| Spring Security 6 | — | JWT stateless auth |
| Spring Data JPA | — | ORM / database access |
| Hibernate | — | JPA implementation |
| PostgreSQL | 16 | Primary relational database |
| H2 Database | 2.x | In-memory database for hermetic unit/integration tests |
| HikariCP | — | High-performance JDBC connection pooling |
| Flyway | — | Database schema migrations |
| JUnit 5 & Mockito | 5.x | Automated unit and integration testing |
| Maven | 3.9 | Build and dependency management tool |

### AI
| Technology | Purpose |
|---|---|
| Google Gemini 2.0 Flash | Primary LLM engine for RCA, IaC, and command explanation |
| Local Expert Rule Engine | Built-in fallback engine when Gemini is offline/unconfigured |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 5 | Build tool / dev server |
| Tailwind CSS | 4 | Modern utility-first styling |
| Framer Motion | 11 | Smooth micro-animations |
| Zod + React Hook Form | — | Schema validation |
| Axios | — | HTTP client with JWT interceptors |
| Lucide React | — | SRE & cloud icon library |

### DevOps & Infrastructure
| Technology | Purpose |
|---|---|
| Docker | Multi-stage containerization |
| Docker Compose | Multi-container orchestration (App + DB + Redis) |
| Nginx 1.27 | Frontend reverse proxy + SPA routing |
| GitHub Actions & GitLab CI | Automated build, test, and security scanning |
| Kubernetes & Helm | Planned cloud-native orchestration |
| Terraform | Planned AWS Infrastructure as Code |
| Prometheus & Grafana | Planned telemetry scraping & visualization |

---

## Project Structure

### Backend — Package-by-Feature (Domain-Driven Design)

```
backend/src/main/java/com/forgeops/backend/
├── auth/
│   ├── controller/        # AuthController (register, login, refresh)
│   ├── dto/               # LoginRequest, RegisterRequest, AuthResponse
│   ├── entity/            # User, RefreshToken
│   ├── repository/        # UserRepository, RefreshTokenRepository
│   ├── security/          # JwtUtil, JwtAuthenticationFilter, SecurityConfig
│   └── service/           # AuthService
├── assistant/
│   ├── controller/        # AssistantController (sessions + chat)
│   ├── dto/               # SendMessageRequest, ChatMessageResponse
│   ├── entity/            # ChatSession, ChatMessage, MessageRole
│   ├── repository/        # ChatSessionRepository, ChatMessageRepository
│   └── service/           # AssistantService, GeminiAiService, DevOpsKnowledgeEngine
├── analyzer/
│   ├── controller/        # AnalyzerController (analyze, history)
│   ├── dto/               # AnalyzeLogRequest, AnalysisResponse
│   ├── entity/            # AnalysisRecord
│   ├── repository/        # AnalysisRepository
│   └── service/           # LogAnalyzerService (Jenkins + Docker + K8s)
├── generator/
│   ├── controller/        # GeneratorController (generate, history)
│   ├── dto/               # GenerateTemplateRequest, TemplateResponse
│   ├── entity/            # GeneratedTemplate
│   ├── repository/        # TemplateRepository
│   └── service/           # TemplateGeneratorService (Terraform, K8s, CI/CD)
├── terminal/
│   ├── controller/        # TerminalController (explain, generate)
│   ├── dto/               # ExplainCommandRequest, CommandExplanationResponse
│   └── service/           # ShellSafetyService (safety guard + CLI synth)
├── dashboard/
│   ├── controller/        # DashboardController (metrics)
│   ├── dto/               # DashboardMetricsResponse (nested DTOs)
│   └── service/           # DashboardService (JVM + HikariCP telemetry)
├── common/
│   └── exception/         # GlobalExceptionHandler (RFC 7807), ResourceNotFoundException
└── config/
    └── DatabaseInitializer.java  # Seeds admin & user accounts on startup
```

### Frontend — Feature-Sliced Design

```
frontend/src/
├── features/
│   ├── auth/              # Login, Register, JWT token management
│   ├── assistant/         # AI Chat UI + session sidebar
│   ├── analyzer/          # Jenkins / Docker / Kubernetes RCA pages
│   ├── generator/         # IaC + CI/CD pipeline generator pages
│   ├── terminal/          # Shell assistant + destructive guard
│   └── dashboard/         # Live telemetry overview page
├── components/ui/         # Badge, Card (global shared components)
├── layouts/               # AuthLayout, DashboardLayout (with sidebar)
├── pages/                 # LoginPage, RegisterPage (route entrypoints)
├── lib/
│   └── axios.ts           # Axios instance with JWT interceptor
└── App.tsx                # Root router — all 8 features fully wired
```

---

## Quick Start with Docker

**Requires**: Docker Desktop

```bash
# 1. Clone the repository
git clone https://github.com/MayankSinghChouhann/forgeOps-AI.git
cd forgeOps-AI

# 2. Set your Gemini API key (Optional — Fallback engine works out of the box)
echo "GEMINI_API_KEY=your_gemini_api_key_here" >> infra/docker/.env

# 3. Start all services (PostgreSQL + Redis + Backend + Frontend)
docker compose -f infra/docker/docker-compose.yml up -d --build

# 4. Open the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
```

All 4 containers (`forgeops-postgres`, `forgeops-redis`, `forgeops-backend`, `forgeops-frontend`) start with health checks and dependency ordering.

---

## Local Development & Testing

### Prerequisites
- Java 21 (Eclipse Temurin / OpenJDK)
- Node.js 20+
- PostgreSQL 16
- Maven 3.9+

### Database Setup
```sql
CREATE DATABASE forgeops_db;
CREATE USER forgeops_user WITH ENCRYPTED PASSWORD 'forgeops_password';
GRANT ALL PRIVILEGES ON DATABASE forgeops_db TO forgeops_user;
```

### Running Backend
```bash
cd backend
export GEMINI_API_KEY=your_gemini_api_key_here
./mvnw clean install -DskipTests
./mvnw spring-boot:run
# API available at http://localhost:8080
```

### Running Automated Test Suite
```bash
cd backend
./mvnw test
# Executes all 55 hermetic unit and integration tests
```

### Running Frontend
```bash
cd frontend
npm install
npm run dev
# UI available at http://localhost:5173
```

### Building Frontend for Production
```bash
cd frontend
npm run build
```

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login, returns JWT + refresh token |
| `POST` | `/api/auth/refresh` | Rotate refresh token |

### AI Assistant
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/assistant/sessions` | Create new chat session |
| `GET` | `/api/assistant/sessions` | List user sessions |
| `POST` | `/api/assistant/sessions/{id}/messages` | Send message |
| `GET` | `/api/assistant/sessions/{id}/messages` | Get message history |
| `DELETE` | `/api/assistant/sessions/{id}` | Delete session |

### Log Analyzer (Features 3–5)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyzer/analyze` | Analyze log → RCA + Remediation |
| `GET` | `/api/analyzer/history` | User analysis history |
| `GET` | `/api/analyzer/{id}` | Get specific analysis |

**Request body for `/analyze`:**
```json
{
  "rawLog": "...paste full log output here...",
  "targetType": "JENKINS | DOCKER | KUBERNETES",
  "title": "Optional human-readable title"
}
```

### IaC & Pipeline Generator (Feature 6)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/generator/generate` | Generate template |
| `GET` | `/api/generator/history` | User template history |

**Request body for `/generate`:**
```json
{
  "templateType": "TERRAFORM | KUBERNETES | GITLAB_CI | GITHUB_ACTIONS | DOCKERFILE | HELM",
  "targetProvider": "AWS | GCP | AZURE | K8S | GENERIC",
  "serviceName": "my-service",
  "environment": "production",
  "runtime": "java | node | go | python",
  "customPrompt": "Optional AI customization instructions"
}
```

### Shell Assistant (Feature 7)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/terminal/explain` | Audit command safety |
| `POST` | `/api/terminal/generate` | Generate CLI command |

### Dashboard Telemetry (Feature 8)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/metrics` | Live JVM + DB + platform metrics |

> All endpoints except `/api/auth/**` and public actuator health probes require `Authorization: Bearer <jwt_token>` header.

---

## Default Credentials

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@forgeops.ai` | `root123` |
| **User** | `mayank@forgeops.ai` | `root123` |

Credentials are seeded automatically via `DatabaseInitializer` on startup.

---

## Roadmap / Project Status

### Phase 1 & 2 — Full Feature Development ✅ COMPLETE

| Feature | Status | Description |
|---|---|---|
| Feature 1 — Auth | ✅ Done | JWT authentication, registration, refresh tokens |
| Feature 2 — AI Assistant | ✅ Done | Gemini AI chat with persistent PostgreSQL history |
| Feature 3 — Jenkins Analyzer | ✅ Done | CI/CD log RCA engine & failure classifier |
| Feature 4 — Docker Analyzer | ✅ Done | Container error diagnosis & remediation script generator |
| Feature 5 — K8s Troubleshooter | ✅ Done | Pod event stream analysis & patch generator |
| Feature 6 — IaC Generator | ✅ Done | Terraform + K8s + Helm + CI/CD generator |
| Feature 7 — Shell Assistant | ✅ Done | Destructive guard + CLI synthesizer |
| Feature 8 — Live Dashboard | ✅ Done | Real JVM/DB/platform telemetry |

### Phase 3, 4 & 5 — System Hardening & Quality Gates ✅ COMPLETE

| Quality Gate | Status | Description |
|---|---|---|
| Global Exception Handling | ✅ Done | RFC 7807 ProblemDetail format across all REST endpoints |
| Actuator Security | ✅ Done | Metrics/Prometheus restricted behind JWT; health public |
| Automated Testing | ✅ Done | 55 unit and integration tests with 100% pass rate |
| Hermetic Test DB | ✅ Done | In-memory H2 database harness for isolated CI/CD testing |
| Production Build | ✅ Done | Vite production bundle compiled in 13.7s |

### Phase 6 — DevOps Practice & Deployment 🚀 READY TO START

| Topic | Area | Description |
|---|---|---|
| 1. Linux Internals | Foundation | Process management, signals, exit codes, cgroups |
| 2. Docker Hardening | Docker | Multi-stage builds, non-root users, layer caching |
| 3. Docker Compose | Docker | Health checks, container dependencies, networks |
| 4. Nginx Reverse Proxy | Networking | Proxy buffering, rate limiting, SSL/TLS termination |
| 5. GitLab CI/CD Pipeline | CI/CD | Lint ➔ Test ➔ Trivy Scan ➔ Build ➔ Registry ➔ Deploy |
| 6. Kubernetes Architecture | K8s | Pods, Deployments, Services, ConfigMaps, Secrets, HPA |
| 7. Helm Packaging | K8s | Chart templating, values schema, release lifecycle |
| 8. Terraform IaC | Cloud | AWS VPC, EKS, RDS, S3 remote state with DynamoDB lock |
| 9. Observability Stack | Monitoring | Prometheus metrics scraping, Grafana dashboards, Loki |
| 10. AWS Production Review | Cloud | AWS architecture review & production deployment |

---

## Advanced Engineering Standards

### 🐳 Docker
- **Multi-stage builds**: Maven builder → JRE 21 runtime (84% smaller image)
- **Non-root user**: `spring:spring` group for container security hardening
- **HEALTHCHECK**: Wired to Spring Boot Actuator `/actuator/health`
- **Memory-optimized JVM**: `-XX:InitialRAMPercentage=40.0 -XX:MaxRAMPercentage=75.0`

### ☸️ Kubernetes
- Helm Charts for application templating and environment overrides
- Liveness + Readiness probes for zero-downtime traffic management
- Horizontal Pod Autoscaler (CPU/Memory-based scaling)
- ConfigMaps + Secrets for complete separation of configuration and secrets

### 🚀 CI/CD Pipelines
- Multi-stage pipelines: Lint → Test → Build → Security Scan → Deploy
- Trivy container vulnerability scanning
- Hermetic test gate: 100% pass rate required for image tagging
- GitOps deployment workflows

---

## Learning Goals

By the end of this project, the goal is production-ready understanding of:

> **Backend**: Java 21 · Spring Boot 3 · Spring Security · REST API Design · PostgreSQL · JPA/Hibernate · Redis · JWT · HikariCP · Maven · RFC 7807 ProblemDetail · JUnit 5 · Mockito
>
> **AI Integration**: Gemini API · Prompt Engineering · Fallback Architecture · Rate Limit Handling
>
> **Frontend**: React 18 · TypeScript · Vite · Tailwind CSS · React Hook Form · Zod · Axios · Feature-Sliced Architecture
>
> **DevOps**: Linux · Docker · Docker Compose · Nginx · GitLab CI · GitHub Actions · Kubernetes · Helm · Terraform · AWS · Prometheus · Grafana
>
> **Engineering**: Clean Code · SOLID Principles · DDD · Layered Architecture · DTO Pattern · REST Standards · Security Best Practices · Observability

---

## Author

**Mayank Singh Chouhan**
B.Tech Computer Science Engineering, UPES Dehradun

> *"We are NOT building a project. We are becoming software engineers."*

---

*README updated to reflect completion of Phase 1 through 5, including all 8 features, RFC 7807 error handling, Actuator security, and 55 automated tests.*
