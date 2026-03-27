// ─────────────────────────────────────────────
// Zod OpenAPI validators for Request bodies and Path params
// ─────────────────────────────────────────────

import { z } from '@hono/zod-openapi'

export const createProjectSchema = z.object({
  title: z.string().min(3).max(255).openapi({ example: 'My Awesome Project' }),
  description: z.string().min(10).openapi({ example: 'A detailed description of my project...' }),
  tags: z.string().max(255).openapi({ example: 'react, aws, bun' }),
  coverImageKey: z.string().optional().openapi({ example: 'covers/abc-123.jpg' }),
  pdfKey: z.string().optional().openapi({ example: 'pdfs/abc-123.pdf' }),
  demoUrl: z.string()
    .optional()
    .or(z.literal(''))
    .transform((val) => {
      if (!val || val.trim() === '') return undefined
      let url = val.trim()
      if (!/^https?:\/\//i.test(url)) {
        return `https://${url}`
      }
      return url
    })
    .pipe(z.string().url().optional())
    .openapi({ example: 'google.com' }),
  userId: z.string().uuid().openapi({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' }),
}).openapi('CreateProjectRequest')

// For Multipart form-data uploads
export const CreateProjectMultipartSchema = z.object({
  title: z.string().min(3).max(255).openapi({ example: 'My Awesome Project' }),
  description: z.string().min(10).openapi({ example: 'A detailed description of my project...' }),
  tags: z.string().max(255).openapi({ example: 'react, aws, bun' }),
  demoUrl: z.string().optional().openapi({ example: 'google.com' }),
  userId: z.string().uuid().openapi({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' }),
  coverFile: z.any().optional().openapi({ type: 'string', format: 'binary' }),
  pdfFile: z.any().optional().openapi({ type: 'string', format: 'binary' }),
}).openapi('CreateProjectMultipartRequest')

export const createCommentSchema = z.object({
  body: z.string().min(1).max(2000).openapi({ example: 'This is a great project!' }),
  userId: z.string().uuid().openapi({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' }),
}).openapi('CreateCommentRequest')

export const loginSchema = z.object({
  userName: z.string().min(1).max(100).openapi({ example: 'alice' }),
}).openapi('LoginRequest')

export const ErrorSchema = z.object({
  error: z.string()
}).openapi('ErrorResponse')

export const SuccessMessageSchema = z.object({
  message: z.string()
}).openapi('SuccessResponse')

// Common route param schemas
export const ProjectIdParamsSchema = z.object({
  id: z.string().uuid().openapi({ 
    param: { name: 'id', in: 'path' },
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
})
