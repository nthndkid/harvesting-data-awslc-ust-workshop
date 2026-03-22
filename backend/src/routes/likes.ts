// ─────────────────────────────────────────────
// Likes Routes
// ─────────────────────────────────────────────

import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from '@hono/zod-openapi'
import { db } from '../db'
import { likes } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { logData } from '../lib/dynamo'
import { ErrorSchema, ProjectIdParamsSchema, SuccessMessageSchema } from '../lib/validators'

const router = new OpenAPIHono()

// POST body for like actions (assuming we need userId)
const LikeSchema = z.object({
  userId: z.string().uuid()
}).openapi('LikeRequest')

// POST /projects/:id/like (toggle)
const toggleLikeRoute = createRoute({
  method: 'post',
  path: '/{id}/like',
  tags: ['Likes'],
  security: [{ UserIdHeader: [] }],
  request: { 
    params: ProjectIdParamsSchema,
    body: { content: { 'application/json': { schema: LikeSchema } } }
  },
  responses: {
    200: {
      description: 'Like toggled',
      content: { 'application/json': { schema: SuccessMessageSchema } }
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: ErrorSchema } }
    }
  }
})

router.openapi(toggleLikeRoute, async (c) => {
  const { id } = c.req.valid('param')
  const { userId } = c.req.valid('json')
  
  try {
    // RDS: check if like exists
    const [existing] = await db.select().from(likes)
      .where(and(eq(likes.projectId, id), eq(likes.userId, userId)))

    if (existing) {
      // Unlike
      await db.delete(likes).where(eq(likes.likeId, existing.likeId))
      
      // DynamoDB: database event log
      await logData({
        userId,
        action: 'UNLIKE',
        resourceId: id,
        entityType: 'LIKE'
      })
      
      return c.json({ message: 'Unliked' }, 200)
    } else {
      // Like
      await db.insert(likes).values({ projectId: id, userId })
      
      // DynamoDB: database event log
      await logData({
        userId,
        action: 'LIKE',
        resourceId: id,
        entityType: 'LIKE'
      })
      
      return c.json({ message: 'Liked' }, 200)
    }
  } catch (error) {
    console.error('POST /projects/:id/like failed:', error)
    return c.json({ error: 'Failed to toggle like' }, 500)
  }
})

export default router
