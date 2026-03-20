// ─────────────────────────────────────────────────────────────────────────────
// RDS Schema — ProjectHub Polyglot Persistence
// This file defines the PostgreSQL tables for the relational data
// ─────────────────────────────────────────────────────────────────────────────

import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core'

// Users table
// Simplified for the workshop: No password/auth required.
// Users are identified strictly by their name
export const users = pgTable('users', {
    userId: uuid('users_id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    createdAt: timestamp('created_at').defaultNow(),
})

// Projects table
// coverImageKey and pdfKey store S3 keys (not full URLs)
export const projects = pgTable('projects', {
    projectId: uuid('projects_id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.userId),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    coverImageKey: text('cover_image_key'), // S3: covers/uuid.jpg
    pdfKey: text('pdf_key'),                // S3: pdfs/uuid.pdf
    demoUrl: varchar('demo_url', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow(),
})

// Comments table
export const comments = pgTable('comments', {
    commentId: uuid('comments_id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').notNull().references(() => projects.projectId),
    userId: uuid('user_id').notNull().references(() => users.userId),
    body: text('body').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
})

// Likes table
export const likes = pgTable('likes', {
    likeId: uuid('likes_id').primaryKey().defaultRandom(),
    projectId: uuid('project_id').notNull().references(() => projects.projectId),
    userId: uuid('user_id').notNull().references(() => users.userId),
    createdAt: timestamp('created_at').defaultNow(),
})