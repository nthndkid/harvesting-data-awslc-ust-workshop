// ─────────────────────────────────────────────
// Projects Routes + Comments + Likes
// ─────────────────────────────────────────────

import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from '@hono/zod-openapi'
import { db } from '../db'
import { eq, sql } from 'drizzle-orm'
import { users, projects, likes, comments as commentsTable } from '../db/schema'
import { logAccess, logData } from '../lib/dynamo'
import { createProjectSchema, ProjectIdParamsSchema, ErrorSchema, SuccessMessageSchema, CreateProjectMultipartSchema } from '../lib/validators'
import { getPresignedUrl, uploadToS3 } from '../lib/s3'
import { randomUUID } from 'crypto'

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
    // RDS: querying projects table with JOINs and Aggregations
    // Using a more complex query to get userName, likesCount and commentsCount
    const allProjects = await db.select({
      projectId: projects.projectId,
      title: projects.title,
      description: projects.description,
      tags: projects.tags,
      demoUrl: projects.demoUrl,
      coverImageKey: projects.coverImageKey,
      pdfKey: projects.pdfKey,
      createdAt: projects.createdAt,
      userId: projects.userId,
      userName: users.userName,
      likesCount: sql<number>`(SELECT count(*) FROM ${likes} WHERE ${likes.projectId} = ${projects.projectId})`.mapWith(Number),
      commentsCount: sql<number>`(SELECT count(*) FROM ${commentsTable} WHERE ${commentsTable.projectId} = ${projects.projectId})`.mapWith(Number)
    })
    .from(projects)
    .leftJoin(users, eq(projects.userId, users.userId))
    
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
    // RDS: querying projects table with JOIN
    const [project] = await db.select({
      projectId: projects.projectId,
      title: projects.title,
      description: projects.description,
      tags: projects.tags,
      demoUrl: projects.demoUrl,
      coverImageKey: projects.coverImageKey,
      pdfKey: projects.pdfKey,
      createdAt: projects.createdAt,
      userId: projects.userId,
      userName: users.userName,
      likesCount: sql<number>`(SELECT count(*) FROM ${likes} WHERE ${likes.projectId} = ${projects.projectId})`.mapWith(Number),
      commentsCount: sql<number>`(SELECT count(*) FROM ${commentsTable} WHERE ${commentsTable.projectId} = ${projects.projectId})`.mapWith(Number)
    })
    .from(projects)
    .where(eq(projects.projectId, id))
    .leftJoin(users, eq(projects.userId, users.userId))
    
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
    body: { 
      content: { 
        'application/json': { schema: createProjectSchema },
        'multipart/form-data': { schema: CreateProjectMultipartSchema }
      } 
    }
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
  try {
    const contentType = c.req.header('content-type')
    let projectData: any
    let coverFile: File | undefined
    let pdfFile: File | undefined

    if (contentType?.includes('multipart/form-data')) {
      // 🚀 ATOMIC: Handled here if multipart data sent
      const body = await c.req.parseBody()
      
      // Step 1: Pre-validate metadata before S3 uploads
      const validation = CreateProjectMultipartSchema.safeParse(body)
      if (!validation.success) {
        const fieldErrors = validation.error.flatten().fieldErrors
        const firstErrorKey = Object.keys(fieldErrors)[0]
        const firstErrorMessage = fieldErrors[firstErrorKey as keyof typeof fieldErrors]?.[0]
        return c.json({ error: `${firstErrorKey}: ${firstErrorMessage}` || 'Validation failed' }, 400)
      }
      
      projectData = validation.data
      coverFile = body.coverFile as File
      pdfFile = body.pdfFile as File
      
      // Step 2: S3 Uploads (only after validation passes)
      if (coverFile) {
        const coverKey = `covers/${randomUUID()}-${coverFile.name}`
        const arrayBuffer = await coverFile.arrayBuffer()
        await uploadToS3(coverKey, Buffer.from(arrayBuffer), coverFile.type)
        projectData.coverImageKey = coverKey
      }
      
      if (pdfFile) {
        const pdfKey = `pdfs/${randomUUID()}-${pdfFile.name}`
        const arrayBuffer = await pdfFile.arrayBuffer()
        await uploadToS3(pdfKey, Buffer.from(arrayBuffer), pdfFile.type)
        projectData.pdfKey = pdfKey
      }
    } else {
      // Standard JSON flow
      projectData = c.req.valid('json')
    }

    // RDS: insert new project
    const [newProject] = await db.insert(projects).values({
      title: projectData.title,
      description: projectData.description,
      tags: projectData.tags,
      userId: projectData.userId,
      coverImageKey: projectData.coverImageKey,
      pdfKey: projectData.pdfKey,
      demoUrl: projectData.demoUrl
    }).returning()

    // DynamoDB: database event log
    await logData({
      userId: projectData.userId,
      action: 'CREATE',
      resourceId: newProject.projectId,
      entityType: 'PROJECT'
    })

    return c.json(newProject, 201)
  } catch (error: any) {
    console.error('POST /projects failed:', error)
    return c.json({ error: error.message || 'Failed to create project' }, 500)
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
