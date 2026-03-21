// ─────────────────────────────────────────────────────────────────────────────
// AWS Clients — ProjectHub Polyglot Persistence
// This file initializes the modular AWS SDK v3 clients for S3 and DynamoDB
// ─────────────────────────────────────────────────────────────────────────────

import { S3Client } from '@aws-sdk/client-s3'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

// AWS Credentials
// These are loaded from your .env file after you create your IAM user
const region = process.env.AWS_REGION || 'ap-southeast-1'
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

if (!accessKeyId || !secretAccessKey) {
    console.warn('⚠️ AWS credentials missing. S3 and DynamoDB features will not work.')
}

// S3 — Initialize the client for file storage (Covers & PDFs)
export const s3Client = new S3Client({
    region,
    credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
    },
})

// DynamoDB — Initialize the low-level client
const ddbClient = new DynamoDBClient({
    region,
    credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
    },
})

// DynamoDB — Wrap with DocumentClient for easier JS object handling
export const dynamo = DynamoDBDocumentClient.from(ddbClient, {
    marshallOptions: {
        removeUndefinedValues: true,
    },
})
