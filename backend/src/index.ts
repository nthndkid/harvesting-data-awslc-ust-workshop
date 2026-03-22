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
import commentRoutes from './routes/comments'
import likeRoutes from './routes/likes'

const app = new OpenAPIHono()

// ─── CORS ─────────────────────────────────────────────────────────────────────
// x-user-id must be in allowHeaders — the frontend sends it on every request
// so the backend can identify who triggered each DynamoDB audit log entry
app.use('*', cors({
  origin: 'http://localhost:5173',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'x-user-id'],
}))

// ─── OpenAPI spec ─────────────────────────────────────────────────────────────
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'ProjectHub API',
    description: 'API for ProjectHub Polyglot Persistence workshop. Copy your UUID from the Auth route and paste it into the x-user-id header.',
  },
})

// Register x-user-id as a global security scheme in Swagger UI
app.openAPIRegistry.registerComponent('securitySchemes', 'UserIdHeader', {
  type: 'apiKey',
  in: 'header',
  name: 'x-user-id',
  description: 'Your User ID from POST /auth/register or /auth/login. Required for write operations.',
})

// ─── Swagger UI ───────────────────────────────────────────────────────────────
app.get('/swagger', swaggerUI({ url: '/doc' }))

// ─── Routes ───────────────────────────────────────────────────────────────────
app.route('/auth', authRoutes)
app.route('/projects', projectRoutes)
app.route('/projects', commentRoutes)   // → /projects/:id/comments
app.route('/projects', likeRoutes)      // → /projects/:id/like
app.route('/uploads', uploadRoutes)
app.route('/admin', adminRoutes)

// ─── AppType export ───────────────────────────────────────────────────────────
// Lets the frontend import types directly from the backend if needed
// import type { AppType } from '../../../backend/src/index'
export type AppType = typeof app

// ─── Bun server ───────────────────────────────────────────────────────────────
export default {
  port: 3000,
  fetch: app.fetch,
}