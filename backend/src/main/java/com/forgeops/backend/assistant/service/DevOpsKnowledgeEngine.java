package com.forgeops.backend.assistant.service;

import org.springframework.stereotype.Component;
import java.util.Locale;

@Component
public class DevOpsKnowledgeEngine {

    public String generateDevOpsResponse(String prompt) {
        String lower = prompt.toLowerCase(Locale.ROOT).trim();

        // 1. Kubernetes CrashLoopBackOff
        if (lower.contains("crashloopbackoff") || (lower.contains("pod") && lower.contains("crash"))) {
            return """
### ☸️ Root Cause Analysis: Kubernetes `CrashLoopBackOff`

A pod in `CrashLoopBackOff` indicates that the container repeatedly starts, fails, and restarts, triggering Kubernetes' exponential backoff penalty loop (10s, 20s, 40s... up to 5 mins).

#### 🔍 Step-by-Step Diagnostic Workflow:
```bash
# 1. Inspect exit codes & termination state
kubectl describe pod <pod-name> -n <namespace>

# 2. Check current container logs
kubectl logs <pod-name> -n <namespace>

# 3. Check PREVIOUS crashed container instance logs (Critical!)
kubectl logs <pod-name> -n <namespace> --previous
```

#### 🚨 Common Root Causes & Remedies:
1. **Application Runtime Panic / Missing Env**:
   - Check if database connection string or mandatory env vars are missing in `ConfigMap` or `Secret`.
2. **Exit Code 137 (OOMKilled)**:
   - The Linux kernel OOM Killer terminated the container because memory exceeded `resources.limits.memory`.
   - **Fix**: Increase memory limits or profile JVM heap (`-XX:MaxRAMPercentage=75.0`).
3. **Failing Liveness Probe**:
   - The probe endpoint `/health` took longer than `timeoutSeconds` or failed during slow application startup.
   - **Fix**: Add `initialDelaySeconds: 30` or configure a `startupProbe`.
""";
        }

        // 2. Docker OOMKilled / Exit code 137
        if (lower.contains("oomkilled") || lower.contains("exit 137") || lower.contains("exit code 137")) {
            return """
### 🐳 Diagnostic Report: Container Exit Code 137 (OOMKilled)

**Exit Code 137** = `128 + 9 (SIGKILL)`. The host OS kernel terminated your container because its memory consumption exceeded the allocated cgroup limit (`memory limit`).

#### 🛠️ Immediate Remediation Steps:
1. **Inspect Docker Container State**:
   ```bash
   docker inspect <container_id> --format='{{json .State}}' | jq '{OOMKilled: .OOMKilled, ExitCode: .ExitCode, Error: .Error}'
   ```
2. **Increase Memory Limit**:
   In `docker-compose.yml`:
   ```yaml
   services:
     backend:
       deploy:
         resources:
           limits:
             memory: 1024M
           reservations:
             memory: 512M
   ```
3. **JVM Memory Optimization (Java Apps)**:
   Ensure your Java process respects container cgroups:
   ```dockerfile
   ENTRYPOINT ["java", "-XX:InitialRAMPercentage=40.0", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
   ```
""";
        }

        // 3. Nginx Reverse Proxy / 502 Bad Gateway
        if (lower.contains("502") || (lower.contains("nginx") && lower.contains("gateway"))) {
            return """
### 🌐 Diagnostic Report: Nginx `502 Bad Gateway`

A `502 Bad Gateway` indicates that Nginx (acting as a reverse proxy) received an invalid or null response from the upstream application server.

#### 🔎 Diagnostic Steps:
1. **Check Nginx Error Log**:
   ```bash
   docker logs forgeops-nginx 2>&1 | tail -n 20
   ```
2. **Verify Upstream Connectivity**:
   - Ensure the backend service name matches the Docker network DNS: `proxy_pass http://backend:8080;`
   - Test connectivity from within the Nginx container:
     ```bash
     docker exec -it forgeops-nginx curl -v http://backend:8080/actuator/health
     ```
3. **Check Upstream Server State**:
   - If the Spring Boot backend is still starting or crashing during startup, Nginx immediately returns `502`.
   - Ensure `depends_on` with `condition: service_healthy` is configured in `docker-compose.yml`.
""";
        }

        // 4. Default Senior DevOps Assistant Response
        return String.format("""
### 🚀 Senior DevOps Engineering Guidance

Here is the architectural and operational breakdown for: **"%s"**

#### 🛠️ Production Recommendations:
1. **Infrastructure as Code (IaC)**: Maintain declarative definitions using Terraform or Helm to guarantee reproducibility across dev, staging, and production environments.
2. **Observability**: Ensure all services emit structured JSON logs with correlation IDs (`traceId`), and expose Micrometer `/actuator/prometheus` metrics.
3. **Resilience & Security**: Run containers under non-root user IDs (`USER 1001`), configure Kubernetes liveness/readiness probes, and enforce secret rotation.

```bash
# Verify system status
docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"
```

*Need deeper analysis on a specific Jenkins log, Kubernetes manifest, or Dockerfile? Paste the snippet directly to initiate root cause breakdown.*
""", prompt);
    }
}
