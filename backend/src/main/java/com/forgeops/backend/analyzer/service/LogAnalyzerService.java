package com.forgeops.backend.analyzer.service;

import com.forgeops.backend.analyzer.dto.AnalysisResponse;
import com.forgeops.backend.analyzer.dto.AnalyzeLogRequest;
import com.forgeops.backend.analyzer.entity.AnalysisRecord;
import com.forgeops.backend.analyzer.repository.AnalysisRepository;
import com.forgeops.backend.assistant.service.GeminiAiService;
import com.forgeops.backend.common.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class LogAnalyzerService {

    private static final Logger log = LoggerFactory.getLogger(LogAnalyzerService.class);
    private static final Pattern ANSI_PATTERN = Pattern.compile("\\u001B\\[[;\\d]*m");

    private final AnalysisRepository analysisRepository;
    private final GeminiAiService geminiAiService;

    public LogAnalyzerService(AnalysisRepository analysisRepository, GeminiAiService geminiAiService) {
        this.analysisRepository = analysisRepository;
        this.geminiAiService = geminiAiService;
    }

    @Transactional
    public AnalysisResponse analyzeLog(Long userId, AnalyzeLogRequest request) {
        String cleanLog = sanitizeLog(request.getRawLog());
        String targetType = request.getTargetType() != null ? request.getTargetType().toUpperCase(Locale.ROOT) : "JENKINS";
        String title = request.getTitle() != null && !request.getTitle().isBlank() 
                ? request.getTitle() 
                : generateDefaultTitle(targetType, cleanLog);

        DiagnosticResult result = performLocalDiagnosis(targetType, cleanLog);

        // Enhance with Gemini AI if available
        if (geminiAiService.isConfigured()) {
            try {
                String aiPrompt = String.format(
                    "You are a Principal SRE performing Root Cause Analysis on this %s error log.\n" +
                    "Log snippet:\n```\n%s\n```\n" +
                    "Provide:\n" +
                    "1. Root Cause Summary\n" +
                    "2. Exact step-by-step fix\n" +
                    "3. Ready-to-run bash/kubectl/docker remediation commands.",
                    targetType, cleanLog.length() > 3000 ? cleanLog.substring(0, 3000) : cleanLog
                );
                String aiResponse = geminiAiService.generateDevOpsResponse(aiPrompt);
                if (aiResponse != null && !aiResponse.isBlank()) {
                    result.rootCause = aiResponse;
                }
            } catch (Exception e) {
                log.warn("[LogAnalyzer] Gemini AI analysis failed, using expert engine fallback: {}", e.getMessage());
            }
        }

        AnalysisRecord record = new AnalysisRecord(
                userId,
                targetType,
                title,
                cleanLog,
                result.errorSummary,
                result.rootCause,
                result.failureStage,
                result.severity,
                result.remediationScript
        );

        AnalysisRecord saved = analysisRepository.save(record);
        return AnalysisResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<AnalysisResponse> getUserHistory(Long userId) {
        List<AnalysisRecord> records = (userId != null) 
                ? analysisRepository.findByUserIdOrderByCreatedAtDesc(userId)
                : analysisRepository.findAll();
        return records.stream().map(AnalysisResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public AnalysisResponse getAnalysisById(UUID id) {
        return analysisRepository.findById(id)
                .map(AnalysisResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("AnalysisRecord", "id", id));
    }

    private String sanitizeLog(String raw) {
        if (raw == null) return "";
        String stripped = ANSI_PATTERN.matcher(raw).replaceAll("");
        // Limit to reasonable size if huge
        if (stripped.length() > 20000) {
            stripped = stripped.substring(0, 10000) + "\n...[TRUNCATED MIDDLE LOGS]...\n" + stripped.substring(stripped.length() - 10000);
        }
        return stripped.trim();
    }

    private String generateDefaultTitle(String targetType, String log) {
        String lower = log.toLowerCase(Locale.ROOT);
        if (lower.contains("compilation error") || lower.contains("maven-compiler-plugin")) {
            return "Jenkins: Maven Compilation Failure";
        } else if (lower.contains("oomkilled") || lower.contains("exit code 137")) {
            return "Docker: Container Out Of Memory (Exit 137)";
        } else if (lower.contains("crashloopbackoff")) {
            return "Kubernetes: Pod CrashLoopBackOff";
        } else if (lower.contains("imagepullbackoff")) {
            return "Kubernetes: Container ImagePullBackOff";
        } else if (lower.contains("address already in use") || lower.contains("bind")) {
            return "Docker: Host Port Conflict";
        }
        return targetType + " Incident Analysis (" + java.time.LocalDate.now() + ")";
    }

    private DiagnosticResult performLocalDiagnosis(String targetType, String log) {
        String lower = log.toLowerCase(Locale.ROOT);

        if ("DOCKER".equals(targetType) || lower.contains("docker") || lower.contains("containerd")) {
            return diagnoseDocker(lower, log);
        } else if ("KUBERNETES".equals(targetType) || lower.contains("kubectl") || lower.contains("pod")) {
            return diagnoseKubernetes(lower, log);
        } else {
            return diagnoseJenkins(lower, log);
        }
    }

    private DiagnosticResult diagnoseJenkins(String lower, String raw) {
        DiagnosticResult r = new DiagnosticResult();
        r.severity = "HIGH";

        if (lower.contains("compilation error") || lower.contains("maven-compiler-plugin") || lower.contains("cannot find symbol")) {
            r.failureStage = "Maven Compilation";
            r.errorSummary = "Java source code compilation failed due to missing symbol, syntax error, or JDK bytecode incompatibility.";
            r.rootCause = """
### 🔴 Root Cause Analysis: Maven Build Compilation Failure
The build executor encountered invalid syntax, missing dependency declarations in `pom.xml`, or a JDK version mismatch between your project compiler settings and the CI runner runtime.

#### 🔎 Diagnostic Observations:
- **Build Plugin**: `org.apache.maven.plugins:maven-compiler-plugin`
- **Impact**: Artifact `.jar` was not generated, blocking subsequent Docker container packaging and testing gates.
""";
            r.remediationScript = """
# 1. Test clean build locally with debug stacktrace
mvn clean compile -X -DskipTests

# 2. Force update all remote dependencies & parent POMs
mvn dependency:purge-local-repository -DactTransitively=false -DreResolve=true

# 3. Verify Java runtime matches your compiler target
java -version
javac -version
""";
        } else if (lower.contains("eresolve") || lower.contains("peer dependency") || lower.contains("npm err!")) {
            r.failureStage = "NPM Package Resolution";
            r.errorSummary = "Node.js dependency resolution conflict: incompatible peer dependencies detected in package-lock.json.";
            r.rootCause = """
### 🔴 Root Cause Analysis: NPM ERESOLVE Dependency Conflict
NPM v7+ strictly validates peer dependencies. Two or more packages in your dependency tree require conflicting versions of the same shared peer library.

#### 🔎 Diagnostic Observations:
- **Command**: `npm ci` / `npm install`
- **Impact**: Frontend build pipeline exited immediately before `vite build` could run.
""";
            r.remediationScript = """
# 1. Option A: Clean install with legacy peer dependency resolution
npm ci --legacy-peer-deps

# 2. Option B: Identify and fix conflicting package versions
npm explain <conflicting-package-name>

# 3. Clean node_modules & rebuild
rm -rf node_modules package-lock.json && npm install
""";
        } else if (lower.contains("could not read username") || lower.contains("permission denied (publickey)") || lower.contains("git fetch")) {
            r.failureStage = "Git SCM Checkout";
            r.errorSummary = "Git authentication failure: CI runner lacks SSH deploy key or valid personal access token (PAT).";
            r.rootCause = """
### 🔴 Root Cause Analysis: SCM Authentication & Authorization Failure
The CI/CD runner failed to clone or fetch submodules because the repository credentials (SSH Deploy Key, Deploy Token, or CI_JOB_TOKEN) are missing, expired, or lack read permissions.
""";
            r.remediationScript = """
# 1. Verify SSH key configuration in CI runner
ssh -Tv git@github.com

# 2. Set repository checkout token in CI environment variables
# For GitLab CI: Settings > CI/CD > Variables > Add GITLAB_TOKEN
# For Jenkins: Manage Jenkins > Credentials > Add 'SSH Username with private key'
""";
        } else {
            r.failureStage = "CI/CD Pipeline Execution";
            r.errorSummary = "General CI/CD job execution failure in pipeline runner.";
            r.rootCause = "The pipeline stage exited with a non-zero status code. Review the stage output and environment variables.";
            r.remediationScript = "# Inspect runner environment\nexport DEBUG=true\nprintenv | grep CI_";
        }
        return r;
    }

    private DiagnosticResult diagnoseDocker(String lower, String raw) {
        DiagnosticResult r = new DiagnosticResult();
        r.severity = "CRITICAL";

        if (lower.contains("oomkilled") || lower.contains("exit code 137") || lower.contains("137")) {
            r.failureStage = "Container Runtime (cgroup)";
            r.errorSummary = "Container terminated by Linux OS Kernel OOM-Killer (Exit Code 137: 128 + SIGKILL 9).";
            r.rootCause = """
### 🐳 Root Cause Analysis: Container Exit Code 137 (OOMKilled)
The container memory consumption surpassed its allocated cgroup limit (`deploy.resources.limits.memory`). The host kernel invoked the Out-Of-Memory (OOM) Killer to safeguard host stability.

#### 🔎 Diagnostic Observations:
- **Signal**: SIGKILL (`kill -9`) sent directly by host kernel (cannot be trapped by application).
- **Common Trigger**: JVM Heap exhaustion, unconstrained memory buffers, or Node.js memory leaks.
""";
            r.remediationScript = """
# 1. Inspect container exit state & OOM flag
docker inspect <container_id_or_name> --format='{{json .State}}' | jq '{OOMKilled: .OOMKilled, ExitCode: .ExitCode}'

# 2. Increase container memory limit in docker-compose.yml:
# services:
#   backend:
#     deploy:
#       resources:
#         limits:
#           memory: 1024M

# 3. For Java applications, enforce container-aware JVM memory ratios:
# ENTRYPOINT ["java", "-XX:InitialRAMPercentage=40.0", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
""";
        } else if (lower.contains("bind: address already in use") || lower.contains("address already in use")) {
            r.failureStage = "Network Port Binding";
            r.errorSummary = "Host port collision: Target TCP port is already held by another running process or container.";
            r.rootCause = """
### 🐳 Root Cause Analysis: Host Port Conflict (EADDRINUSE)
Docker daemon attempted to bind a container port to the host interface, but the specified port is already open and held by another local process (e.g. host PostgreSQL, Nginx, or orphan container).
""";
            r.remediationScript = """
# 1. Find the process PID occupying the port (e.g. port 5432 or 8080)
# On Linux/macOS:
lsof -i :5432
# On Windows (PowerShell):
Get-NetTCPConnection -LocalPort 5432 | Select-Object OwningProcess

# 2. Stop conflicting background containers
docker compose down --remove-orphans

# 3. Terminate rogue local process if necessary
kill -9 <PID>
""";
        } else if (lower.contains("permission denied") && lower.contains("docker.sock")) {
            r.failureStage = "Docker Daemon Access";
            r.errorSummary = "Unix socket permission denied: current user is not a member of the 'docker' system group.";
            r.rootCause = """
### 🐳 Root Cause Analysis: Docker Socket Access Denied
The application/user attempted to access `/var/run/docker.sock` without sufficient group permissions. By default, only `root` and users in the `docker` group can communicate with the Docker daemon API.
""";
            r.remediationScript = """
# 1. Add current user to docker group
sudo usermod -aG docker $USER

# 2. Apply new group membership without logging out
newgrp docker

# 3. Verify Docker access without sudo
docker ps
""";
        } else {
            r.failureStage = "Docker Build / Run";
            r.errorSummary = "Docker build or runtime failure.";
            r.rootCause = "Docker daemon encountered an error during image build or container initialization.";
            r.remediationScript = "docker compose logs --tail=50 -f";
        }
        return r;
    }

    private DiagnosticResult diagnoseKubernetes(String lower, String raw) {
        DiagnosticResult r = new DiagnosticResult();
        r.severity = "CRITICAL";

        if (lower.contains("crashloopbackoff")) {
            r.failureStage = "Pod Container Runtime";
            r.errorSummary = "Kubernetes CrashLoopBackOff: Container starts, crashes, and restarts in an exponential backoff loop.";
            r.rootCause = """
### ☸️ Root Cause Analysis: Kubernetes `CrashLoopBackOff`
The container process repeatedly terminated with a non-zero exit code. Kubernetes kubelet is waiting with exponential backoff delay (10s, 20s, 40s... up to 5 minutes) before attempting another restart.

#### 🔎 Diagnostic Observations:
- **Typical Causes**: Unset mandatory environment variables, missing database connectivity, failing liveness probe, or missing entrypoint executable.
""";
            r.remediationScript = """
# 1. Check previous crashed container logs (CRITICAL)
kubectl logs <pod-name> -n <namespace> --previous

# 2. Inspect pod termination reasons & events
kubectl describe pod <pod-name> -n <namespace>

# 3. Check if liveness/readiness probe timeout is too aggressive
# Add initialDelaySeconds: 30 to allow startup time
""";
        } else if (lower.contains("imagepullbackoff") || lower.contains("errimagepull")) {
            r.failureStage = "Image Registry Pull";
            r.errorSummary = "Kubernetes ImagePullBackOff: Kubelet failed to pull container image from container registry.";
            r.rootCause = """
### ☸️ Root Cause Analysis: Kubernetes `ImagePullBackOff`
Kubelet cannot retrieve the specified container image. Either the image repository/tag does not exist, the repository is private and `imagePullSecrets` is missing, or rate limits were exceeded on Docker Hub.
""";
            r.remediationScript = """
# 1. Verify image pull error details
kubectl describe pod <pod-name> -n <namespace> | grep -A 5 -B 2 "Events:"

# 2. Create registry secret if image is in private repository
kubectl create secret docker-registry regcred \\
  --docker-server=https://index.docker.io/v1/ \\
  --docker-username=<user> \\
  --docker-password=<token> \\
  --docker-email=<email> -n <namespace>

# 3. Attach secret in deployment spec:
# spec:
#   imagePullSecrets:
#   - name: regcred
""";
        } else {
            r.failureStage = "Kubernetes Cluster State";
            r.errorSummary = "Kubernetes cluster resource or scheduling anomaly.";
            r.rootCause = "Kubernetes control plane or worker node encountered a resource allocation or networking issue.";
            r.remediationScript = "kubectl get events --sort-by='.metadata.creationTimestamp' -A";
        }
        return r;
    }

    private static class DiagnosticResult {
        String failureStage = "Pipeline Stage";
        String errorSummary = "";
        String rootCause = "";
        String severity = "HIGH";
        String remediationScript = "";
    }
}
