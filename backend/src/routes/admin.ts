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

export default router
