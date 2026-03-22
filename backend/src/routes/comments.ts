// ─────────────────────────────────────────────
// Comments Routes
// ─────────────────────────────────────────────

import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from '@hono/zod-openapi'
import { db } from '../db'
import { comments, users } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { logData } from '../lib/dynamo'
import { createCommentSchema, ErrorSchema, ProjectIdParamsSchema } from '../lib/validators'

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
    // RDS: query comments for a project with userName join
    const projectComments = await db.select({
      commentId: comments.commentId,
      projectId: comments.projectId,
      userId: comments.userId,
      body: comments.body,
      createdAt: comments.createdAt,
      userName: users.userName
    })
    .from(comments)
    .where(eq(comments.projectId, id))
    .leftJoin(users, eq(comments.userId, users.userId))
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
      content: { 'application/json': { schema: z.any() } }
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
    // 1. RDS: Insert comment
    const [newCommentData] = await db.insert(comments).values({
      projectId: id,
      userId,
      body
    }).returning()

    // 2. DynamoDB: log COMMENT CREATE
    await logData({
      userId,
      action: 'CREATE',
      resourceId: id,
      entityType: 'COMMENT'
    })

    // 3. Fetch full comment with userName to return to frontend
    const [fullComment] = await db.select({
      commentId: comments.commentId,
      projectId: comments.projectId,
      userId: comments.userId,
      body: comments.body,
      createdAt: comments.createdAt,
      userName: users.userName
    })
    .from(comments)
    .where(eq(comments.commentId, newCommentData.commentId))
    .leftJoin(users, eq(comments.userId, users.userId))

    return c.json(fullComment, 201)
  } catch (error) {
    console.error('POST /projects/:id/comments failed:', error)
    return c.json({ error: 'Failed to create comment' }, 500)
  }
})

export default router
