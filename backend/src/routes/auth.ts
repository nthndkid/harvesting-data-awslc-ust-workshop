// ─────────────────────────────────────────────
// Auth routes
// ─────────────────────────────────────────────

import { OpenAPIHono, createRoute } from '@hono/zod-openapi'
import { z } from '@hono/zod-openapi'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { logAuth } from '../lib/dynamo'
import { loginSchema, ErrorSchema } from '../lib/validators'

const router = new OpenAPIHono()

// POST /auth/login route definition
const loginRoute = createRoute({
  method: 'post',
  path: '/login',
  tags: ['Authentication'],
  request: {
    body: {
      content: { 'application/json': { schema: loginSchema } }
    }
  },
  responses: {
    200: {
      description: 'Successful login. Use this returned userId for creating projects.',
      content: {
        'application/json': {
          schema: z.object({
            userId: z.string().uuid(),
            userName: z.string()
          })
        }
      }
    },
    500: {
      description: 'Server error',
      content: { 'application/json': { schema: ErrorSchema } }
    }
  }
})

router.openapi(loginRoute, async (c) => {
  const { userName } = c.req.valid('json')
  
  try {
    // RDS: check if user exists or create
    let [user] = await db.select().from(users).where(eq(users.userName, userName))
    
    if (!user) {
      [user] = await db.insert(users).values({ userName }).returning()
    }
    
    // DynamoDB: log auth attempt
    await logAuth({ 
      userId: user.userId, 
      action: 'LOGIN',
      ip: c.req.header('x-forwarded-for') || ''
    })
    
    return c.json({ userId: user.userId, userName: user.userName }, 200)
    
  } catch (error) {
    console.error('POST /auth/login failed:', error)
    return c.json({ error: 'Login failed' }, 500)
  }
})

export default router
