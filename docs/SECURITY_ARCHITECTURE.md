# Security and operations architecture

This document describes the controls implemented in the repository. It intentionally does not claim that ForgeOps connects to or executes against a deployment target.

## Authorization model

Authentication uses a short-lived JWT access token and a rotating, opaque refresh token. Access tokens are kept in browser memory. Refresh tokens are stored only as SHA-256 hashes and delivered in an `HttpOnly`, `SameSite=Strict` cookie (`Secure` is required by the production profile).

Spring Security resolves the account from PostgreSQL on every authenticated request. Roles are therefore not trusted from browser state or stale JWT claims. Method-level `@PreAuthorize` checks are the enforcement boundary.

| Role | Effective access |
| --- | --- |
| `VIEWER` | Own/visible dashboard and operation records; no AI, mutation, decision, or administrative permission. This is the self-registration default. |
| `OPERATOR` | AI assistant, analysis, template generation, command recommendations, own operation records, and external execution handoffs. Cannot approve. |
| `APPROVER` | All operation records, approve/reject decisions, and aggregate evaluation metrics. Cannot generate or execute operations. |
| `ADMIN` | All permissions, audit search, and user-role administration. |

Role assignment is available only at `PATCH /api/admin/users/{id}/role` to callers with `USER_ADMIN`. The API blocks self-role changes and demotion of the final administrator. Existing legacy `USER` accounts migrate to `OPERATOR`; newly registered accounts are `VIEWER`.

## Recommendation and approval lifecycle

The terminal assistant classifies the extracted recommendation before persistence:

```text
recommendation -> LOW ---------------------> APPROVED (policy)
               -> MEDIUM/HIGH -> PENDING_APPROVAL -> APPROVED -> EXECUTING -> SUCCEEDED
                                              |             |             -> FAILED
                                              -> REJECTED    -> EXPIRED
```

- Shell composition, redirection, privilege changes, and infrastructure mutation are at least medium risk.
- A medium/high-risk requester cannot approve their own operation, including when that requester has an approver role.
- Approval and execution-handoff transitions acquire a pessimistic database lock.
- Approval TTL defaults to 24 hours and is configured with `FORGEOPS_APPROVAL_TTL`.
- `execution/start` requires a unique idempotency key. A retry with the same key is idempotent; a different key cannot restart an executing or completed operation.
- `execution/result` accepts only the matching key and only while the operation is `EXECUTING`.
- ForgeOps returns recommendation text to the authorized operator but never invokes a local or remote shell. The operator runs it in the separately controlled target environment and reports the observed result. This boundary avoids turning an Internet-facing AI endpoint into arbitrary code execution.

## Audit architecture

`X-Correlation-ID` is accepted only when it contains 8–100 safe identifier characters; otherwise the server creates a UUID. It is returned to the client, placed in structured-log MDC, and copied to operation and audit records.

Audit events contain actor email, actor role, action, resource type/ID, correlation ID, success, timestamp, and bounded JSON metadata. Keys containing password, secret, token, authorization, cookie, API-key, or credential terms are stored as `[REDACTED]`. Request bodies, authorization headers, cookies, AI prompts, and raw execution output are not written to audit metadata.

`GET /api/audit` requires `AUDIT_READ` and supports actor, action, resource type, correlation ID, outcome, and time-range filters. No update/delete API exists. PostgreSQL triggers reject `UPDATE` and `DELETE` on `audit_events`; retention or archival therefore requires an explicit database-administration procedure.

## Measurement and evaluation

Micrometer/Prometheus metrics are derived from application events:

- `forgeops.api.latency` and `forgeops.api.requests` by method, route template, HTTP status/outcome;
- `forgeops.ai.response_latency` and `forgeops.ai.requests` by provider and outcome;
- `forgeops.recommendations.created` by risk;
- `forgeops.approvals.decisions` and `forgeops.approvals.turnaround`;
- `forgeops.operations.execution_started`, `forgeops.operations.completed`, and `forgeops.operations.execution_latency`;
- `forgeops.audit.write_errors`.

`GET /api/evaluation/metrics` requires `EVALUATION_READ`. Counts, acceptance rate, success rate, approval turnaround, and execution latency are calculated from persisted operation records. Rates and averages are `null` when there are no qualifying events. JVM/OS/pool telemetry likewise reports unavailable values rather than placeholder numbers.

## Production considerations and remaining boundaries

- Put the backend behind TLS and keep `FORGEOPS_REFRESH_COOKIE_SECURE=true`.
- Generate a Base64-encoded 256-bit or stronger JWT key and store all credentials in a secret manager.
- Configure an explicit CORS origin list; do not use wildcard origins with credentials.
- Use the one-time bootstrap administrator only for initial provisioning, then disable it.
- PostgreSQL is the source of truth for approvals and audit events. Back it up and restrict direct database write access.
- The in-memory rate limiter is per application instance. A multi-replica deployment needs a shared limiter at the gateway or Redis layer.
- An external execution system should authenticate independently, bind each execution to the operation/correlation/idempotency IDs, and submit only verified outcomes. ForgeOps does not currently cryptographically attest externally reported results.
- Audit rows are tamper-resistant against normal application/database writes, not against a PostgreSQL superuser. Forward structured logs/audit events to immutable external storage where compliance requires it.
- The local safety classifier is conservative but not a formal shell parser. Human review remains mandatory for all medium/high-risk text.
