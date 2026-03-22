// ─────────────────────────────────────────────
// Admin Routes (Dashboard)
// ─────────────────────────────────────────────

import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from '@hono/zod-openapi'
import { db } from '../db'
import { projects, users, comments, likes } from '../db/schema'
import { sql, eq, desc } from 'drizzle-orm'

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

import { getS3Stats, getS3Objects } from '../lib/s3'
import { getAuditTrail } from '../lib/dynamo'

// GET /admin/projects
const adminProjectsRoute = createRoute({ method: 'get', path: '/projects', tags: ['Admin'], responses: { 200: { description: 'Admin projects', content: { 'application/json': { schema: z.array(z.any()) } } }, 500: { description: 'Error', content: { 'application/json': { schema: z.array(z.any()) } } } } })
router.openapi(adminProjectsRoute, async (c) => {
  try {
    const data = await db.select({
      id: projects.projectId,
      title: projects.title,
      description: projects.description,
      tags: projects.tags,
      demoUrl: projects.demoUrl,
      pdfKey: projects.pdfKey,
      coverImageKey: projects.coverImageKey,
      author: users.userName,
      createdAt: projects.createdAt,
      likes: sql<number>`(SELECT count(*) FROM likes WHERE likes.project_id = projects.projects_id)::int`,
      comments: sql<number>`(SELECT count(*) FROM comments WHERE comments.project_id = projects.projects_id)::int`
    }).from(projects).leftJoin(users, eq(projects.userId, users.userId)).orderBy(desc(projects.createdAt))
    return c.json(data, 200)
  } catch(e) { return c.json([{ error: 'DB Error' }], 500) }
})

// GET /admin/comments
const adminCommentsRoute = createRoute({ method: 'get', path: '/comments', tags: ['Admin'], responses: { 200: { description: 'Admin comments', content: { 'application/json': { schema: z.array(z.any()) } } }, 500: { description: 'Error', content: { 'application/json': { schema: z.array(z.any()) } } } } })
router.openapi(adminCommentsRoute, async (c) => {
  try {
    const data = await db.select({
      id: comments.commentId,
      projectId: comments.projectId,
      author: users.userName,
      body: comments.body,
      createdAt: comments.createdAt
    }).from(comments).leftJoin(users, eq(comments.userId, users.userId)).orderBy(desc(comments.createdAt))
    return c.json(data, 200)
  } catch(e) { return c.json([], 500) }
})

// GET /admin/likes
const adminLikesRoute = createRoute({ method: 'get', path: '/likes', tags: ['Admin'], responses: { 200: { description: 'Admin likes', content: { 'application/json': { schema: z.array(z.any()) } } }, 500: { description: 'Error', content: { 'application/json': { schema: z.array(z.any()) } } } } })
router.openapi(adminLikesRoute, async (c) => {
  try {
    const data = await db.select({
      id: likes.likeId,
      projectId: likes.projectId,
      projectTitle: projects.title,
      likedBy: users.userName,
      createdAt: likes.createdAt
    }).from(likes)
      .leftJoin(users, eq(likes.userId, users.userId))
      .leftJoin(projects, eq(likes.projectId, projects.projectId))
      .orderBy(desc(likes.createdAt))
    return c.json(data, 200)
  } catch(e) { return c.json([], 500) }
})

// GET /admin/s3-stats
const s3StatsRoute = createRoute({ method: 'get', path: '/s3-stats', tags: ['Admin'], responses: { 200: { description: 'S3 Stats', content: { 'application/json': { schema: z.any() } } } } })
router.openapi(s3StatsRoute, async (c) => {
  return c.json(await getS3Stats(), 200)
})

// GET /admin/s3-objects
const s3ObjectsRoute = createRoute({ method: 'get', path: '/s3-objects', tags: ['Admin'], responses: { 200: { description: 'S3 Objects', content: { 'application/json': { schema: z.array(z.any()) } } } } })
router.openapi(s3ObjectsRoute, async (c) => {
  return c.json(await getS3Objects(), 200)
})

// GET /admin/audit-trail
const auditTrailRoute = createRoute({ method: 'get', path: '/audit-trail', tags: ['Admin'], request: { query: z.object({ eventType: z.string().optional() }) }, responses: { 200: { description: 'Dynamo logs', content: { 'application/json': { schema: z.array(z.any()) } } } } })
router.openapi(auditTrailRoute, async (c) => {
  const { eventType } = c.req.valid('query')
  return c.json(await getAuditTrail(eventType), 200)
})

export default router
