<script setup lang="ts">
// ─── Vue core imports ───────────────────────────────────────────────────────
import { ref, onMounted, computed } from 'vue'
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
import AdminStatCard from '@/components/AdminStatCard.vue'
import AdminTable from '@/components/AdminTable.vue'
import LogTabs from '@/components/LogTabs.vue'
import ErrorState from '@/components/ErrorState.vue'
import { useAdminStore } from '@/stores/admin'
import { useMissionStore } from '@/stores/mission'
import {
  LayoutDashboard,
  Cloud,
  Database,
  Zap,
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'

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

// ─── Store access ───────────────────────────────────────────────────────────
const adminStore = useAdminStore()
const { projects, comments, likes, s3Stats, s3Objects, loading } = storeToRefs(adminStore)
const missionStore = useMissionStore()

// ─── Chart Data (Computed) ──────────────────────────────────────────────────
const uploadsData = computed(() => ({
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [{
    label: 'Uploads',
    data: [2, 4, 1, 5, 3, 6, 3], // Mocked as timeline data requires processing
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
}))

const likesData = computed(() => ({
  labels: projects.value.map(p => p.title.slice(0, 10)),
  datasets: [{
    label: 'Likes',
    data: projects.value.map(p => p.likes),
    backgroundColor: C_PRIMARY,
    borderColor: C_BORDER,
    borderWidth: 2,
  }],
}))

const commentsData = computed(() => ({
  labels: projects.value.map(p => p.title.slice(0, 10)),
  datasets: [{
    label: 'Comments',
    data: projects.value.map(p => p.comments),
    backgroundColor: C_FG,
    borderColor: C_PRIMARY,
    borderWidth: 2,
  }],
}))

const uploadsOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip },
  scales: {
    x: { ticks: tick, grid, border: axisBorder },
    y: { beginAtZero: true, ticks: { ...tick, stepSize: 2 }, grid, border: axisBorder },
  },
}

const likesOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip },
  scales: {
    x: { ticks: { ...tick, maxRotation: 35 }, grid: { display: false }, border: axisBorder },
    y: { beginAtZero: true, ticks: { ...tick, stepSize: 5 }, grid, border: axisBorder },
  },
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

// ─── Stat cards ─────────────────────────────────────────────────────────────
const overviewCards = computed(() => [
  { label: 'TOTAL PROJECTS', value: String(projects.value.length), subtext: 'in RDS database',    highlight: false },
  { label: 'TOTAL COMMENTS', value: String(comments.value.length), subtext: 'across all projects', highlight: false },
  { label: 'TOTAL LIKES',    value: String(likes.value.length),    subtext: 'across all projects', highlight: true  },
])

const s3Cards = computed(() => [
  { label: 'TOTAL FILES',   value: String(s3Stats.value?.fileCount ?? 0), subtext: 'cover images + PDFs',  highlight: false },
  { label: 'STORAGE USED',  value: `${s3Stats.value?.storageMB ?? 0} MB`, subtext: 'S3 object storage', highlight: false },
  { label: 'BUCKET REGION', value: s3Stats.value?.bucketRegion ?? '—',      subtext: 'AWS infrastructure', highlight: true  },
])

// ─── Table rows ──────────────────────────────────────────────────────────────
const projectRows = computed(() => projects.value.map((p, i) => [
  String(i + 1), p.title, p.author,
  p.coverImageKey ?? '—', p.pdfKey ?? '—', p.demoUrl ?? '—', p.createdAt,
]))

const commentRows = computed(() => comments.value.map((c, i) => {
  const proj = projects.value.find(p => p.id === c.projectId)
  return [
    String(i + 1),
    c.body.length > 60 ? c.body.slice(0, 60) + '...' : c.body,
    c.author, proj?.title ?? '—', c.createdAt,
  ]
}))

const likeRows = computed(() => likes.value.map((l, i) => [
  String(i + 1), l.projectTitle || '—', l.likedBy, l.createdAt,
]))

const s3Rows = computed(() => (s3Objects?.value || []).map((obj, i) => [
  String(i + 1), obj.key, `${obj.sizeMB} MB`, String(obj.lastModified),
]))

// ─── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    await adminStore.fetchAll()
    // 🏆 Gamification Trigger
    missionStore.completeMission('ADMIN')
  } catch (err) {
    console.error('Failed to load admin data', err)
  }
})
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

        <!-- ── Loading State ──────────────────────────────────────────────────── -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-24 gap-6">
          <p class="text-muted font-bold uppercase text-sm font-mono animate-pulse">FETCHING UPDATES...</p>
        </div>

        <template v-else>
          <!-- Dynamic heading -->
          <div class="border-l-[6px] border-primary pl-4">
            <h1 class="text-4xl font-bold uppercase text-foreground tracking-wide">
              {{ headings[activeTab].title }}
            </h1>
            <p class="text-muted text-sm mt-1">{{ headings[activeTab].sub }}</p>
          </div>

          <!-- TAB: OVERVIEW -->
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

            <!-- Charts grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="bg-card border-2 border-border rounded-none shadow-[5px_5px_0px_var(--shadow)] p-6 h-72">
                <h3 class="uppercase font-bold text-card-foreground text-sm border-b-2 border-border pb-2 mb-4">
                  Daily Uploads
                </h3>
                <div class="h-[calc(100%-3.5rem)]">
                  <Line :data="uploadsData" :options="uploadsOptions" />
                </div>
              </div>

              <div class="bg-card border-2 border-border rounded-none shadow-[5px_5px_0px_var(--shadow)] p-6 h-72">
                <h3 class="uppercase font-bold text-card-foreground text-sm border-b-2 border-border pb-2 mb-4">
                  Likes per Project
                </h3>
                <div class="h-[calc(100%-3.5rem)]">
                  <Bar v-if="projects.length" :data="likesData" :options="likesOptions" />
                  <p v-else class="text-muted text-xs h-full flex items-center justify-center">No data</p>
                </div>
              </div>

              <div class="bg-card border-2 border-border rounded-none shadow-[5px_5px_0px_var(--shadow)] p-6 h-72">
                <h3 class="uppercase font-bold text-card-foreground text-sm border-b-2 border-border pb-2 mb-4">
                  Comments per Project
                </h3>
                <div class="h-[calc(100%-3.5rem)]">
                  <Bar v-if="projects.length" :data="commentsData" :options="commentsOptions" />
                  <p v-else class="text-muted text-xs h-full flex items-center justify-center">No data</p>
                </div>
              </div>
            </div>

            <!-- Architecture summary -->
            <div class="bg-card border-2 border-border rounded-none shadow-[5px_5px_0px_var(--shadow)] p-8">
              <h3 class="text-lg font-bold uppercase text-primary mb-4 border-b-2 border-border pb-2">
                AWS Architecture — Polyglot Persistence
              </h3>
              <p class="text-muted text-sm mb-6 leading-relaxed">
                ProjectHub uses three AWS services — each handling the data it's best suited for.
              </p>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="border-2 border-border rounded-none p-4 border-l-[6px] border-l-primary">
                  <p class="flex items-center gap-2 font-bold uppercase text-sm text-foreground mb-1">
                    <Database :size="14" /> Amazon RDS
                  </p>
                  <p class="text-muted text-xs">Projects, Comments, Likes — relational data</p>
                </div>
                <div class="border-2 border-border rounded-none p-4 border-l-[6px] border-l-primary">
                  <p class="flex items-center gap-2 font-bold uppercase text-sm text-foreground mb-1">
                    <Cloud :size="14" /> Amazon S3
                  </p>
                  <p class="text-muted text-xs">Cover images & PDFs — object storage</p>
                </div>
                <div class="border-2 border-border rounded-none p-4 border-l-[6px] border-l-primary">
                  <p class="flex items-center gap-2 font-bold uppercase text-sm text-foreground mb-1">
                    <Zap :size="14" /> DynamoDB
                  </p>
                  <p class="text-muted text-xs">Audit trail — NoSQL event logging</p>
                </div>
              </div>
            </div>
          </template>

          <!-- TAB: S3 STORAGE -->
          <template v-if="activeTab === 's3'">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <AdminStatCard
                v-for="card in s3Cards"
                :key="card.label"
                :label="card.label" :value="card.value"
                :subtext="card.subtext" :highlight="card.highlight"
              />
            </div>

            <div class="bg-card border-2 border-border rounded-none shadow-[6px_6px_0px_var(--shadow)] p-8">
              <h3 class="text-xl font-bold uppercase text-primary mb-2 border-b-2 border-border pb-2">
                S3 OBJECT LISTING
              </h3>
              <p class="text-muted text-sm mb-6">
                Active binary objects stored in your bucket.
              </p>
              
              <AdminTable
                v-if="s3Objects && s3Objects.length"
                :columns="['#', 'OBJECT KEY', 'SIZE', 'LAST MODIFIED']"
                :rows="s3Rows"
                :pageSize="10"
              />
              <p v-else class="text-sm font-mono text-center py-10 border-2 border-dashed border-border text-muted">
                NO OBJECTS FOUND IN BUCKET
              </p>
            </div>
          </template>

          <!-- TAB: RDS DATA -->
          <template v-if="activeTab === 'rds'">
            <section class="space-y-3">
              <div class="border-l-4 border-primary pl-3">
                <h2 class="text-base font-bold uppercase text-foreground">Projects</h2>
                <p class="text-muted text-xs">projects table in PostgreSQL</p>
              </div>
              <AdminTable
                v-if="projects.length"
                :columns="['#', 'TITLE', 'BUILDER', 'COVER KEY', 'PDF KEY', 'DEMO URL', 'CREATED AT']"
                :rows="projectRows"
                :pageSize="5"
              />
              <p v-else class="text-muted text-sm italic">No projects found in RDS.</p>
            </section>

            <section class="space-y-3">
              <div class="border-l-4 border-primary pl-3">
                <h2 class="text-base font-bold uppercase text-foreground">Comments</h2>
                <p class="text-muted text-xs">comments table in PostgreSQL</p>
              </div>
              <AdminTable
                v-if="comments.length"
                :columns="['#', 'BODY', 'BUILDER', 'PROJECT', 'CREATED AT']"
                :rows="commentRows"
                :pageSize="5"
              />
              <p v-else class="text-muted text-sm italic">No comments found in RDS.</p>
            </section>

            <section class="space-y-3">
              <div class="border-l-4 border-primary pl-3">
                <h2 class="text-base font-bold uppercase text-foreground">Likes</h2>
                <p class="text-muted text-xs">likes table in PostgreSQL</p>
              </div>
              <AdminTable
                v-if="likes.length"
                :columns="['#', 'PROJECT', 'LIKED BY', 'TIMESTAMP']"
                :rows="likeRows"
                :pageSize="5"
              />
              <p v-else class="text-muted text-sm italic">No likes found in RDS.</p>
            </section>
          </template>

          <!-- TAB: DYNAMODB LOGS -->
          <template v-if="activeTab === 'dynamo'">
            <LogTabs />
          </template>
        </template>
      </div>
    </main>
  </div>
</template>
