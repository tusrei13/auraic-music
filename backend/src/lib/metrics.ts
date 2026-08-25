import client from 'prom-client'

// Create a Registry which registers the metrics
export const register = new client.Registry()

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'auraic-backend',
  env: process.env.NODE_ENV || 'development'
})

// Enable collection of default metrics (CPU, Memory, Event Loop Lag, GC, etc.)
client.collectDefaultMetrics({ register, prefix: 'auraic_' })

// HTTP Request Duration Histogram (for p50, p95, p99 SLO monitoring)
export const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.2, 0.3, 0.5, 1, 2, 5],
  registers: [register]
})

// Total HTTP Requests Counter
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
})

// Active In-Flight Requests Gauge
export const activeRequestsGauge = new client.Gauge({
  name: 'http_active_requests',
  help: 'Number of active HTTP requests currently being handled',
  registers: [register]
})

// Database Query Duration Histogram
export const dbQueryDurationSeconds = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['model', 'action', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register]
})

// External Jamendo API Request Latency & Status
export const jamendoApiDurationSeconds = new client.Histogram({
  name: 'jamendo_api_duration_seconds',
  help: 'Duration of external Jamendo API calls in seconds',
  labelNames: ['endpoint', 'status'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1, 2, 5],
  registers: [register]
})

// Audio Streaming Latency & Time to First Audio
export const streamTimeToFirstAudioSeconds = new client.Histogram({
  name: 'stream_time_to_first_audio_seconds',
  help: 'Time to first audio stream chunk in seconds',
  labelNames: ['source'],
  buckets: [0.1, 0.25, 0.5, 1, 2, 3, 5],
  registers: [register]
})
