# Kubernetes deployment

These manifests create the `forgeops` namespace, PostgreSQL, Redis, two-replica
backend and frontend deployments, a backend HPA, services, and an NGINX ingress.
Secret values are deliberately not stored in Git.

Before applying, replace `forgeops.example.com` in `configmap.yaml` and
`ingress.yaml`, configure the `forgeops-tls` TLS secret, and create the runtime
secret:

```bash
kubectl create namespace forgeops --dry-run=client -o yaml | kubectl apply -f -
kubectl -n forgeops create secret generic forgeops-secrets \
  --from-literal=postgres-password='<strong-password>' \
  --from-literal=redis-password='<strong-password>' \
  --from-literal=jwt-secret='<base64-encoded-256-bit-secret>' \
  --from-literal=metrics-password='<strong-monitoring-password>' \
  --from-literal=gemini-api-key='<optional-key>'
```

Apply and inspect the rollout:

```bash
kubectl apply -k infra/k8s
kubectl -n forgeops rollout status statefulset/postgres
kubectl -n forgeops rollout status deployment/backend
kubectl -n forgeops rollout status deployment/frontend
```

The cluster must provide an NGINX ingress controller, a default StorageClass,
and Metrics Server for HPA metrics. For production, use a managed PostgreSQL and
Redis service or add backup and high-availability policies to the bundled
single-node data services.
