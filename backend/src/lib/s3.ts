// ─────────────────────────────────────────────
// AWS S3 client and upload / presigned URL helpers
// ─────────────────────────────────────────────

import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// AWS_REGION comes from: the region you chose when creating your S3 bucket
// AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY come from: IAM -> your user -> Security credentials -> Access keys
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'placeholder',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'placeholder',
  },
})

// S3_BUCKET_NAME comes from: the bucket name you chose when creating it
const getBucket = () => process.env.S3_BUCKET_NAME || 'placeholder-bucket'

// Upload a file to S3 — returns the S3 key (not the full URL)
export async function uploadToS3(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string
): Promise<string> {
  // S3: PutObject: storing the file
  await s3Client.send(new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    Body: body,
    ContentType: contentType,
  }))
  return key // always return the key, never the full URL
}

// Generate a presigned URL for temporary access (15 minutes)
export async function getPresignedUrl(key: string): Promise<string> {
  // S3: GetObject: generating a temporary download link
  const command = new GetObjectCommand({ Bucket: getBucket(), Key: key })
  return getSignedUrl(s3Client, command, { expiresIn: 900 }) // 900 seconds = 15 minutes
}

// Async IIFE to test the S3 connection on startup
;(async () => {
  try {
    // We execute a HeadBucketCommand to verify the bucket exists and credentials are valid
    await s3Client.send(new HeadBucketCommand({ Bucket: getBucket() }))
    console.log('✅ Connected to AWS S3 successfully!')
  } catch (error) {
    // If credentials fail or the bucket name isn't set properly, this will catch it
    console.error('❌ Failed to connect to AWS S3. Check your .env setup.')
  }
})()
