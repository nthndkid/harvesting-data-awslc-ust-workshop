// ─────────────────────────────────────────────
// DB Connection setup (postgres.js + Drizzle ORM)
// ─────────────────────────────────────────────

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

// DB_HOST comes from: RDS Console → your instance → Connectivity & security → Endpoint
const dbUser = process.env.DB_USER || 'placeholder'
const dbPass = process.env.DB_PASSWORD || 'placeholder'
const dbHost = process.env.DB_HOST || 'localhost'
const dbPort = process.env.DB_PORT || '5432'
const dbName = process.env.DB_NAME || 'projecthub'

// We pass the credentials safely as an object object instead of a URL string.
// This prevents passwords that contain special characters (like @ or #) from breaking the parser!
const client = postgres({
    host: dbHost,
    port: parseInt(dbPort),
    database: dbName,
    username: dbUser,
    password: dbPass,
    ssl: 'require'
})

export const db = drizzle(client, { schema })

    // Async IIFE to test the database connection on startup
    ; (async () => {
        try {
            // We execute a simple query to assert the connection works
            await client`SELECT 1`
            console.log('✅ Connected to RDS PostgreSQL successfully!')
        } catch (error) {
            // If the connection fails (like wrong password or hostname), we'll see it here
            console.error('❌ Failed to connect to RDS PostgreSQL. Check your .env setup.')
        }
    })()