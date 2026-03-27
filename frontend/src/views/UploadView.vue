<script setup lang="ts">
// ─── Vue core imports ───────────────────────────────────────────────────────
import { ref } from 'vue'
// ─── Vue Router imports ─────────────────────────────────────────────────────
import { RouterLink } from 'vue-router'
// ─── Component imports ──────────────────────────────────────────────────────
import FileDropzone from '@/components/FileDropzone.vue'
import { Image as ImageIcon, FileText } from 'lucide-vue-next'
import { useUploadStore } from '@/stores/upload'
import { useAuthStore } from '@/stores/auth'

// ─── Local state ────────────────────────────────────────────────────────────
const uploadStore = useUploadStore()
const authStore = useAuthStore()
const title = ref('')
const description = ref('')
const demoUrl = ref('')
const tagsInput = ref('')         // Comma-separated tags string, e.g. "AWS, BUN, POSTGRESQL"
const coverFile = ref<File | null>(null)
const pdfFile = ref<File | null>(null)
const isSubmitting = ref(false)
const isSuccess = ref(false)
const submitError = ref<string | null>(null)

// ─── Methods ────────────────────────────────────────────────────────────────
// Handle file selection emits from FileDropzone components
function onCoverSelected(file: File) {
  coverFile.value = file
}
function onPdfSelected(file: File) {
  pdfFile.value = file
}

// Parse comma-separated tags string into uppercase string array
function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map(t => t.trim().toUpperCase())
    .filter(t => t.length > 0)
}

// Submit handler
async function handleSubmit() {
  const parsedTags = parseTags(tagsInput.value)
  
  // 1. Validation (Pre-Check)
  const userId = localStorage.getItem('ph_userid')
  if (!userId || !authStore.isUserIdUuid) {
    submitError.value = 'PROJECTS CAN ONLY BE SUBMITED WITH A VALID SESSION. TRY REFRESHING.'
    return
  }

  if (!title.value.trim() || title.value.length < 3) {
    submitError.value = 'TITLE MUST BE AT LEAST 3 CHARACTERS'
    return
  }
  if (!description.value.trim() || description.value.length < 10) {
    submitError.value = 'DESCRIPTION MUST BE AT LEAST 10 CHARACTERS'
    return
  }
  if (parsedTags.join(', ').length > 255) {
    submitError.value = 'TAGS ARE TOO LONG (MAX 255 CHARS)'
    return
  }
  if (!pdfFile.value) {
    submitError.value = 'A RESEARCH PDF IS REQUIRED'
    return
  }
  if (!pdfFile.value.name.toLowerCase().endsWith('.pdf')) {
    submitError.value = 'RESEARCH FILE MUST BE A PDF'
    return
  }
  
  // Basic validation already improved by backend normalization
  // No more separate S3 uploads — we send files directly in the project create call
  isSubmitting.value = true
  submitError.value = null

  try {
    // 🚀 NEW ATOMIC WAY: Send metadata + files in ONE request
    await uploadStore.submitProject({
      title: title.value,
      description: description.value,
      demoUrl: demoUrl.value.trim() || null,
      tags: parsedTags,
      coverFile: coverFile.value,
      pdfFile: pdfFile.value,
    })
    
    isSuccess.value = true
  } catch (err: any) {
    submitError.value = err.message || 'Failed to submit project. Please try again.'
    console.error('Submission error:', err)
  } finally {
    isSubmitting.value = false
  }
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
        <!-- Error Banner -->
        <div v-if="submitError" class="bg-red-500/10 border-2 border-red-500/50 p-4 text-red-500 font-bold uppercase text-xs">
          ❌ {{ submitError }}
        </div>

        <!-- PROJECT TITLE * (required) -->
        <div>
          <label for="project-title" class="block text-primary font-bold uppercase text-xs mb-1">
            PROJECT TITLE *
          </label>
          <input
            id="project-title"
            v-model="title"
            type="text"
            required
            :disabled="isSubmitting"
            placeholder="What did you build?"
            class="bg-card text-card-foreground border-2 border-border rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background px-4 py-2 w-full font-mono disabled:opacity-50"
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
            required
            :disabled="isSubmitting"
            placeholder="Tell the community about your project..."
            class="bg-card text-card-foreground border-2 border-border rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background px-4 py-2 w-full font-mono resize-none disabled:opacity-50"
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
              :disabled="isSubmitting"
              placeholder="AWS, BUN, POSTGRESQL"
              class="bg-card text-card-foreground border-2 border-border rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background px-4 py-2 w-full font-mono disabled:opacity-50"
            />
            <p class="text-muted text-xs mt-1 font-mono">Comma-separated, e.g. "AWS, PYTHON, IOT"</p>

            <!-- Live tag preview -->
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
              type="text"
              :disabled="isSubmitting"
              placeholder="google.com (or full link)"
              class="bg-card text-card-foreground border-2 border-border rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background px-4 py-2 w-full font-mono disabled:opacity-50"
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
              :disabled="isSubmitting"
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
              :disabled="isSubmitting"
              :icon="FileText"
              @file-selected="onPdfSelected"
            />
          </div>
        </div>

        <!-- SUBMIT button -->
        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full bg-primary text-primary-foreground border-2 border-border rounded-none shadow-[4px_4px_0px_var(--shadow)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_var(--shadow)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-200 font-bold uppercase py-4 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-[4px_4px_0px_var(--shadow)]"
        >
          <span v-if="isSubmitting" class="flex items-center justify-center gap-2">
            <span class="animate-spin text-xl">⏳</span> UPLOADING...
          </span>
          <span v-else>SUBMIT PROJECT →</span>
        </button>
      </form>
    </div>
  </div>
</template>
