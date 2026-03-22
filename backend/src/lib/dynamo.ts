// ─────────────────────────────────────────────
// DynamoDB Unified Audit Trail helpers
// ─────────────────────────────────────────────

import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'

const rawClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'placeholder',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'placeholder',
  },
})

const dynamo = DynamoDBDocumentClient.from(rawClient)

// TTL: logs auto-expire after 90 days
const ttl = () => Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60)

const getTable = () => process.env.DYNAMODB_TABLE || 'projecthub-events'

// Core write function: PK = userId, SK = timestamp#uuid
async function writeEvent(params: {
  userId: string
  eventType: 'AUTH' | 'ACCESS' | 'DATA'
  action: string
  resourceId?: string
  metadata?: Record<string, string>
}) {
  await dynamo.send(new PutCommand({
    TableName: getTable(),
    Item: {
      userId: params.userId,
      sk: `${new Date().toISOString()}#${randomUUID()}`, // PK/SK pattern
      eventType: params.eventType,
      action: params.action,
      resourceId: params.resourceId ?? null,
      metadata: params.metadata ?? null,
      timestamp: new Date().toISOString(),
      expiresAt: ttl(),
    },
  }))
}

// AUTH events — logins/logouts
export async function logAuth(params: { userId: string, action: 'LOGIN' | 'LOGOUT', ip?: string }) {
  return writeEvent({ userId: params.userId, eventType: 'AUTH', action: params.action, metadata: { ip: params.ip ?? '' } })
    .catch(err => console.error('logAuth failed:', err))
}

// ACCESS events — views/downloads
export async function logAccess(params: { userId: string, action: 'VIEW' | 'DOWNLOAD' | 'VIEW_IMAGE' | 'LIST', resourceId: string }) {
  return writeEvent({ userId: params.userId, eventType: 'ACCESS', action: params.action, resourceId: params.resourceId })
    .catch(err => console.error('logAccess failed:', err))
}

// DATA events — create/delete/like
export async function logData(params: { userId: string, action: 'CREATE' | 'DELETE' | 'LIKE' | 'UNLIKE', resourceId: string, entityType: string }) {
  return writeEvent({ userId: params.userId, eventType: 'DATA', action: params.action, resourceId: params.resourceId, metadata: { entityType: params.entityType } })
    .catch(err => console.error('logData failed:', err))
}

// Async IIFE to test the DynamoDB connection on startup
;(async () => {
  try {
    // We execute a DescribeTableCommand to verify the table exists and credentials are valid
    await rawClient.send(new DescribeTableCommand({ TableName: getTable() }))
    console.log('✅ Connected to AWS DynamoDB successfully!')
  } catch (error) {
    // If credentials fail or the table name isn't created properly, this will catch it
    console.error('❌ Failed to connect to AWS DynamoDB. Check your .env setup.')
  }
})()
