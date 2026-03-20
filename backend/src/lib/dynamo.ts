// ─────────────────────────────────────────────────────────────────────────────
// DynamoDB Audit Trail — ProjectHub Polyglot Persistence
//
// One table per participant: projecthub-[name]-events
// Every significant action in the app writes one event here.
//
// Table design:
//   PK: userId      — who did it (partition by user)
//   SK: sk          — timestamp#uuid (sortable, always unique)
//   eventType       — AUTH | ACCESS | DATA (what category)
//   action          — LOGIN, VIEW, CREATE, etc. (what specifically)
//   resourceId      — what was affected (project id, S3 key, comment id)
//   metadata        — flexible extra context per event type
//   timestamp       — ISO 8601 string
//   expiresAt       — Unix epoch seconds, TTL auto-deletes after 90 days
//
// Why one table per participant?
//   - Everyone can find their own table in the console instantly
//   - PK = userId means one Query call gets everything a user ever did
//   - eventType as an attribute (not a table) is the real audit trail pattern
//   - This is how AWS CloudTrail, Datadog, and most SaaS audit logs work
// ─────────────────────────────────────────────────────────────────────────────

import 'dotenv/config'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'

// ─── Client setup ─────────────────────────────────────────────────────────────
// AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY → from your .env file
const raw = new DynamoDBClient({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

// DynamoDBDocumentClient wraps the raw client so you write plain JS objects
// instead of DynamoDB's typed format like { S: "value" } or { N: "123" }
const dynamo = DynamoDBDocumentClient.from(raw)

// DYNAMODB_TABLE → from your .env file
// Format: projecthub-[yourname]-events
// Example: projecthub-maria-events
const TABLE = process.env.DYNAMODB_TABLE!

// ─── TTL helper ───────────────────────────────────────────────────────────────
// Returns a Unix timestamp 90 days from now (in seconds, not milliseconds)
// DynamoDB reads this attribute and auto-deletes the item after 90 days
const ttl = () => Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60)

// ─── Core write function ──────────────────────────────────────────────────────
// All three public helpers call this — it's the single place where
// PK, SK, timestamp, and TTL are set. Never duplicated.
async function writeEvent(params: {
    userId: string
    eventType: 'AUTH' | 'ACCESS' | 'DATA'
    action: string
    resourceId?: string
    metadata?: Record<string, string>
}) {
    // 📝 DynamoDB — PutItem into the audit trail table
    await dynamo.send(new PutCommand({
        TableName: TABLE,
        Item: {
            // PK — partition by user so all their events live together
            userId: params.userId,

            // SK — timestamp + uuid makes it sortable AND unique
            // Two events at the exact same millisecond won't overwrite each other
            sk: `${new Date().toISOString()}#${randomUUID()}`,

            eventType: params.eventType,
            action: params.action,
            resourceId: params.resourceId ?? null,
            metadata: params.metadata ?? null,
            timestamp: new Date().toISOString(),
            expiresAt: ttl(),
        },
    }))
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC HELPERS
// Call these from your route files — one for each event category
// All failures are caught silently — a log failure never crashes a route
// ─────────────────────────────────────────────────────────────────────────────

// ─── AUTH events ──────────────────────────────────────────────────────────────
// Answers: who logged in or out, from where
export async function logAuth(params: {
    userId: string
    action: 'LOGIN' | 'LOGOUT'
    ip?: string
    userAgent?: string
}) {
    return writeEvent({
        userId: params.userId,
        eventType: 'AUTH',
        action: params.action,
        metadata: {
            ...(params.ip && { ip: params.ip }),
            ...(params.userAgent && { userAgent: params.userAgent }),
        },
    }).catch(err => console.error('❌ DynamoDB logAuth failed:', err))
}

// ─── ACCESS events ────────────────────────────────────────────────────────────
// Answers: who accessed what resource, and how
export async function logAccess(params: {
    userId: string
    action: 'VIEW' | 'DOWNLOAD' | 'VIEW_IMAGE' | 'LIST'
    resourceId: string
}) {
    return writeEvent({
        userId: params.userId,
        eventType: 'ACCESS',
        action: params.action,
        resourceId: params.resourceId,
    }).catch(err => console.error('❌ DynamoDB logAccess failed:', err))
}

// ─── DATA events ──────────────────────────────────────────────────────────────
// Answers: who changed what data, and what the operation was
export async function logData(params: {
    userId: string
    action: 'CREATE' | 'DELETE' | 'LIKE' | 'UNLIKE'
    resourceId: string
    entityType: 'PROJECT' | 'COMMENT' | 'LIKE'
}) {
    return writeEvent({
        userId: params.userId,
        eventType: 'DATA',
        action: params.action,
        resourceId: params.resourceId,
        metadata: { entityType: params.entityType },
    }).catch(err => console.error('❌ DynamoDB logData failed:', err))
}

// ─────────────────────────────────────────────────────────────────────────────
// READ HELPERS (used by admin dashboard)
// ─────────────────────────────────────────────────────────────────────────────

// ─── Get all events for a specific user ───────────────────────────────────────
// This is a real DynamoDB Query — not a Scan
// Because userId is the PK, this is fast and cheap regardless of table size
export async function getEventsByUser(userId: string) {
    const result = await dynamo.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
        ScanIndexForward: false, // newest first
        Limit: 50,
    }))
    return result.Items ?? []
}

// ─── Get events filtered by type (for admin dashboard tabs) ───────────────────
// This IS a Scan — acceptable for the admin dashboard at workshop scale
export async function getEventsByType(eventType: 'AUTH' | 'ACCESS' | 'DATA') {
    const result = await dynamo.send(new ScanCommand({
        TableName: TABLE,
        FilterExpression: 'eventType = :t',
        ExpressionAttributeValues: { ':t': eventType },
        Limit: 50,
    }))
    return result.Items ?? []
}

// ─── Get all recent events (admin overview) ───────────────────────────────────
export async function getAllEvents() {
    const result = await dynamo.send(new ScanCommand({
        TableName: TABLE,
        Limit: 100,
    }))
    return result.Items ?? []
}
