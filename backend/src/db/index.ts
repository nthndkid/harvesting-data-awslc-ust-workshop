// ─────────────────────────────────────────────────────────────────────────────
// RDS Connection — ProjectHub Polyglot Persistence
// This file initializes the Drizzle ORM client with the PostgreSQL driver
// ─────────────────────────────────────────────────────────────────────────────

import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

//  RDS — Database connection string parameters
// These environment variables are configured in your .env file
const client = postgres({
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME!,
    username: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    ssl: 'require',  // RDS requires SSL for secure connections — leave this enabled!
})

// RDS — Initialize Drizzle with our schema for type-safe queries
export const db = drizzle(client, { schema })