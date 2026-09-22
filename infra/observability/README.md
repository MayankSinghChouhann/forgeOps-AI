# ForgeOps observability

The optional Docker Compose `observability` profile runs Prometheus and Grafana.
Prometheus scrapes the authenticated Spring Boot endpoint every 15 seconds, and
Grafana provisions the data source and **ForgeOps AI Overview** dashboard on
startup.

1. Copy `infra/docker/.env.example` to `infra/docker/.env` and replace every
   placeholder, including the metrics and Grafana passwords.
2. Start the full stack:

   ```bash
   docker compose --env-file infra/docker/.env \
     -f infra/docker/docker-compose.yml --profile observability up --build -d
   ```

3. Open Grafana at <http://localhost:3001> and sign in as `admin` with the
   configured `GRAFANA_ADMIN_PASSWORD`. Prometheus is available at
   <http://localhost:9090>.

The application accepts the dedicated monitoring credentials only on
`/actuator/prometheus`. Normal API routes continue to require JWT access tokens.
