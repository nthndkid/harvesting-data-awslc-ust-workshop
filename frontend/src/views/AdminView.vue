<script setup lang="ts">
// ─── Vue core imports ───────────────────────────────────────────────────────
import { ref } from 'vue'
// ─── Charts (vue-chartjs + Chart.js) ────────────────────────────────────────
import { Line, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement,
  BarElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js'
import type { ChartOptions } from 'chart.js'
// ─── Component imports ──────────────────────────────────────────────────────
import AdminStatCard from '@/components/AdminStatCard.vue'
import AdminTable from '@/components/AdminTable.vue'
import LogTabs from '@/components/LogTabs.vue'
import {
  LayoutDashboard,
  Cloud,
  Database,
  Zap,
} from 'lucide-vue-next'
// ─── Data imports ───────────────────────────────────────────────────────────
import {
  mockProjects, mockComments, mockLikes,
  mockS3Stats, mockS3Objects,
} from '@/data/mockData'

// ─── Register Chart.js (tree-shakeable — must be explicit) ──────────────────
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler,
)

// ─── Design tokens (keep in sync with main.css :root) ──────────────────────
const C_PRIMARY    = '#F5A800'
const C_FG         = '#0A0A0A'
const C_CARD       = '#FFFFFF'
const C_BORDER     = '#0A0A0A'
const FONT         = "'Space Mono', monospace"

// ─── Shared chart config helpers ────────────────────────────────────────────
const tick = { color: C_FG, font: { family: FONT, size: 11 } }
const tooltip = {
  backgroundColor: C_CARD, borderColor: C_BORDER, borderWidth: 2,
  titleColor: C_FG, bodyColor: C_FG,
  titleFont: { family: FONT, size: 12, weight: 'bold' as const },
  bodyFont: { family: FONT, size: 12 },
  cornerRadius: 0, padding: 10,
}
const grid = { color: `${C_FG}18`, lineWidth: 1 }
const axisBorder = { color: C_BORDER, width: 2 }

// ─── Chart 1: Daily Uploads (Line) ──────────────────────────────────────────
const uploadsData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [{
    label: 'Uploads',
    data: [2, 4, 1, 5, 3, 6, 3],
    borderColor: C_PRIMARY,
    backgroundColor: `${C_PRIMARY}22`,
    borderWidth: 3,
    pointBackgroundColor: C_PRIMARY,
    pointBorderColor: C_BORDER,
    pointBorderWidth: 2,
    pointRadius: 5,
    pointHoverRadius: 8,
    tension: 0,
    fill: true,
  }],
}
const uploadsOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip },
  scales: {
    x: { ticks: tick, grid, border: axisBorder },
    y: { beginAtZero: true, ticks: { ...tick, stepSize: 2 }, grid, border: axisBorder },
  },
}

// ─── Chart 2: Likes per Project (Bar) ────────────────────────────────────────
const shortTitles = ['Polyglot', 'Irrigation', 'Lost & Found', 'Jeepney', 'PH Risk', 'FSL']
const likesData = {
  labels: shortTitles,
  datasets: [{
    label: 'Likes',
    data: mockProjects.map(p => p.likes),
    backgroundColor: C_PRIMARY,
    borderColor: C_BORDER,
    borderWidth: 2,
  }],
}
const likesOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip },
  scales: {
    x: { ticks: { ...tick, maxRotation: 35 }, grid: { display: false }, border: axisBorder },
    y: { beginAtZero: true, ticks: { ...tick, stepSize: 10 }, grid, border: axisBorder },
  },
}

// ─── Chart 3: Comments per Project (Bar) ─────────────────────────────────────
const commentsData = {
  labels: shortTitles,
  datasets: [{
    label: 'Comments',
    data: mockProjects.map(p => p.comments),
    backgroundColor: C_FG,
    borderColor: C_PRIMARY,
    borderWidth: 2,
  }],
}
const commentsOptions: ChartOptions<'bar'> = {
  ...likesOptions,
  plugins: { legend: { display: false }, tooltip },
}

// ─── Tab state ──────────────────────────────────────────────────────────────
type AdminTab = 'overview' | 's3' | 'rds' | 'dynamo'
const activeTab = ref<AdminTab>('overview')

const navItems: { id: AdminTab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview',      icon: LayoutDashboard },
  { id: 's3',       label: 'S3 Storage',    icon: Cloud },
  { id: 'rds',      label: 'RDS Data',      icon: Database },
  { id: 'dynamo',   label: 'DynamoDB Logs', icon: Zap },
]

const headings: Record<AdminTab, { title: string; sub: string }> = {
  overview: { title: 'Dashboard Overview',  sub: 'High-level metrics and activity' },
  s3:       { title: 'S3 Storage',          sub: 'Object storage metrics and configuration' },
  rds:      { title: 'RDS Data',            sub: 'Relational data (Projects, Comments, Likes)' },
  dynamo:   { title: 'DynamoDB Logs',       sub: 'NoSQL audit and access logs' },
}

// ─── Overview stat cards ─────────────────────────────────────────────────────
const overviewCards = [
  { label: 'TOTAL PROJECTS', value: String(mockProjects.length), subtext: 'in mock dataset',    highlight: false },
  { label: 'TOTAL COMMENTS', value: String(mockComments.length), subtext: 'across all projects', highlight: false },
  { label: 'TOTAL LIKES',    value: String(mockLikes.length),    subtext: 'across all projects', highlight: true  },
]

// ─── S3 stat cards ───────────────────────────────────────────────────────────
// 🌐 API: GET /admin/s3-stats → S3 ListObjectsV2 → count + total size
const s3Cards = [
  { label: 'TOTAL FILES',   value: String(mockS3Stats.fileCount), subtext: 'cover images + PDFs',  highlight: false },
  { label: 'STORAGE USED',  value: `${mockS3Stats.storageMB} MB`, subtext: 'of 5 GB free tier',    highlight: false },
  { label: 'BUCKET REGION', value: mockS3Stats.bucketRegion,      subtext: 'Singapore',             highlight: true  },
]

// ─── S3 object table rows ────────────────────────────────────────────────────
// 🌐 API: GET /admin/s3-objects → S3 ListObjectsV2 full response
const s3ObjectRows = mockS3Objects.map(obj => [
  obj.key,
  `${obj.sizeMB} MB`,
  obj.lastModified.replace('T', ' ').replace('Z', ''),
])

// ─── RDS table rows ──────────────────────────────────────────────────────────
const projectRows = mockProjects.map((p, i) => [
  String(i + 1), p.title, p.author,
  p.coverImageKey ?? '—', p.pdfKey ?? '—', p.demoUrl ?? '—', p.createdAt,
])
const commentRows = mockComments.map((c, i) => {
  const project = mockProjects.find(p => p.id === c.projectId)
  return [
    String(i + 1),
    c.body.length > 60 ? c.body.slice(0, 60) + '...' : c.body,
    c.author, project?.title ?? '—', c.createdAt,
  ]
})
const likeRows = mockLikes.map((l, i) => [
  String(i + 1), l.projectTitle, l.likedBy, l.createdAt,
])
</script>

<template>
  <div class="flex min-h-[calc(100vh-64px)] bg-background">

    <!-- ── SIDEBAR (desktop) ─────────────────────────────────────────────── -->
    <aside class="w-64 border-r-[3px] border-primary bg-card flex-shrink-0 hidden md:block">
      <div class="p-6">
        <h2 class="text-lg font-bold uppercase text-card-foreground border-b-2 border-border pb-3 mb-4 tracking-wide">
          ADMIN PANEL
        </h2>
        <nav class="flex flex-col gap-1">
          <button
            v-for="item in navItems"
            :key="item.id"
            @click="activeTab = item.id"
            :class="[
              'flex items-center gap-3 w-full text-left px-4 py-3 font-bold uppercase text-sm transition-all duration-200 border-2 rounded-none',
              activeTab === item.id
                ? 'bg-primary text-primary-foreground border-border shadow-[4px_4px_0px_var(--shadow)] -translate-x-[2px] -translate-y-[2px]'
                : 'bg-transparent text-card-foreground border-transparent hover:border-border hover:bg-background hover:shadow-[2px_2px_0px_var(--shadow)]'
            ]"
          >
            <component :is="item.icon" :size="18" />
            {{ item.label }}
          </button>
        </nav>
      </div>
    </aside>

    <!-- ── MOBILE NAV (horizontal scroll) ───────────────────────────────── -->
    <div class="md:hidden fixed top-16 left-0 right-0 z-30 bg-card border-b-[3px] border-primary overflow-x-auto">
      <div class="flex p-3 gap-2 min-w-max">
        <button
          v-for="item in navItems"
          :key="item.id"
          @click="activeTab = item.id"
          :class="[
            'flex items-center gap-2 px-3 py-2 font-bold uppercase text-xs border-2 rounded-none transition-all duration-150 whitespace-nowrap',
            activeTab === item.id
              ? 'bg-primary text-primary-foreground border-border shadow-[2px_2px_0px_var(--shadow)]'
              : 'bg-transparent text-card-foreground border-transparent'
          ]"
        >
          <component :is="item.icon" :size="16" /> {{ item.label }}
        </button>
      </div>
    </div>

    <!-- ── MAIN CONTENT ──────────────────────────────────────────────────── -->
    <main class="flex-1 p-6 md:p-10 overflow-y-auto mt-[52px] md:mt-0">
      <div class="max-w-6xl mx-auto space-y-8">

        <!-- Dynamic heading -->
        <div class="border-l-[6px] border-primary pl-4">
          <h1 class="text-4xl font-bold uppercase text-foreground tracking-wide">
            {{ headings[activeTab].title }}
          </h1>
          <p class="text-muted text-sm mt-1">{{ headings[activeTab].sub }}</p>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- TAB: OVERVIEW                                                   -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <template v-if="activeTab === 'overview'">
          <!-- Stat cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AdminStatCard
              v-for="card in overviewCards"
              :key="card.label"
              :label="card.label" :value="card.value"
              :subtext="card.subtext" :highlight="card.highlight"
            />
          </div>

          <!-- Charts grid: 3 charts in a row on desktop, stacked on mobile -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">

            <!-- Chart 1: Daily Uploads — Line chart -->
            <div class="bg-card border-2 border-border rounded-none shadow-[5px_5px_0px_var(--shadow)] p-6 h-72">
              <h3 class="uppercase font-bold text-card-foreground text-sm border-b-2 border-border pb-2 mb-4">
                Daily Uploads
              </h3>
              <div class="h-[calc(100%-3.5rem)]">
                <Line :data="uploadsData" :options="uploadsOptions" />
              </div>
            </div>

            <!-- Chart 2: Likes per Project — Bar chart (gold) -->
            <div class="bg-card border-2 border-border rounded-none shadow-[5px_5px_0px_var(--shadow)] p-6 h-72">
              <h3 class="uppercase font-bold text-card-foreground text-sm border-b-2 border-border pb-2 mb-4">
                Likes per Project
              </h3>
              <div class="h-[calc(100%-3.5rem)]">
                <Bar :data="likesData" :options="likesOptions" />
              </div>
            </div>

            <!-- Chart 3: Comments per Project — Bar chart (black) -->
            <div class="bg-card border-2 border-border rounded-none shadow-[5px_5px_0px_var(--shadow)] p-6 h-72">
              <h3 class="uppercase font-bold text-card-foreground text-sm border-b-2 border-border pb-2 mb-4">
                Comments per Project
              </h3>
              <div class="h-[calc(100%-3.5rem)]">
                <Bar :data="commentsData" :options="commentsOptions" />
              </div>
            </div>
          </div>

          <!-- AWS architecture summary -->
          <div class="bg-card border-2 border-border rounded-none shadow-[5px_5px_0px_var(--shadow)] p-8">
            <h3 class="text-lg font-bold uppercase text-primary mb-4 border-b-2 border-border pb-2">
              AWS Architecture — Polyglot Persistence
            </h3>
            <p class="text-muted text-sm mb-6 leading-relaxed">
              ProjectHub uses three AWS services — each handling the data it's best suited for.
              Use the sidebar to dive into each service's data.
            </p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="border-2 border-border rounded-none p-4 border-l-[6px] border-l-primary">
                <p class="flex items-center gap-2 font-bold uppercase text-sm text-foreground mb-1">
                  <Database :size="14" /> Amazon RDS
                </p>
                <p class="text-muted text-xs">Projects, Comments, Likes — relational data with foreign keys</p>
              </div>
              <div class="border-2 border-border rounded-none p-4 border-l-[6px] border-l-primary">
                <p class="flex items-center gap-2 font-bold uppercase text-sm text-foreground mb-1">
                  <Cloud :size="14" /> Amazon S3
                </p>
                <p class="text-muted text-xs">Cover images &amp; research PDFs — object storage, presigned URLs</p>
              </div>
              <div class="border-2 border-border rounded-none p-4 border-l-[6px] border-l-primary">
                <p class="flex items-center gap-2 font-bold uppercase text-sm text-foreground mb-1">
                  <Zap :size="14" /> DynamoDB
                </p>
                <p class="text-muted text-xs">Audit trail — AUTH, ACCESS, DATA events with 90-day TTL</p>
              </div>
            </div>
          </div>
        </template>

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- TAB: S3 STORAGE                                                 -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <template v-if="activeTab === 's3'">
          <!-- Stat cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AdminStatCard
              v-for="card in s3Cards"
              :key="card.label"
              :label="card.label" :value="card.value"
              :subtext="card.subtext" :highlight="card.highlight"
            />
          </div>

          <!-- S3 Object listing table -->
          <!-- 🌐 API: GET /admin/s3-objects → Hono calls S3 ListObjectsV2 -->
          <!-- Returns: { Key, Size (bytes → converted to MB), LastModified } per object -->
          <div class="bg-card border-2 border-border rounded-none shadow-[6px_6px_0px_var(--shadow)] p-8">
            <h3 class="text-xl font-bold uppercase text-primary mb-2 border-b-2 border-border pb-2">
              RECENT S3 OBJECTS
            </h3>
            <p class="text-muted text-sm mb-6">
              In production, fetched via
              <code class="bg-primary/10 text-primary border border-border px-1.5 py-0.5 text-xs font-mono rounded-none">GET /admin/s3-objects</code>
              which calls S3
              <code class="bg-primary/10 text-primary border border-border px-1.5 py-0.5 text-xs font-mono rounded-none">ListObjectsV2</code>.
              Files are stored under two prefixes: <strong>covers/</strong> and <strong>pdfs/</strong>.
            </p>
            <AdminTable
              :columns="['OBJECT KEY', 'SIZE', 'LAST MODIFIED']"
              :rows="s3ObjectRows"
              :pageSize="5"
            />
          </div>
        </template>

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- TAB: RDS DATA                                                   -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <template v-if="activeTab === 'rds'">
          <section class="space-y-3">
            <div class="border-l-4 border-primary pl-3">
              <h2 class="text-base font-bold uppercase text-foreground">Projects</h2>
              <p class="text-muted text-xs">projects JOIN users</p>
            </div>
            <AdminTable
              :columns="['#', 'TITLE', 'BUILDER', 'COVER KEY', 'PDF KEY', 'DEMO URL', 'CREATED AT']"
              :rows="projectRows"
              :pageSize="5"
            />
          </section>

          <section class="space-y-3">
            <div class="border-l-4 border-primary pl-3">
              <h2 class="text-base font-bold uppercase text-foreground">Comments</h2>
              <p class="text-muted text-xs">comments JOIN users JOIN projects</p>
            </div>
            <AdminTable
              :columns="['#', 'BODY', 'BUILDER', 'PROJECT', 'CREATED AT']"
              :rows="commentRows"
              :pageSize="5"
            />
          </section>

          <section class="space-y-3">
            <div class="border-l-4 border-primary pl-3">
              <h2 class="text-base font-bold uppercase text-foreground">Likes</h2>
              <p class="text-muted text-xs">likes JOIN users JOIN projects</p>
            </div>
            <AdminTable
              :columns="['#', 'PROJECT', 'LIKED BY', 'TIMESTAMP']"
              :rows="likeRows"
              :pageSize="5"
            />
          </section>
        </template>

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- TAB: DYNAMODB LOGS                                             -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <template v-if="activeTab === 'dynamo'">
          <div class="bg-card border-2 border-border rounded-none shadow-[5px_5px_0px_var(--shadow)] p-6">
            <h3 class="text-base font-bold uppercase text-primary mb-3">DynamoDB Configuration</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-mono">
              <div>
                <p class="text-muted text-xs uppercase font-bold mb-1">Table Name</p>
                <code class="bg-primary/10 text-primary border border-border px-2 py-1 text-xs rounded-none block">projecthub-[your-name]-events</code>
              </div>
              <div>
                <p class="text-muted text-xs uppercase font-bold mb-1">Key Schema</p>
                <code class="bg-primary/10 text-primary border border-border px-2 py-1 text-xs rounded-none block">PK: userId · SK: timestamp#uuid</code>
              </div>
              <div>
                <p class="text-muted text-xs uppercase font-bold mb-1">Event Types</p>
                <code class="bg-primary/10 text-primary border border-border px-2 py-1 text-xs rounded-none block">AUTH · ACCESS · DATA</code>
              </div>
              <div>
                <p class="text-muted text-xs uppercase font-bold mb-1">TTL</p>
                <code class="bg-primary/10 text-primary border border-border px-2 py-1 text-xs rounded-none block">expiresAt — auto-deletes after 90 days</code>
              </div>
            </div>
          </div>
          <LogTabs />
        </template>

      </div>
    </main>
  </div>
</template>
