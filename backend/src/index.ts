// ─────────────────────────────────────────────
// Hono App Entry Point (with OpenAPI & Swagger)
// ─────────────────────────────────────────────

import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { swaggerUI } from '@hono/swagger-ui'

import authRoutes from './routes/auth'
import projectRoutes from './routes/projects'
import uploadRoutes from './routes/uploads'
import adminRoutes from './routes/admin'

const app = new OpenAPIHono()

// Allow requests from the Vue frontend
app.use('*', cors({ origin: 'http://localhost:5173' }))

// Setup OpenAPI specification
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'ProjectHub API',
    description: 'API for ProjectHub Polyglot Persistence workshop. Remember to copy your UUID from the Auth route and place it where needed.',
  },
})

// Register the UserId as a global security header parameter in Swagger UI
app.openAPIRegistry.registerComponent('securitySchemes', 'UserIdHeader', {
  type: 'apiKey',
  in: 'header',
  name: 'x-user-id',
  description: 'Provide your User ID to authenticate your actions (Optional for reading, Required for most writing)'
})

// Setup Swagger UI route
app.get('/swagger', swaggerUI({ url: '/doc' }))

// Register route groups
app.route('/auth', authRoutes)
app.route('/projects', projectRoutes)
app.route('/uploads', uploadRoutes)
app.route('/admin', adminRoutes)

export default {
  port: 3000,
  fetch: app.fetch,
}
