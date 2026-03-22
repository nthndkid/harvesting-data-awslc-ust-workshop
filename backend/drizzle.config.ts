// ─────────────────────────────────────────────────────────────────────────────
// Drizzle Config — ProjectHub Polyglot Persistence
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Drizzle Config — ProjectHub Polyglot Persistence
// ─────────────────────────────────────────────────────────────────────────────

import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle',
    dialect: 'postgresql',
    dbCredentials: {
        host: process.env.DB_HOST!,
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        ssl: { rejectUnauthorized: false }
    },
    verbose: true,
    strict: true,
})
