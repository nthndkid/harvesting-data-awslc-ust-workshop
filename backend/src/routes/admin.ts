// ─────────────────────────────────────────────
// Admin Routes (Dashboard)
// ─────────────────────────────────────────────

import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from '@hono/zod-openapi'
import { db } from '../db'
import { projects, users } from '../db/schema'
import { sql } from 'drizzle-orm'

const router = new OpenAPIHono()

// GET /admin/stats
const statsRoute = createRoute({
  method: 'get',
  path: '/stats',
  tags: ['Admin'],
  responses: {
    200: {
      description: 'Dashboard stats',
      content: { 'application/json': { schema: z.any() } }
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: z.object({ error: z.string() }) } }
    }
  }
})

router.openapi(statsRoute, async (c) => {
  try {
    // RDS: aggregate query
    const [projectCountResult] = await db.select({ value: sql<number>`count(*)::int` }).from(projects)
    const [userCountResult] = await db.select({ value: sql<number>`count(*)::int` }).from(users)
    
    return c.json({
      projectCount: projectCountResult.value,
      userCount: userCountResult.value
    }, 200)
  } catch (error) {
    console.error('GET /admin/stats failed:', error)
    return c.json({ error: 'Failed to retrieve stats' }, 500)
  }
})

// GET /admin/health
const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['Admin'],
  responses: {
    200: {
      description: 'Workshop service connections status',
      content: { 'application/json': { 
        schema: z.object({
          rds: z.boolean(),
          s3: z.boolean(),
          dynamodb: z.boolean()
        }).openapi('HealthStatusResponse')
      }}
    }
  }
})

import { checkRDSConnection } from '../db'
import { checkS3Connection } from '../lib/s3'
import { checkDynamoConnection } from '../lib/dynamo'

router.openapi(healthRoute, async (c) => {
  // Check all 3 services concurrently
  const [rds, s3, dynamodb] = await Promise.all([
    checkRDSConnection(),
    checkS3Connection(),
    checkDynamoConnection()
  ])

  return c.json({ rds, s3, dynamodb }, 200)
})

export default router
