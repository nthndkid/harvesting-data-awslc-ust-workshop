// ─── ProjectHub Type Definitions ────────────────────────────────────────────
// Source of truth for all types used across the app.
// These mirror the RDS schema + DynamoDB table structures.

// ─── RDS: projects table ────────────────────────────────────────────────────
export interface Project {
  id: string
  title: string
  description: string
  tags: string[]
  demoUrl: string | null      // Optional — not all projects have a live demo
  coverImageKey: string | null // S3 key: covers/{uuid}.jpg — null in mock build
  pdfKey: string | null        // S3 key: pdfs/{uuid}.pdf — null in mock build
  author: string
  createdAt: string
  likes: number
  comments: number
}

// ─── RDS: comments table ────────────────────────────────────────────────────
export interface Comment {
  id: string
  projectId: string
  author: string
  body: string
  createdAt: string
}

// ─── RDS: likes table ───────────────────────────────────────────────────────
export interface Like {
  id: string
  projectId: string
  projectTitle: string
  likedBy: string
  createdAt: string
}

// ─── DynamoDB Audit Trail ───────────────────────────────────────────────────
// Single table per participant: projecthub-[name]-events
// Every app event is one AuditTrailEvent — who did what, to what, when.
// eventType = category:  AUTH (login/logout) | ACCESS (view/download) | DATA (create/like)
// action    = operation: LOGIN, LOGOUT, VIEW, LIST, DOWNLOAD, CREATE, LIKE, UNLIKE
export interface AuditTrailEvent {
  userId: string                          // PK — who triggered the event
  sk: string                              // SK — timestamp#uuid (sort key)
  eventType: 'AUTH' | 'ACCESS' | 'DATA'  // Category for filtering in LogTabs
  action: string                          // Specific operation
  resourceId: string | null               // What was acted on (project id, S3 key, etc.)
  metadata: Record<string, string> | null // Extra context (ip, userAgent, entityType)
  timestamp: string                       // ISO 8601 string
  expiresAt: number                       // Unix epoch — TTL, auto-deletes 90 days after creation
}

// ─── S3 Storage Stats ───────────────────────────────────────────────────────
// 🌐 API: GET /admin/s3-stats → Hono calls S3 ListObjectsV2
export interface S3Stats {
  fileCount: number
  storageMB: number
  bucketRegion: string
}

// ─── S3 Individual Object (for object listing table) ──────────────────────
// 🌐 API: GET /admin/s3-objects → Hono calls S3 ListObjectsV2 (full object list)
// Each object = { Key, Size, LastModified } from the AWS SDK response
export interface S3Object {
  key: string           // e.g. 'covers/abc123.jpg' or 'pdfs/polyglot-paper.pdf'
  sizeMB: number        // Rounded to 2 decimal places
  lastModified: string  // ISO 8601 string
}
