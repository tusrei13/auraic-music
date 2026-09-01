import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes, defaultResource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { trace } from '@opentelemetry/api'

const serviceName = process.env.OTEL_SERVICE_NAME || 'auraic-backend'
const serviceVersion = process.env.OTEL_SERVICE_VERSION || '0.1.0'
const environment = process.env.NODE_ENV || 'development'

const exporterEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT

const traceExporter = exporterEndpoint
  ? new OTLPTraceExporter({ url: exporterEndpoint })
  : new (class ConsoleTraceExporter {
      export(spans: any, onDone?: (result: any) => void) {
        for (const span of spans) {
          console.log(
            JSON.stringify({
              traceId: span.spanContext().traceId,
              spanId: span.spanContext().spanId,
              parentSpanId: span.parentSpanId,
              name: span.name,
              kind: span.kind,
              startTime: span.startTime,
              endTime: span.endTime,
              attributes: Object.fromEntries(span.attributes),
              status: span.status,
            }),
            null,
            2
          )
        }
        if (onDone) onDone({ code: 0 })
      }
      shutdown() {
        return Promise.resolve()
      }
    })()

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
  }),
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
})

let initialized = false

export function setupTracing() {
  if (initialized) return
  try {
    sdk.start()
    initialized = true
    console.log(`OpenTelemetry tracing initialized for ${serviceName} (${environment})`)
  } catch (error) {
    console.error('Failed to initialize OpenTelemetry tracing:', error)
  }
}

export async function shutdownTracing() {
  if (!initialized) return
  try {
    await sdk.shutdown()
    initialized = false
  } catch (error) {
    console.error('Error shutting down OpenTelemetry tracing:', error)
  }
}

export function getTracer(name = 'auraic') {
  return trace.getTracer(name)
}
