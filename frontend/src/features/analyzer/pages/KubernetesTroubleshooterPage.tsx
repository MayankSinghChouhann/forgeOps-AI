import { AnalyzerPreset, AnalyzerWorkspace } from "../components/AnalyzerWorkspace"

const PRESETS: AnalyzerPreset[] = [
  { name: "CrashLoopBackOff", desc: "Repeated container crash and restart backoff", log: `NAME                               READY   STATUS             RESTARTS      AGE
forgeops-backend-7d9c8b746-9k2px   0/1     CrashLoopBackOff   6 (90s ago)   14m

Events:
  Type     Reason     Age                  From               Message
  Normal   Scheduled  14m                  default-scheduler  Successfully assigned default/forgeops-backend to node-ap-south-1a
  Normal   Started    14m                  kubelet            Started container backend
  Warning  BackOff    2m (x32 over 13m)    kubelet            Back-off restarting failed container backend` },
  { name: "ImagePullBackOff", desc: "Private registry authentication or missing tag", log: `NAME                                READY   STATUS             RESTARTS   AGE
forgeops-frontend-5b4d96c88-m8k2l   0/1     ImagePullBackOff   0          4m

Events:
  Type     Reason   Age   From     Message
  Normal   Pulling  2m    kubelet  Pulling image "private-registry.forgeops.ai/forgeops/frontend:v2.1.0"
  Warning  Failed   2m    kubelet  unauthorized: authentication required
  Warning  Failed   105s  kubelet  Error: ImagePullBackOff` },
  { name: "Pod scheduling failure", desc: "Insufficient memory across available nodes", log: `NAME                          READY   STATUS    RESTARTS   AGE
analytics-worker-674b-xv9pq   0/1     Pending   0          8m

Events:
  Type     Reason            Age   From               Message
  Warning  FailedScheduling  8m    default-scheduler  0/3 nodes are available: 3 Insufficient memory. No preemption victims found.` },
]

export function KubernetesTroubleshooterPage() {
  return <AnalyzerWorkspace title="Kubernetes" description="Inspect workload events, scheduling failures, and pod lifecycle anomalies." targetType="KUBERNETES" analysisTitle="Kubernetes Cluster / Pod Incident" presets={PRESETS} inputLabel="kubectl describe or event stream" placeholder="Paste kubectl describe output or cluster events…" actionLabel="Analyze workload" />
}
