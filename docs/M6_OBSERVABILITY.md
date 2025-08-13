### M6 — Observability (Intermediate)

This guide shows how to enable tracing (OTEL) and use metrics already exposed by the API.

### Metrics

- API exposes Prometheus metrics at `GET /metrics`.
- Includes basic HTTP counters and latency histogram with labels: method, route, status.

### Tracing (OpenTelemetry)

- The API includes an optional OTEL setup. It is disabled by default to avoid local overhead.
- Enable by setting in `.env` (root):
  - `OTEL_TRACES_ENABLED=true`
  - `OTEL_SERVICE_NAME=rbac-api` (optional)
  - `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces` (default)
  - `OTEL_EXPORTER_OTLP_HEADERS=` (optional key=value pairs)

Restart the API after changes.

### Local stack (optional)

You can run an observability stack locally (Prometheus, Loki, Tempo, Grafana). This template does not ship it enabled by default. If desired, add it to `infra/docker-compose.yml` and point OTEL exporter to the Tempo/Jaeger endpoint.
