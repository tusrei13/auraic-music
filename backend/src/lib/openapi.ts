import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import type { Express } from 'express'
import express from 'express'
import path from 'node:path'

const openapiSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Auraic API',
      version: '1.0.0',
      description: 'OpenAPI documentation for Auraic music streaming backend',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'Supabase Access Token',
        },
      },
      schemas: {
        Song: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            audioUrl: { type: 'string' },
            image: { type: 'string' },
            duration: { type: 'integer', nullable: true },
            artist: { type: 'object' },
            album: { type: 'object', nullable: true },
            genres: { type: 'array', items: { type: 'string' } },
            source: { type: 'string' },
            licenseUrl: { type: 'string', nullable: true },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                requestId: { type: 'string' },
                details: { type: 'object' },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/**/*.ts', './src/controllers/**/*.ts'],
})

const specPaths = (openapiSpec as any).paths || {}

const setupSpec = {
  ...openapiSpec,
  paths: specPaths,
}

const customCssPath = path.resolve('./src/lib/swagger-custom.css')

export function setupOpenAPI(app: Express) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(setupSpec, {
    explorer: true,
    customCssUrl: '/swagger-custom.css',
    customSiteTitle: 'Auraic API Docs',
    customfavIcon: '/favicon.ico',
  }))
  app.use('/swagger-custom.css', express.static(customCssPath))
  app.get('/docs.json', (req, res) => res.json(setupSpec))
}
