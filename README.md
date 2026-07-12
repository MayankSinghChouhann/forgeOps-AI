# ForgeOps AI

**AI-Powered DevOps Intelligence Platform**

ForgeOps AI is a production-grade platform that helps developers and DevOps engineers troubleshoot infrastructure, analyze CI/CD failures, debug Docker and Kubernetes issues, generate Infrastructure as Code, and learn DevOps through AI-powered mentorship — not just another CRUD project, but a real SaaS-style engineering build.

---

## Table of Contents

- [Why ForgeOps AI Exists](#why-forgeops-ai-exists)
- [Core Features](#core-features)
- [Features That Set It Apart](#features-that-set-it-apart)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Development Philosophy](#development-philosophy)
- [Development Process](#development-process)
- [Roadmap / Project Status](#roadmap--project-status)
- [Learning Goals](#learning-goals)
- [Author](#author)

---

## Why ForgeOps AI Exists

When a Jenkins build fails, a Docker container refuses to start, or a Kubernetes pod sits in `CrashLoopBackOff`, most developers face the same routine: scroll through hundreds of lines of logs, copy the scariest-looking line into Google, and dig through Stack Overflow threads hoping one applies. This isn't a knowledge gap — it's a tooling gap. There's no fast, structured way to go from "here's my error" to "here's the actual root cause and here's why it happened."

ForgeOps AI closes that gap. Feed it a Jenkins log, a `kubectl describe pod` output, or a Terraform plan, and instead of a generic answer, it walks through root cause the way a senior engineer or mentor would — explaining *why*, not just *what to paste next*.

## Core Features

- Authentication & User Management
- AI DevOps Assistant with Chat History
- Jenkins Log Analyzer
- Docker Error Analyzer
- Kubernetes Troubleshooter
- Terraform Generator
- YAML Generator
- GitHub Actions Generator
- Linux Command Assistant
- Git Troubleshooter
- Dashboard

## Features That Set It Apart

These go beyond a standard AI DevOps assistant:

- **AI Mentor Mode** — explains root cause like a senior engineer, not just an answer engine
- **Root Cause Analysis Engine**
- **Learning Mode**
- **Production Readiness Score**
- **DevOps Interview Simulator**
- **GitHub Repository Analyzer**
- **Resume Analyzer**
- **AI Roadmap Generator**
- **Interactive DevOps Playground**
- **AWS Architecture Generator**
- **Spring Boot Error Analyzer**
- **Personalized Learning Dashboard**
- **Analytics Dashboard**
- **RAG-based Documentation Search**
- **Multi-LLM Support**
- **Vector Database Integration**
- **Enterprise Monitoring**
- **Complete Production Deployment**

## Tech Stack

**Backend**
- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- PostgreSQL
- Redis
- JWT
- Maven

**AI**
- LangChain4j
- Gemini API
- OpenAI (planned)
- Ollama (planned)

**Frontend**
- React + TypeScript

**DevOps**
- Docker
- Docker Compose
- Jenkins
- GitHub Actions
- Kubernetes
- Terraform

**Cloud**
- AWS

**Monitoring**
- Prometheus
- Grafana

**Logging**
- ELK Stack

**Testing**
- JUnit
- Mockito
- Testcontainers

## Architecture

ForgeOps AI follows a layered architecture. A request flows top to bottom, and each layer has exactly one responsibility:

<img width="2720" height="2080" alt="forgeops_ai_high_level_architecture" src="https://github.com/user-attachments/assets/d2dac27f-63db-4ba0-bcb6-2a017dd266ab" />

**Why it's shaped this way:**

- **Client layer** never talks to the database or the AI model directly — only to the API. This keeps the frontend swappable without touching backend logic.
- **API layer** is the front door — authentication (JWT) happens here before anything else, keeping security at the edge instead of scattered through business logic.
- **Service layer** holds the actual decision-making. Controllers stay thin; the service layer decides what to do — a separation that shows up constantly in backend interviews.
- **AI integration layer and data layer sit side by side** because to the service layer, both are just dependencies it calls — the same idea behind dependency injection.
- **Infrastructure & DevOps sits below, not inside, the request path** — it's what runs and ships the system above it, not part of runtime request handling. Runtime architecture and deployment architecture are kept as separate mental models.

## Development Philosophy

> We are NOT building a project. We are becoming software engineers.

Every feature is built through a full engineering cycle, not just written and shipped:

```
Understand Problem → Architecture → Database Design → API Design →
Implementation → Testing → Docker → Deployment → Optimization → Documentation
```

**Learning rules:**
- Never jump straight to code — explain WHY before HOW
- Every concept taught from scratch: annotations, dependencies, folders, packages, APIs, classes, commands, and design decisions
- Compare approaches when multiple exist
- Follow industry best practices, always

**Coding rules:**
- Clean Code & SOLID Principles
- Layered Architecture
- REST Standards
- DTO Pattern
- Proper Exception Handling & Validation
- Logging
- Testing
- Security
- Scalability & Maintainability
- No shortcuts, no unnecessary code, no copy-paste tutorials

## Development Process

Every phase of every feature includes:

Requirement Analysis · Architecture Diagram · Database Design · Folder Structure · API Design · Implementation · Testing · Docker · Deployment · Documentation · Interview Questions · Assignments · Revision Notes · Common Mistakes · Best Practices

## Roadmap / Project Status

- [x] **Phase 0 — Understand the problem** (whole platform): why ForgeOps AI exists, what it actually solves
- [x] **Phase 0 — High-level architecture**: layered system design finalized
- [ ] **Phase 1 — Feature 1: Authentication** *(starting next)* — Spring Boot fundamentals, project skeleton, Spring Security, JWT
- [ ] Feature 2: AI DevOps Assistant + Chat History
- [ ] Feature 3: Jenkins Log Analyzer
- [ ] Feature 4: Docker Error Analyzer
- [ ] Feature 5: Kubernetes Troubleshooter
- [ ] Feature 6: Terraform / YAML / GitHub Actions Generators
- [ ] Feature 7: Linux Command Assistant & Git Troubleshooter
- [ ] Feature 8: Dashboard
- [ ] Advanced features (Mentor Mode, Root Cause Engine, Interview Simulator, RAG search, etc.)
- [ ] Full production deployment (Docker → Kubernetes → AWS → Monitoring)

## Advanced Engineering Standards (Phases)

As we transition from building features to scaling and deploying them, we will adhere to the following senior-level DevOps and engineering standards:

### 🐳 Docker Phase
- **Multi-stage builds**: Separate build and runtime environments to ensure small, secure, and production-optimized final images.
- **Non-root user containerization**: Run container processes as non-root users for enhanced security.
- **Actuator Health Checks**: Hook `HEALTHCHECK` instructions directly to the Spring Boot Actuator `/health` endpoint.

### ☸️ Kubernetes Phase
- **Helm Charts**: Package and template application manifests via Helm charts instead of maintaining raw YAML.
- **Liveness + Readiness Probes**: Ensure proper traffic routing and container recovery with health probes.
- **ConfigMaps & Secrets**: Keep configurations and sensitive credentials strictly separated from code.
- **Horizontal Pod Autoscaling (HPA)**: Automate scaling based on CPU/Memory load.

### 🚀 CI/CD Phase
- **Multi-stage Pipelines**: Define comprehensive pipelines covering linting, testing, security scanning, building, pushing, and deploying.
- **Security Vulnerability Scans**: Integrate Trivy (container image scans) and OWASP Dependency-Check (dependency vulnerabilities).
- **Quality Gates**: Fail the pipeline automatically if test coverage falls below the set threshold.
- **GitOps (ArgoCD)**: Maintain declarative state synchronization between Git repository and Kubernetes.

### 🏗️ IaC Phase
- **Terraform Remote State**: Manage infrastructure safely using remote state backends (S3 + DynamoDB state locking).
- **Terraform Modules**: Modularize infrastructure code into reusable modules.

### 📊 Monitoring & Observability Phase
- **Custom Grafana Dashboards**: Create dashboards tracking application-specific business metrics (e.g., login success rates, API latency) alongside default system metrics.
- **Alertmanager Routing**: Set specific rules (e.g., alert when error rate > 5%).
- **Structured JSON Logging**: Incorporate correlation/trace IDs for queryable logs inside log management systems.

### 🏆 Bonus Differentiators
- **Deployment Strategies**: Blue-Green or Canary deployment flows.
- **Chaos Experiments**: Verify self-healing capabilities of Kubernetes by intentionally terminating pods.
- **Load Testing**: Integrate k6 load tests into the CI workflow and publish reports to the README.

## Learning Goals

By the end of this project, the target is confident, interview-ready understanding of:

Advanced Java · Spring Boot · Spring Security · REST APIs · PostgreSQL · SQL · Redis · JWT · Docker · Docker Compose · Kubernetes · Jenkins · GitHub Actions · Terraform · AWS · AI Integration · LangChain4j · Gemini API · RAG · Vector Databases · Clean Architecture · Design Patterns · Production Deployment · Monitoring · Logging · Software Engineering Best Practices

The goal: final-year-project quality, resume-project quality, internship-ready, product-company-ready, production-ready, open-source quality — the strongest project on the profile.

## Author

**Mayank Singh Chouhan**
B.Tech Computer Science Engineering, UPES Dehradun

---

*This README will be updated as each feature is completed, following the project's own documentation-as-you-go philosophy.*
