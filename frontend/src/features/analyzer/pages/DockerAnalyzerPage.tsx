import { AnalyzerPreset, AnalyzerWorkspace } from "../components/AnalyzerWorkspace"

const PRESETS: AnalyzerPreset[] = [
  { name: "Exit code 137 (OOMKilled)", desc: "Linux cgroup memory limit exceeded", log: `forgeops-backend-1 exited with code 137
[2026-08-06 18:22:04] [kernel] Out of memory: Killed process 4129 (java) total-vm:2048564kB, anon-rss:1048576kB
[2026-08-06 18:22:04] [containerd] task /docker/4129: exit status 137: SIGKILL received from kernel OOM killer
Container forgeops-backend died unexpectedly.` },
  { name: "Port 5432 conflict", desc: "Bind address already in use", log: `Error response from daemon: driver failed programming external connectivity on endpoint forgeops-postgres:
Error starting userland proxy: listen tcp 0.0.0.0:5432: bind: address already in use
[ERROR] docker-compose up failed for service 'postgres'.` },
  { name: "Docker socket permission denied", desc: "Non-root user missing Docker group", log: `permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock:
Get "http://%2Fvar%2Frun%2Fdocker.sock/v1.24/containers/json": dial unix /var/run/docker.sock: connect: permission denied
fatal: unable to inspect running containers.` },
]

export function DockerAnalyzerPage() {
  return <AnalyzerWorkspace title="Docker" description="Diagnose container lifecycle, resource, networking, and daemon failures." targetType="DOCKER" analysisTitle="Docker Container Runtime Fault" presets={PRESETS} inputLabel="Docker daemon or container log" placeholder="Paste Docker Compose logs, daemon errors, or exit traces…" actionLabel="Analyze container" />
}
