// ─────────────────────────────────────────────
// Projects Routes + Comments + Likes
// ─────────────────────────────────────────────

import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from '@hono/zod-openapi'
import { db } from '../db'
import { projects } from '../db/schema'
import { eq } from 'drizzle-orm'
import { logAccess, logData } from '../lib/dynamo'
import { createProjectSchema, ProjectIdParamsSchema, ErrorSchema, SuccessMessageSchema } from '../lib/validators'
import { getPresignedUrl } from '../lib/s3'

// Export router securely

const router = new OpenAPIHono()

// GET /projects
const getProjectsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Projects'],
  responses: {
    200: {
      description: 'List all projects',
      content: { 'application/json': { schema: z.array(z.any()) } }
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: ErrorSchema } }
    }
  }
})

router.openapi(getProjectsRoute, async (c) => {
  try {
    // RDS: querying projects table
    const allProjects = await db.select().from(projects)
    
    // DynamoDB: database event log
    await logAccess({
      userId: c.req.header('x-user-id') || 'anonymous',
      action: 'LIST',
      resourceId: 'projects-feed'
    })

    return c.json(allProjects, 200)
  } catch (error) {
    console.error('GET /projects failed:', error)
    return c.json({ error: 'Failed to fetch projects' }, 500)
  }
})

// GET /projects/:id
const getProjectRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Projects'],
  request: { params: ProjectIdParamsSchema },
  responses: {
    200: {
      description: 'Get project details',
      content: { 'application/json': { schema: z.any() } }
    },
    404: {
      description: 'Project not found',
      content: { 'application/json': { schema: ErrorSchema } }
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: ErrorSchema } }
    }
  }
})

router.openapi(getProjectRoute, async (c) => {
  const { id } = c.req.valid('param')
  
  try {
    // RDS: querying projects table
    const [project] = await db.select().from(projects).where(eq(projects.projectId, id))
    
    if (!project) {
      return c.json({ error: 'Project not found' }, 404)
    }

    // DynamoDB: database event log
    await logAccess({
      userId: c.req.header('x-user-id') || 'anonymous',
      action: 'VIEW',
      resourceId: id
    })

    return c.json(project, 200)
  } catch (error) {
    console.error('GET /projects/:id failed:', error)
    return c.json({ error: 'Failed to fetch project' }, 500)
  }
})

// POST /projects
const createProjectRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Projects'],
  security: [{ UserIdHeader: [] }],
  request: {
    body: { content: { 'application/json': { schema: createProjectSchema } } }
  },
  responses: {
    201: {
      description: 'Project created',
      content: { 'application/json': { schema: z.any() } }
    },
    400: {
      description: 'Bad request',
      content: { 'application/json': { schema: ErrorSchema } }
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: ErrorSchema } }
    }
  }
})

router.openapi(createProjectRoute, async (c) => {
  const body = c.req.valid('json')
  
  try {
    // RDS: insert new project
    const [newProject] = await db.insert(projects).values({
      title: body.title,
      description: body.description,
      tags: body.tags,
      userId: body.userId,
      coverImageKey: body.coverImageKey,
      pdfKey: body.pdfKey,
      demoUrl: body.demoUrl
    }).returning()

    // DynamoDB: database event log
    await logData({
      userId: body.userId,
      action: 'CREATE',
      resourceId: newProject.projectId,
      entityType: 'PROJECT'
    })

    return c.json(newProject, 201)
  } catch (error) {
    console.error('POST /projects failed:', error)
    return c.json({ error: 'Failed to create project' }, 500)
  }
})

// DELETE /projects/:id
const deleteProjectRoute = createRoute({
  method: 'delete',
  path: '/{id}',
  tags: ['Projects'],
  security: [{ UserIdHeader: [] }],
  request: { params: ProjectIdParamsSchema },
  responses: {
    200: {
      description: 'Project deleted',
      content: { 'application/json': { schema: SuccessMessageSchema } }
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: ErrorSchema } }
    }
  }
})

router.openapi(deleteProjectRoute, async (c) => {
  const { id } = c.req.valid('param')
  const authUserId = c.req.header('x-user-id') || 'system'
  
  try {
    // RDS: delete project
    await db.delete(projects).where(eq(projects.projectId, id))
    
    // DynamoDB: database event log
    await logData({
      userId: authUserId,
      action: 'DELETE',
      resourceId: id,
      entityType: 'PROJECT'
    })

    return c.json({ message: 'Project deleted' }, 200)
  } catch (error) {
    console.error('DELETE /projects/:id failed:', error)
    return c.json({ error: 'Failed to delete project' }, 500)
  }
})

// GET /projects/:id/download-pdf
const downloadPdfRoute = createRoute({
  method: 'get',
  path: '/{id}/download-pdf',
  tags: ['Projects'],
  security: [{ UserIdHeader: [] }],
  request: { params: ProjectIdParamsSchema },
  responses: {
    200: {
      description: 'Presigned URL for PDF',
      content: { 'application/json': { schema: z.object({ url: z.string() }) } }
    },
    404: {
      description: 'Not found',
      content: { 'application/json': { schema: ErrorSchema } }
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: ErrorSchema } }
    }
  }
})

router.openapi(downloadPdfRoute, async (c) => {
  const { id } = c.req.valid('param')
  const authUserId = c.req.header('x-user-id') || 'anonymous'

  try {
    // RDS: Get project keys
    const [project] = await db.select().from(projects).where(eq(projects.projectId, id))
    if (!project || !project.pdfKey) {
      return c.json({ error: 'Project PDF not found' }, 404)
    }

    // S3: generating presigned URL
    const url = await getPresignedUrl(project.pdfKey)
    
    // DynamoDB: database event log
    await logAccess({
      userId: authUserId,
      action: 'DOWNLOAD',
      resourceId: id
    })

    return c.json({ url }, 200)
  } catch (error) {
    console.error('GET /projects/:id/download-pdf failed:', error)
    return c.json({ error: 'Failed to generate S3 URL' }, 500)
  }
})

// GET /projects/:id/cover
const getCoverRoute = createRoute({
  method: 'get',
  path: '/{id}/cover',
  tags: ['Projects'],
  security: [{ UserIdHeader: [] }],
  request: { params: ProjectIdParamsSchema },
  responses: {
    200: {
      description: 'Presigned URL for cover image',
      content: { 'application/json': { schema: z.object({ url: z.string() }) } }
    },
    404: {
      description: 'Not found',
      content: { 'application/json': { schema: ErrorSchema } }
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: ErrorSchema } }
    }
  }
})

router.openapi(getCoverRoute, async (c) => {
  const { id } = c.req.valid('param')
  const authUserId = c.req.header('x-user-id') || 'anonymous'

  try {
    // RDS: Get project keys
    const [project] = await db.select().from(projects).where(eq(projects.projectId, id))
    if (!project || !project.coverImageKey) {
      return c.json({ error: 'Project cover not found' }, 404)
    }

    // S3: generating presigned URL
    const url = await getPresignedUrl(project.coverImageKey)
    
    // DynamoDB: database event log
    await logAccess({
      userId: authUserId,
      action: 'VIEW_IMAGE',
      resourceId: id
    })

    return c.json({ url }, 200)
  } catch (error) {
    console.error('GET /projects/:id/cover failed:', error)
    return c.json({ error: 'Failed to generate S3 URL' }, 500)
  }
})

// Sub-routers for comments and likes are handled natively in index.ts
export default router
