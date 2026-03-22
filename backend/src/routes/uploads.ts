// ─────────────────────────────────────────────
// Uploads Routes (S3)
// ─────────────────────────────────────────────

import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from '@hono/zod-openapi'
import { uploadToS3 } from '../lib/s3'
import { randomUUID } from 'crypto'
import { ErrorSchema } from '../lib/validators'

const router = new OpenAPIHono()

// S3 Keys — Never Full URLs
// Generate random UUIDs for keys

const UploadResponseSchema = z.object({
  key: z.string().openapi({ example: 'covers/abc-123.jpg' })
}).openapi('UploadResponse')

// POST /uploads/cover
const uploadCoverRoute = createRoute({
  method: 'post',
  path: '/cover',
  tags: ['Uploads'],
  security: [{ UserIdHeader: [] }],
  responses: {
    201: {
      description: 'Upload success',
      content: { 'application/json': { schema: UploadResponseSchema } }
    },
    500: {
      description: 'Upload failed',
      content: { 'application/json': { schema: ErrorSchema } }
    }
  }
})

// Using standard hono request parsing for file as multipart can be verbose in Zod schemas
router.openapi(uploadCoverRoute, async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['file'] as File
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 500)
    }

    const key = `covers/${randomUUID()}-${file.name}`
    const arrayBuffer = await file.arrayBuffer()
    // S3: uploading cover image
    await uploadToS3(key, Buffer.from(arrayBuffer), file.type)
    
    return c.json({ key }, 201)
  } catch (error) {
    console.error('S3 PutObject failed:', error)
    return c.json({ error: 'File upload failed. Check S3 bucket config.' }, 500)
  }
})

// POST /uploads/pdf
const uploadPdfRoute = createRoute({
  method: 'post',
  path: '/pdf',
  tags: ['Uploads'],
  security: [{ UserIdHeader: [] }],
  responses: {
    201: {
      description: 'Upload success',
      content: { 'application/json': { schema: UploadResponseSchema } }
    },
    500: {
      description: 'Upload failed',
      content: { 'application/json': { schema: ErrorSchema } }
    }
  }
})

router.openapi(uploadPdfRoute, async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['file'] as File
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 500)
    }

    const key = `pdfs/${randomUUID()}-${file.name}`
    const arrayBuffer = await file.arrayBuffer()
    // S3: uploading PDF document
    await uploadToS3(key, Buffer.from(arrayBuffer), file.type)
    
    return c.json({ key }, 201)
  } catch (error) {
    console.error('S3 PutObject failed:', error)
    return c.json({ error: 'File upload failed. Check S3 bucket config.' }, 500)
  }
})

export default router
