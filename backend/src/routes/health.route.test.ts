import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import healthRoutes from './health.route'

describe('Health & Metrics Routes', () => {
  const app = express()
  app.use(express.json())
  app.use('/', healthRoutes)

  it('GET /healthz returns ok and uptime', async () => {
    const res = await request(app).get('/healthz')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.timestamp).toBeDefined()
    expect(res.body.uptime).toBeTypeOf('number')
  })

  it('GET /livez returns alive status', async () => {
    const res = await request(app).get('/livez')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('alive')
  })

  it('GET /metrics returns Prometheus formatted text metrics', async () => {
    const res = await request(app).get('/metrics')
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('text/plain')
    expect(res.text).toContain('http_request_duration_seconds')
    expect(res.text).toContain('http_requests_total')
  })
})
