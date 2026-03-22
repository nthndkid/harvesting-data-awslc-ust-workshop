// ─────────────────────────────────────────────
// AWS S3 client and upload / presigned URL helpers
// ─────────────────────────────────────────────

import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
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

// Calculate total storage and object counts for the bucket
export async function getS3Stats() {
  const command = new ListObjectsV2Command({ Bucket: getBucket() })
  const response = await s3Client.send(command)
  const objects = response.Contents || []
  
  let totalBytes = 0
  for (const obj of objects) {
    totalBytes += obj.Size || 0
  }
  
  return {
    fileCount: objects.length,
    storageMB: Number((totalBytes / (1024 * 1024)).toFixed(2)),
    bucketRegion: await s3Client.config.region()
  }
}

// Fetch the Raw object list from the bucket
export async function getS3Objects() {
  const command = new ListObjectsV2Command({ Bucket: getBucket() })
  const response = await s3Client.send(command)
  
  return (response.Contents || []).map(obj => ({
    key: obj.Key,
    sizeMB: Number(((obj.Size || 0) / (1024 * 1024)).toFixed(2)),
    lastModified: obj.LastModified
  }))
}

// Upload a file to S3 — returns the S3 key
export async function uploadToS3(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string
): Promise<string> {
  await s3Client.send(new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    Body: body,
    ContentType: contentType,
  }))
  return key 
}

// Generate a presigned URL for temporary access (15 minutes)
export async function getPresignedUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: getBucket(), Key: key })
  return getSignedUrl(s3Client, command, { expiresIn: 900 }) 
}

// Function to test bucket access on demand for the health endpoint
export async function checkS3Connection(): Promise<boolean> {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: getBucket() }))
    return true
  } catch {
    return false
  }
}

// Async IIFE to test the S3 connection on startup
;(async () => {
  const isConnected = await checkS3Connection()
  if (isConnected) {
    console.log('✅ Connected to AWS S3 successfully!')
  } else {
    console.error('❌ Failed to connect to AWS S3. Check your .env setup.')
  }
})()
