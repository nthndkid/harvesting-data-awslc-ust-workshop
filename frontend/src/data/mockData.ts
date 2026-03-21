// ─── Mock Data ───────────────────────────────────────────────────────────────
// All hardcoded workshop data lives here — centralized in one file.
// In production, API calls replace these imports.
// Every AWS touchpoint is documented with a comment.
import type { Project, Comment, Like, AuditTrailEvent, S3Stats, S3Object } from '@/types/projecthub.types'

// ─── Projects ───────────────────────────────────────────────────────────────
// 🗄️ RDS: SELECT projects.*, users.name FROM projects JOIN users ON projects.user_id = users.id
// 🌐 API: GET /projects
// Currently: using hardcoded mock array below
export const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Polyglot Persistence Demo',
    description:
      'A hands-on exploration of using RDS, S3, and DynamoDB together in a single Bun application. Built for the AWS Learning Club workshop at UST.',
    tags: ['AWS', 'BUN', 'POSTGRESQL'],
    demoUrl: 'https://demo.projecthub.dev/polyglot',
    coverImageKey: null,
    pdfKey: 'pdfs/polyglot-paper.pdf',
    author: 'Sam Reyes',
    createdAt: '2026-03-15',
    likes: 24,
    comments: 5,
  },
  {
    id: '2',
    title: 'Smart Irrigation IoT System',
    description:
      'Arduino-based soil moisture monitoring with AWS IoT Core. Sends real-time sensor data to a cloud dashboard.',
    tags: ['ARDUINO', 'AWS IOT', 'C++'],
    demoUrl: 'https://github.com/ust-cpe/smart-irrigation',
    coverImageKey: null,
    pdfKey: 'pdfs/irrigation-paper.pdf',
    author: 'Maria Santos',
    createdAt: '2026-03-10',
    likes: 18,
    comments: 3,
  },
  {
    id: '3',
    title: 'Campus Lost & Found App',
    description:
      'React Native app for reporting and finding lost items on campus. Uses image recognition to match found items with reports.',
    tags: ['REACT NATIVE', 'ML', 'FIREBASE'],
    demoUrl: null,
    coverImageKey: null,
    pdfKey: 'pdfs/lost-found-paper.pdf',
    author: 'Juan dela Cruz',
    createdAt: '2026-03-08',
    likes: 31,
    comments: 7,
  },
  {
    id: '4',
    title: 'Jeepney Route Optimizer',
    description:
      'Graph-based algorithm for optimizing public jeepney routes in Metro Manila using real GTFS data from the LTFRB open dataset.',
    tags: ['PYTHON', 'GRAPH THEORY', 'GTFS'],
    demoUrl: 'https://jeepney-optimizer.vercel.app',
    coverImageKey: null,
    pdfKey: 'pdfs/jeepney-paper.pdf',
    author: 'Ana Reyes',
    createdAt: '2026-03-05',
    likes: 42,
    comments: 11,
  },
  {
    id: '5',
    title: 'PH Disaster Risk Heatmap',
    description:
      'Interactive choropleth map visualizing disaster risk index across Philippine provinces using NDRRMC and PSA open data.',
    tags: ['D3.JS', 'OPEN DATA', 'VUE'],
    demoUrl: 'https://ph-risk-map.netlify.app',
    coverImageKey: null,
    pdfKey: 'pdfs/heatmap-paper.pdf',
    author: 'Carlo Lim',
    createdAt: '2026-03-01',
    likes: 29,
    comments: 6,
  },
  {
    id: '6',
    title: 'Filipino Sign Language Translator',
    description:
      'Real-time FSL recognition using MediaPipe hand landmarks and a TensorFlow Lite model trained on a 10,000-sample Filipino dataset.',
    tags: ['TENSORFLOW', 'MEDIAPIPE', 'PYTHON'],
    demoUrl: null,
    coverImageKey: null,
    pdfKey: 'pdfs/fsl-paper.pdf',
    author: 'Lea Torres',
    createdAt: '2026-02-25',
    likes: 55,
    comments: 14,
  },
]

// ─── Comments ────────────────────────────────────────────────────────────────
// 🗄️ RDS: SELECT comments.*, users.name FROM comments JOIN users ON comments.user_id = users.id
// 🌐 API: GET /projects/:id/comments
// Currently: filtering this array by projectId in each view
export const mockComments: Comment[] = [
  {
    id: 'c1',
    projectId: '1',
    author: 'Maria Santos',
    body: 'This is exactly what I needed for our cloud architecture class. The DynamoDB logging approach is super clean.',
    createdAt: '2026-03-16',
  },
  {
    id: 'c2',
    projectId: '1',
    author: 'Juan dela Cruz',
    body: 'How did you handle the TTL setup on DynamoDB? Was it automatic or manual?',
    createdAt: '2026-03-16',
  },
  {
    id: 'c3',
    projectId: '2',
    author: 'Sam Reyes',
    body: 'The IoT + S3 integration is brilliant. Did you use S3 Event Notifications to trigger anything downstream?',
    createdAt: '2026-03-11',
  },
  {
    id: 'c4',
    projectId: '3',
    author: 'Carlo Lim',
    body: 'Open-sourcing this? Would love to fork it for DLSU.',
    createdAt: '2026-03-09',
  },
  {
    id: 'c5',
    projectId: '4',
    author: 'Lea Torres',
    body: 'Sana all naggamit ng actual LTFRB data. Legit research ito.',
    createdAt: '2026-03-06',
  },
  {
    id: 'c6',
    projectId: '6',
    author: 'Ana Reyes',
    body: 'The 10K sample dataset — did you collect this yourselves or source it externally?',
    createdAt: '2026-02-26',
  },
]

// ─── Likes ───────────────────────────────────────────────────────────────────
// 🗄️ RDS: SELECT likes.*, users.name, projects.title FROM likes JOIN users JOIN projects
// 🌐 API: GET /admin/likes
// Currently: using mock array below
export const mockLikes: Like[] = [
  { id: 'l1', projectId: '1', projectTitle: 'Polyglot Persistence Demo',      likedBy: 'Maria Santos', createdAt: '2026-03-15T14:00:00Z' },
  { id: 'l2', projectId: '1', projectTitle: 'Polyglot Persistence Demo',      likedBy: 'Juan dela Cruz', createdAt: '2026-03-15T14:30:00Z' },
  { id: 'l3', projectId: '2', projectTitle: 'Smart Irrigation IoT System',    likedBy: 'Sam Reyes',   createdAt: '2026-03-10T10:00:00Z' },
  { id: 'l4', projectId: '4', projectTitle: 'Jeepney Route Optimizer',        likedBy: 'Lea Torres',  createdAt: '2026-03-05T09:15:00Z' },
  { id: 'l5', projectId: '6', projectTitle: 'Filipino Sign Language Translator', likedBy: 'Carlo Lim', createdAt: '2026-02-25T16:45:00Z' },
  { id: 'l6', projectId: '6', projectTitle: 'Filipino Sign Language Translator', likedBy: 'Ana Reyes', createdAt: '2026-02-25T17:00:00Z' },
]

// ─── DynamoDB Audit Trail ────────────────────────────────────────────────────
// Single unified audit trail — one array, all event types.
// Mirrors the real DynamoDB table: projecthub-[name]-events
// PK: userId  SK: timestamp#uuid
// Filter by eventType in the admin LogTabs component: AUTH | ACCESS | DATA
// 🌐 API: GET /admin/audit-trail?eventType=AUTH|ACCESS|DATA (or omit for ALL)
// Currently: filtering this array client-side by eventType in LogTabs.vue
export const mockAuditTrail: AuditTrailEvent[] = [
  // AUTH events — login / logout
  { userId: 'user-001', sk: '2026-03-28T08:00:00.000Z#a1b2c3', eventType: 'AUTH',   action: 'LOGIN',    resourceId: null,                      metadata: { ip: '122.54.12.88', userAgent: 'Chrome/122' },  timestamp: '2026-03-28T08:00:00.000Z', expiresAt: 1719532800 },
  { userId: 'user-002', sk: '2026-03-28T08:05:00.000Z#d4e5f6', eventType: 'AUTH',   action: 'LOGIN',    resourceId: null,                      metadata: { ip: '122.54.99.12', userAgent: 'Firefox/124' }, timestamp: '2026-03-28T08:05:00.000Z', expiresAt: 1719532800 },
  { userId: 'user-001', sk: '2026-03-28T10:30:00.000Z#g7h8i9', eventType: 'AUTH',   action: 'LOGOUT',   resourceId: null,                      metadata: { ip: '122.54.12.88', userAgent: 'Chrome/122' },  timestamp: '2026-03-28T10:30:00.000Z', expiresAt: 1719532800 },
  // ACCESS events — view / download / list
  { userId: 'user-002', sk: '2026-03-28T08:10:00.000Z#j1k2l3', eventType: 'ACCESS', action: 'VIEW',     resourceId: 'project-001',             metadata: null,                                             timestamp: '2026-03-28T08:10:00.000Z', expiresAt: 1719532800 },
  { userId: 'user-003', sk: '2026-03-28T11:02:00.000Z#m4n5o6', eventType: 'ACCESS', action: 'LIST',     resourceId: 'projects-feed',           metadata: null,                                             timestamp: '2026-03-28T11:02:00.000Z', expiresAt: 1719532800 },
  { userId: 'user-002', sk: '2026-03-28T08:15:00.000Z#p7q8r9', eventType: 'ACCESS', action: 'DOWNLOAD', resourceId: 'pdfs/polyglot-paper.pdf', metadata: null,                                             timestamp: '2026-03-28T08:15:00.000Z', expiresAt: 1719532800 },
  // DATA events — create / like / unlike
  { userId: 'user-001', sk: '2026-03-28T07:55:00.000Z#s1t2u3', eventType: 'DATA',   action: 'CREATE',   resourceId: 'project-001',             metadata: { entityType: 'PROJECT' },                        timestamp: '2026-03-28T07:55:00.000Z', expiresAt: 1719532800 },
  { userId: 'user-002', sk: '2026-03-28T08:20:00.000Z#v4w5x6', eventType: 'DATA',   action: 'CREATE',   resourceId: 'comment-001',             metadata: { entityType: 'COMMENT' },                        timestamp: '2026-03-28T08:20:00.000Z', expiresAt: 1719532800 },
  { userId: 'user-002', sk: '2026-03-28T08:22:00.000Z#y7z8a9', eventType: 'DATA',   action: 'LIKE',     resourceId: 'project-001',             metadata: { entityType: 'LIKE' },                           timestamp: '2026-03-28T08:22:00.000Z', expiresAt: 1719532800 },
  { userId: 'user-002', sk: '2026-03-28T09:00:00.000Z#b1c2d3', eventType: 'DATA',   action: 'UNLIKE',   resourceId: 'project-001',             metadata: { entityType: 'LIKE' },                           timestamp: '2026-03-28T09:00:00.000Z', expiresAt: 1719532800 },
]

// ─── S3 Storage Stats ─────────────────────────────────────────────────────────
// 🌐 API: GET /admin/s3-stats → Hono calls S3 ListObjectsV2 → counts objects + sums sizes
// Free tier: 5 GB storage · 20,000 GET/mo · 2,000 PUT/mo
// Currently: using hardcoded mock below
export const mockS3Stats: S3Stats = {
  fileCount: 12,
  storageMB: 28.4,
  bucketRegion: 'ap-southeast-1',
}

// ─── S3 Object Listing ────────────────────────────────────────────────────────
// 🌐 API: GET /admin/s3-objects → Hono calls S3 ListObjectsV2 → returns full object list
// In real S3 response: { Key, Size (bytes), LastModified (Date) }
// Currently: using hardcoded mock below — 6 PDFs + 6 cover images = 12 files
export const mockS3Objects: S3Object[] = [
  // PDF uploads (pdfs/ prefix)
  { key: 'pdfs/polyglot-paper.pdf',          sizeMB: 3.2,  lastModified: '2026-03-15T07:55:00Z' },
  { key: 'pdfs/irrigation-paper.pdf',         sizeMB: 2.8,  lastModified: '2026-03-10T08:10:00Z' },
  { key: 'pdfs/lost-found-paper.pdf',         sizeMB: 4.1,  lastModified: '2026-03-08T09:30:00Z' },
  { key: 'pdfs/jeepney-paper.pdf',            sizeMB: 5.5,  lastModified: '2026-03-05T10:00:00Z' },
  { key: 'pdfs/heatmap-paper.pdf',            sizeMB: 2.4,  lastModified: '2026-03-01T11:45:00Z' },
  { key: 'pdfs/fsl-paper.pdf',               sizeMB: 3.9,  lastModified: '2026-02-25T14:20:00Z' },
  // Cover images (covers/ prefix)
  { key: 'covers/polyglot-cover.jpg',         sizeMB: 1.1,  lastModified: '2026-03-15T07:56:00Z' },
  { key: 'covers/irrigation-cover.jpg',        sizeMB: 0.9,  lastModified: '2026-03-10T08:11:00Z' },
  { key: 'covers/lost-found-cover.jpg',        sizeMB: 1.3,  lastModified: '2026-03-08T09:31:00Z' },
  { key: 'covers/jeepney-cover.jpg',           sizeMB: 0.8,  lastModified: '2026-03-05T10:01:00Z' },
  { key: 'covers/heatmap-cover.jpg',           sizeMB: 1.0,  lastModified: '2026-03-01T11:46:00Z' },
  { key: 'covers/fsl-cover.jpg',              sizeMB: 1.4,  lastModified: '2026-02-25T14:21:00Z' },
]

