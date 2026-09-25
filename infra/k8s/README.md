# Kubernetes deployment baseline

These Kustomize manifests create the `forgeops` namespace, single-instance
PostgreSQL and Redis workloads, two-replica backend and frontend deployments,
the backend HPA, Services, TLS ingress, PodDisruptionBudgets, and data-service
NetworkPolicies. Secret values are deliberately not stored in Git. This is a
deployment baseline, not a complete production AWS/EKS architecture: the bundled
database/cache do not provide managed-service HA or a backup/restore plan.

Before applying, replace `forgeops.example.com` in `configmap.yaml` and
`ingress.yaml`, configure `forgeops-tls` and an ingress controller, confirm the
cluster's NetworkPolicy-capable CNI and Metrics Server, and create the runtime
secret. Use newly rotated values from a secure secret manager; never commit
real values or paste them into chat:

```bash
kubectl create namespace forgeops --dry-run=client -o yaml | kubectl apply -f -
kubectl -n forgeops create secret generic forgeops-secrets \
  --from-literal=postgres-password='<strong-password>' \
  --from-literal=redis-password='<strong-password>' \
  --from-literal=jwt-secret='<base64-encoded-256-bit-secret>' \
  --from-literal=metrics-password='<strong-monitoring-password>' \
  --from-literal=gemini-api-key='<optional-key>'
```

The sample currently points the backend at the in-cluster `postgres` and
`redis` services. For production, first change the ConfigMap and service
configuration to managed PostgreSQL and Redis endpoints, and configure cloud
secret-manager delivery, verified database backups/restores, TLS/DNS, ingress
health checks, alerts, and distributed rate limiting. The application's IP
rate limiter is in-process and is not sufficient by itself across replicas.

Validate and inspect the rollout:

```bash
kubectl kustomize infra/k8s > /dev/null
kubectl apply -k infra/k8s
kubectl -n forgeops rollout status statefulset/postgres
kubectl -n forgeops rollout status deployment/backend
kubectl -n forgeops rollout status deployment/frontend
```

The cluster must provide an NGINX ingress controller, a default StorageClass,
and Metrics Server for HPA metrics. The NetworkPolicies only take effect with a
supporting CNI. The PodDisruptionBudgets require at least one healthy replica
while draining; ensure the cluster has enough capacity and replicas across
failure domains. Do not enable the repository's gated deployment workflow until
the target cluster and all production dependencies have been configured and
verified in staging.
