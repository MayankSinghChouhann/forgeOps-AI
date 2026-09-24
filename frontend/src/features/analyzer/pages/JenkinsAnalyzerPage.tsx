import { AnalyzerPreset, AnalyzerWorkspace } from "../components/AnalyzerWorkspace"

const PRESETS: AnalyzerPreset[] = [
  { name: "Maven compilation failure", desc: "Java symbol error and compiler plugin failure", log: `[INFO] --- maven-compiler-plugin:3.11.0:compile (default-compile) @ forgeops-backend ---
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 24 source files to /app/target/classes
[ERROR] /app/src/main/java/com/forgeops/backend/auth/service/AuthService.java:[42,18] cannot find symbol
  symbol:   method generateRefreshToken(com.forgeops.backend.auth.entity.User)
  location: class com.forgeops.backend.auth.security.JwtUtils
[ERROR] /app/src/main/java/com/forgeops/backend/assistant/service/AssistantService.java:[89,31] incompatible types: java.lang.String cannot be converted to java.util.UUID
[INFO] 2 errors
[ERROR] COMPILATION ERROR:
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-compiler-plugin:3.11.0:compile on project forgeops-backend: Compilation failure` },
  { name: "NPM ERESOLVE peer conflict", desc: "Incompatible dependency resolution tree", log: `npm ERR! code ERESOLVE
npm ERR! ERESOLVE could not resolve
npm ERR! While resolving: @tailwindcss/vite@4.0.0
npm ERR! Found: vite@5.4.14
npm ERR! Could not resolve dependency:
npm ERR! peer vite@"^6.0.0" from @tailwindcss/vite@4.0.0
npm ERR! Fix the upstream dependency conflict, or retry this command with --force or --legacy-peer-deps` },
  { name: "Git SSH authentication error", desc: "CI/CD runner missing deploy key or credentials", log: `Cloning into 'forgeops-production-manifests'...
Warning: Permanently added 'github.com' (ED25519) to the list of known hosts.
git@github.com: Permission denied (publickey).
fatal: Could not read from remote repository.
Please make sure you have the correct access rights and the repository exists.
ERROR: Job failed: exit code 128` },
]

export function JenkinsAnalyzerPage() {
  return <AnalyzerWorkspace title="Log Analyzer" description="Investigate CI/CD failures with structured root-cause analysis and actionable remediation." targetType="JENKINS" analysisTitle="CI/CD Pipeline Log Analysis" presets={PRESETS} inputLabel="Raw CI/CD console log" placeholder="Paste Jenkins, GitHub Actions, or GitLab CI logs…" actionLabel="Analyze log" />
}
