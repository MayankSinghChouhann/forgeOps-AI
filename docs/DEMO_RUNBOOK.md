# ForgeOps-AI recording runbook

Checked against the AWS demo at `http://ec2-3-111-42-136.ap-south-1.compute.amazonaws.com:3000` on 21–22 October 2026. Use the dedicated demo account shared separately; do not put its password or an API key in the video or this repository.

The new ForgeOps mark was deployed to the live frontend on 22 October 2026. The first browser visit after the update may still show an older cached HTML page; reload once (Ctrl+Shift+R in Chrome) and check that the logo is the blue hexagon with two inward chevrons. The server now returns `Cache-Control: no-store, must-revalidate` for the HTML page, while versioned assets remain cacheable.

The EC2 frontend also has a local image, `forgeops-ai-frontend:logo-v2-20261022`, containing this branding and cache configuration. Its existing Compose `.env` points `FRONTEND_IMAGE` to that image, so a normal local Compose recreation uses the branded release. The backend, PostgreSQL, and Redis images were not changed.

## What the live demo actually does

| Area | Live action | What to say |
| --- | --- | --- |
| Sign-in | Log in with the demo account. | JWT-backed authentication and a persisted account. |
| Overview | Open **Overview**, refresh, point to memory/CPU, PostgreSQL pool, recent activity, and dependency status. | These counters come from the running backend and database. The Redis and AI states are shown by the dashboard. |
| AI Assistant | Ask `How do I diagnose Kubernetes CrashLoopBackOff?`, then reopen the saved session. | The configured local DevOps rules engine returns the guidance. Gemini is not configured on this AWS demo. |
| Log Analyzer | Paste the genuine CI excerpt in [`demo-data/github-actions-compose-failure-2026-09-25.log`](demo-data/github-actions-compose-failure-2026-09-25.log) and click **Analyze log**. | This is a real failed GitHub Actions job from this repository. The current analyzer identifies a Docker build/run failure but gives a generic RCA; the precise error in the log is a missing Compose `.env` file. |
| Docker | Select the **Exit code 137 (OOMKilled)** sample, then **Analyze container**; show severity, remediation, and history. | The built-in incident is an illustrative sample, not a captured production outage. The Docker analyzer is working on that input. |
| Kubernetes | Select **CrashLoopBackOff**, then **Analyze workload**. | This diagnoses pasted pod events. This demo has no connected Kubernetes cluster. The built-in event stream is illustrative. |
| CI/CD | Choose **GitHub Actions**, **Java 21**, set service `forgeops-demo-service`, then **Generate Pipeline**. Show tests, image build, security scan, and deployment stages. | The app generates reviewable YAML; generation does not run a pipeline or deploy anything. |
| Infrastructure | Choose **Terraform (AWS)**, **AWS**, **staging**, set service `forgeops-demo-service`, then **Generate Template**. Show code and download. | The app generates reviewable IaC; it does not provision AWS resources. |
| API Playground | Open **Command audit**; enter `docker system prune -a --volumes` and click **Audit Command**. Show caution and safer alternative. Then open **Command generator** and enter `Show the last 100 logs from a Docker container`. | ForgeOps explains or recommends commands; it does not execute them. |
| Settings | Open **Settings** to show workspace and account context. | Integration credentials remain server-side. This is an information page, not a settings editor. |

## Click-by-click guide for every visible area

1. **Sign in:** Open `/login`, enter the dedicated demo account email and password, and click **Sign in**. Once the Overview appears, the protected route and authenticated API are working. Hide the password field from the recording. **Request access** leads to registration; do not create a new account just for the video.
2. **Overview:** In the sidebar, click **Overview**, then **Refresh**. Show Memory, CPU, Database connections, Diagnostics, Recent activity, and service health. Explain that recent activity is stored data from actions performed in this workspace. Do not describe the cards as continuous host telemetry; they are backend-reported snapshots.
3. **AI Assistant:** Click **AI Assistant**, start a **New DevOps Session**, type `How do I diagnose Kubernetes CrashLoopBackOff?`, and send. Show the response and reopen that session from the left history. The AWS demo uses the local rules engine; the Gemini indicator can say **Fallback**.
4. **Log Analyzer:** Click **Log Analyzer**, then **Clear**. Paste the four-line genuine GitHub Actions excerpt linked below and click **Analyze log**. Read the result's stage, severity, recommended actions, and **Recent analyses**. The actual CI error is `infra/docker/.env not found`; the present analyzer may give a broader diagnosis, so explain the discrepancy honestly.
5. **Docker:** Click **Docker** and the **Exit code 137 (OOMKilled)** sample card. Click **Analyze container**. Show the failure stage, severity, remediation, and saved history row. The sample is illustrative; you may instead paste a redacted real `docker logs` error if one exists.
6. **Kubernetes:** Click **Kubernetes**, select the **CrashLoopBackOff** sample, and click **Analyze workload**. Show the result and history. This analyzes pasted events; it does not connect to a real cluster.
7. **CI/CD:** Click **CI/CD**, choose **GitHub Actions** and **Java 21**, enter `forgeops-demo-service` as the service name, then click **Generate Pipeline**. Inspect the output before clicking **Copy YAML** or **Download**. Generation produces a proposed workflow; no pipeline is executed.
8. **Infrastructure:** Click **Infrastructure**, choose **Terraform (AWS)**, provider **AWS**, environment **staging**, and service name `forgeops-demo-service`. Click **Generate Template**, inspect the result, and optionally use **Copy Code** or **Download File**. This generates source code; it does not provision resources.
9. **API Playground:** Click **API Playground** and the **Command audit** tab. Enter `docker system prune -a --volumes`, click **Audit Command**, and show its caution/safer guidance. Do **not** run the command. Switch to **Command generator**, enter `Show the last 100 logs from a Docker container`, and click **Generate Command**. Review the output before copying it; the app does not execute shell commands.
10. **Settings:** Click **Settings** and show workspace, environment, integration, and account context. This page displays configuration; it is not an editor for secrets or deployment settings.

The top search field is not a verified global resource search workflow on this release. Do not make it a video feature unless it returns a real result during rehearsal.

The live AWS app uses an older backend release. **Operations/approvals** and **Audit trail** in the newer source tree are not available as working live demo paths; `/api/operations` and `/api/evaluation/metrics` currently return HTTP 500. Do not show or describe them as working. Project management is not a feature of the deployed UI.

The frontend intentionally returns 404 for public `/actuator/*` routes to protect backend management endpoints. That public 404 is expected, not proof that the backend is unhealthy. Check internal container health through SSH when access is available.

## Genuine log for the Log Analyzer

The excerpt is copied from the **Validate Docker Compose production configuration** step of [this failed GitHub Actions run](https://github.com/MayankSinghChouhann/forgeOps-AI/actions/runs/36106999149). Its source job is `Trivy repository scan`, job ID `107981702770`. It contains no credentials. Keep the source link visible or mention it on screen so viewers can distinguish it from the app's sample incidents.

1. Open [`demo-data/github-actions-compose-failure-2026-09-25.log`](demo-data/github-actions-compose-failure-2026-09-25.log) and copy its four lines.
2. In **Log Analyzer**, click **Clear**, paste the excerpt, then **Analyze log**.
3. Show the input error line: `infra/docker/.env not found`.
4. Explain that the analyzer currently gives a broad Docker failure classification. The operator still checks the exact log line and Compose configuration before applying a fix.

To show actual container logs during a terminal cutaway, use the running host after SSH access is restored:

```bash
ssh -i "forgeops-ai-key.pem" ubuntu@ec2-3-111-42-136.ap-south-1.compute.amazonaws.com
docker ps --format 'table {{.Names}}\t{{.Status}}'
docker logs --since 10m --tail 80 forgeops-backend 2>&1
docker logs --since 10m --tail 80 forgeops-frontend 2>&1
```

Read and redact any tokens, email addresses, IPs, or request payloads before pasting real runtime logs into the app or recording them. Healthy container logs may have no error for the analyzer to diagnose. Do not manufacture an outage on the live host.

## Suggested recruiter video: about 5 minutes

1. **0:00–0:30 — Problem and architecture.** Say: “ForgeOps brings DevOps incident triage, command safety, and IaC generation into one React + Spring Boot workspace, backed by PostgreSQL and Redis.” Show sign-in and Overview.
2. **0:30–1:30 — Real incident input.** Open the source GitHub Actions failure, paste its excerpt into Log Analyzer, and show stored analysis. Call out the exact `.env` error and the analyzer's present limitation.
3. **1:30–2:15 — Docker and Kubernetes diagnostics.** Demonstrate the two labeled sample incidents, severity, remediation, and history. Explain that these are pasted-log workflows, not live cluster telemetry.
4. **2:15–3:15 — Generation.** Generate GitHub Actions YAML and Terraform. Show tests/security gates and downloadable code. Say that a human reviews before execution.
5. **3:15–4:00 — Safe operations.** Audit `docker system prune -a --volumes` and show caution plus safer alternative. Never run the command.
6. **4:00–4:40 — Assistant and full-stack proof.** Ask the CrashLoopBackOff prompt and reopen its saved session; return to Overview to show newly recorded activity and database-backed history.
7. **4:40–5:00 — Honest close.** Mention Docker Compose on AWS EC2, the local rules engine fallback, and the next improvements: HTTPS and current-backend rollout with migration repair.

## Recording checks

- Open the live URL in a fresh tab and verify the new logo, sign-in, and dashboard after deployment.
- Keep the browser at 100% zoom and hide personal tabs/notifications.
- Use only the demo account. Avoid filming its password, browser storage, `.env` files, SSH key, or AWS account pages.
- The public demo URL uses HTTP; do not reuse its password elsewhere. HTTPS should be added before sharing the site widely.
- Check each result before recording. If any route errors, omit that route and state its limitation rather than showing a staged success message.
