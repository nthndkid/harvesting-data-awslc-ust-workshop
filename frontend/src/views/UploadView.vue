<script setup lang="ts">
// ─── Vue core imports ───────────────────────────────────────────────────────
import { ref } from 'vue'
// ─── Vue Router imports ─────────────────────────────────────────────────────
import { RouterLink } from 'vue-router'
// ─── Component imports ──────────────────────────────────────────────────────
import FileDropzone from '@/components/FileDropzone.vue'
import { Image as ImageIcon, FileText } from 'lucide-vue-next'
import { useMissionStore } from '@/stores/mission'

// ─── Local state ────────────────────────────────────────────────────────────
const missionStore = useMissionStore()
const title = ref('')
const description = ref('')
const demoUrl = ref('')
const tagsInput = ref('')         // Comma-separated tags string, e.g. "AWS, BUN, POSTGRESQL"
const coverFile = ref<File | null>(null)
const pdfFile = ref<File | null>(null)
const isSubmitting = ref(false)
const isSuccess = ref(false)

// ─── Methods ────────────────────────────────────────────────────────────────
// Handle file selection emits from FileDropzone components
function onCoverSelected(file: File) {
  coverFile.value = file
}
function onPdfSelected(file: File) {
  pdfFile.value = file
}

// Parse comma-separated tags string into uppercase string array
// e.g. "aws, bun, postgresql" → ['AWS', 'BUN', 'POSTGRESQL']
function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map(t => t.trim().toUpperCase())
    .filter(t => t.length > 0)
}

// Submit handler — validates, simulates API delay, shows success state
async function handleSubmit() {
  // Basic validation — title, description, and PDF are required
  // Cover image and demo URL are optional
  if (!title.value.trim() || !description.value.trim() || !pdfFile.value) return

  isSubmitting.value = true

  // 🌐 API: POST /uploads/cover → S3 PutObject → returns cover_image_key
  // 🌐 API: POST /uploads/pdf → S3 PutObject → returns pdf_key
  // 🌐 API: POST /projects → inserts into RDS projects table
  //         → project includes: title, description, tags, demoUrl, cover_image_key, pdf_key
  //         → writes transaction log to DynamoDB (PROJECT CREATE)
  // Currently: simulating with an 800ms delay
  const _tags = parseTags(tagsInput.value)  // Tags ready for API payload
  await new Promise(resolve => setTimeout(resolve, 800))

  missionStore.completeMission('UPLOAD')
  isSubmitting.value = false
  isSuccess.value = true
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-10">

    <!-- ── Page heading ───────────────────────────────────────────────────── -->
    <div class="border-l-[6px] border-primary pl-4 mb-8">
      <h1 class="text-4xl font-bold uppercase text-foreground tracking-wide">UPLOAD PROJECT</h1>
      <p class="text-muted text-sm mt-1">Share your build with the community</p>
    </div>

    <!-- ── Form card ──────────────────────────────────────────────────────── -->
    <div class="max-w-4xl mx-auto bg-card border-2 border-border rounded-none shadow-[6px_6px_0px_var(--shadow)] p-10">

      <!-- ── SUCCESS STATE (replaces form) ──────────────────────────────── -->
      <div
        v-if="isSuccess"
        class="flex flex-col items-center justify-center py-10 text-center gap-4"
      >
        <!-- Large checkmark in gold -->
        <span class="text-primary text-6xl">✓</span>
        <h2 class="text-2xl font-bold uppercase text-foreground mt-2">PROJECT SUBMITTED!</h2>
        <p class="text-muted text-sm">Your build is now live on the feed.</p>
        <RouterLink
          :to="{ name: 'feed' }"
          class="bg-card text-card-foreground border-2 border-border rounded-none shadow-[4px_4px_0px_var(--shadow)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_var(--shadow)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-200 font-bold uppercase px-6 py-3 mt-2"
        >
          ← BACK TO FEED
        </RouterLink>
      </div>

      <!-- ── FORM STATE ──────────────────────────────────────────────────── -->
      <form
        v-else
        @submit.prevent="handleSubmit"
        class="space-y-6"
      >
        <!-- PROJECT TITLE * (required) -->
        <div>
          <label for="project-title" class="block text-primary font-bold uppercase text-xs mb-1">
            PROJECT TITLE *
          </label>
          <input
            id="project-title"
            v-model="title"
            type="text"
            placeholder="What did you build?"
            class="bg-card text-card-foreground border-2 border-border rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background px-4 py-2 w-full font-mono"
          />
        </div>

        <!-- DESCRIPTION * (required) -->
        <div>
          <label for="project-desc" class="block text-primary font-bold uppercase text-xs mb-1">
            DESCRIPTION *
          </label>
          <textarea
            id="project-desc"
            v-model="description"
            rows="4"
            placeholder="Tell the community about your project..."
            class="bg-card text-card-foreground border-2 border-border rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background px-4 py-2 w-full font-mono resize-none"
          ></textarea>
        </div>

        <!-- TAGS & DEMO URL -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- TAGS -->
          <div>
            <label for="project-tags" class="block text-primary font-bold uppercase text-xs mb-1">
              TAGS
            </label>
            <input
              id="project-tags"
              v-model="tagsInput"
              type="text"
              placeholder="AWS, BUN, POSTGRESQL"
              class="bg-card text-card-foreground border-2 border-border rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background px-4 py-2 w-full font-mono"
            />
            <p class="text-muted text-xs mt-1 font-mono">Comma-separated, e.g. "AWS, PYTHON, IOT"</p>

            <!-- Live tag preview — renders badges as the user types -->
            <div v-if="tagsInput.trim()" class="flex flex-wrap gap-2 mt-3">
              <span
                v-for="tag in parseTags(tagsInput)"
                :key="tag"
                class="inline-block bg-card text-card-foreground border-2 border-border rounded-none uppercase text-xs font-bold px-2 py-1"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- LIVE DEMO URL -->
          <div>
            <label for="demo-url" class="block text-primary font-bold uppercase text-xs mb-1">
              LIVE DEMO URL
            </label>
            <input
              id="demo-url"
              v-model="demoUrl"
              type="url"
              placeholder="https://your-demo.vercel.app"
              class="bg-card text-card-foreground border-2 border-border rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background px-4 py-2 w-full font-mono"
            />
          </div>
        </div>

        <!-- COVER & PDF -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- COVER IMAGE -->
          <div>
            <label class="block text-primary font-bold uppercase text-xs mb-1">
              COVER IMAGE
            </label>
            <FileDropzone
              label="COVER IMAGE"
              accept=".jpg,.jpeg,.png"
              :icon="ImageIcon"
              @file-selected="onCoverSelected"
            />
          </div>

          <!-- RESEARCH PDF * (required) -->
          <div>
            <label class="block text-primary font-bold uppercase text-xs mb-1">
              RESEARCH PDF *
            </label>
            <FileDropzone
              label="RESEARCH PDF"
              accept=".pdf"
              :icon="FileText"
              @file-selected="onPdfSelected"
            />
          </div>
        </div>

        <!-- SUBMIT button — full width, shows "SUBMITTING..." during delay -->
        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full bg-primary text-primary-foreground border-2 border-border rounded-none shadow-[4px_4px_0px_var(--shadow)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_var(--shadow)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-200 font-bold uppercase py-4 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[4px_4px_0px_var(--shadow)]"
        >
          {{ isSubmitting ? 'SUBMITTING...' : 'SUBMIT PROJECT →' }}
        </button>
      </form>
    </div>
  </div>
</template>
