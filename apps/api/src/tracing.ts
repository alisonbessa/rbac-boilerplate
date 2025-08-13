import { createRequire } from 'node:module';

const tracesEnabled = String(process.env.OTEL_TRACES_ENABLED || '').toLowerCase() === 'true';

if (tracesEnabled) {
  const require = createRequire(import.meta.url);
  const { NodeSDK } = require('@opentelemetry/sdk-node');
  const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
  const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
  const { Resource } = require('@opentelemetry/resources');
  const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

  const serviceName = process.env.OTEL_SERVICE_NAME || 'rbac-api';
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces';
  const headers = process.env.OTEL_EXPORTER_OTLP_HEADERS || '';

  const exporter = new OTLPTraceExporter({ url: endpoint, headers });
  const sdk = new NodeSDK({
    traceExporter: exporter,
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  void sdk.start();
  const shutdown = async () => {
    try {
      await sdk.shutdown();
    } catch {
      void 0;
    }
  };
  process.once('beforeExit', () => void shutdown());
  process.once('SIGTERM', () => void shutdown());
  process.once('SIGINT', () => void shutdown());
}
