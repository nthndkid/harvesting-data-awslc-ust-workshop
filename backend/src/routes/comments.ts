// ─────────────────────────────────────────────
// Comments Routes
// ─────────────────────────────────────────────

import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from '@hono/zod-openapi'
import { db } from '../db'
import { comments } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { logData } from '../lib/dynamo'
import { createCommentSchema, ErrorSchema, ProjectIdParamsSchema, SuccessMessageSchema } from '../lib/validators'

const router = new OpenAPIHono()

// GET /projects/:id/comments
const getCommentsRoute = createRoute({
  method: 'get',
  path: '/{id}/comments',
  tags: ['Comments'],
  request: { params: ProjectIdParamsSchema },
  responses: {
    200: {
      description: 'List comments',
      content: { 'application/json': { schema: z.array(z.any()) } }
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: ErrorSchema } }
    }
  }
})

router.openapi(getCommentsRoute, async (c) => {
  const { id } = c.req.valid('param')
  try {
    // RDS: query comments for a project
    const projectComments = await db.select().from(comments)
      .where(eq(comments.projectId, id))
      .orderBy(desc(comments.createdAt))

    return c.json(projectComments, 200)
  } catch (error) {
    console.error('GET /projects/:id/comments failed:', error)
    return c.json({ error: 'Failed to find comments' }, 500)
  }
})

// POST /projects/:id/comments
const createCommentRoute = createRoute({
  method: 'post',
  path: '/{id}/comments',
  tags: ['Comments'],
  security: [{ UserIdHeader: [] }],
  request: { 
    params: ProjectIdParamsSchema,
    body: { content: { 'application/json': { schema: createCommentSchema } } }
  },
  responses: {
    201: {
      description: 'Comment created',
      content: { 'application/json': { schema: SuccessMessageSchema } }
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: ErrorSchema } }
    }
  }
})

router.openapi(createCommentRoute, async (c) => {
  const { id } = c.req.valid('param')
  const { body, userId } = c.req.valid('json')
  
  try {
    // RDS: Insert comment
    await db.insert(comments).values({
      projectId: id,
      userId,
      body
    })

    // DynamoDB: log COMMENT CREATE
    await logData({
      userId,
      action: 'CREATE',
      resourceId: id,
      entityType: 'COMMENT'
    })

    return c.json({ message: 'Comment created' }, 201)
  } catch (error) {
    console.error('POST /projects/:id/comments failed:', error)
    return c.json({ error: 'Failed to create comment' }, 500)
  }
})

export default router
