<script setup lang="ts">
// ─── Vue core imports ───────────────────────────────────────────────────────
import { ref } from 'vue'

// ─── Props ──────────────────────────────────────────────────────────────────
const props = defineProps<{
  label: string   // "COVER IMAGE" or "RESEARCH PDF"
  accept: string  // ".jpg,.jpeg,.png" or ".pdf"
  icon: any       // Lucide component
  disabled?: boolean
}>()

// ─── Emits ──────────────────────────────────────────────────────────────────
const emit = defineEmits<{
  fileSelected: [file: File]
}>()

// ─── Local state ────────────────────────────────────────────────────────────
const selectedFile = ref<File | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

// ─── Methods ────────────────────────────────────────────────────────────────
// Trigger the hidden file input on div click
function openFilePicker() {
  if (props.disabled) return
  inputRef.value?.click()
}

// Handle file selection: update local state + emit to parent
function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  selectedFile.value = file
  emit('fileSelected', file)
}

// ─── Computed ───────────────────────────────────────────────────────────────
function truncateName(name: string, maxLen = 20) {
  if (name.length <= maxLen) return name
  const ext = name.split('.').pop()
  const base = name.split('.').slice(0, -1).join('.')
  return base.substring(0, maxLen - 5) + '...' + ext
}
</script>

<template>
  <!-- Dropzone wrapper — click triggers hidden file input -->
  <!-- Cover image dropzone: -->
  <!-- 📦 S3: In production → POST /uploads/cover (multipart) -->
  <!-- → Hono uploads to S3 as covers/{uuid}.jpg              -->
  <!-- → Returns S3 key → stored in projects.cover_image_key in RDS -->
  <!-- PDF dropzone: -->
  <!-- 📦 S3: In production → POST /uploads/pdf (multipart) -->
  <!-- → Hono uploads to S3 as pdfs/{uuid}.pdf             -->
  <!-- → Returns S3 key → stored in projects.pdf_key in RDS -->
  <div
    @click="openFilePicker"
    :class="[
      'border-2 border-dashed border-border bg-card min-h-[120px] flex flex-col items-center justify-center rounded-none transition-colors duration-200 px-4 py-6',
      disabled ? 'opacity-50 cursor-not-allowed bg-muted' : 'cursor-pointer hover:bg-primary/5'
    ]"
  >
    <!-- Default state: instructions text -->
    <template v-if="!selectedFile">
      <p class="text-muted text-sm font-mono text-center uppercase font-bold">
        DROP {{ label }} HERE
      </p>
      <p class="text-muted text-xs font-mono text-center mt-1">
        or CLICK TO BROWSE
      </p>
    </template>

    <!-- Selected state: show icon + filename in gold -->
    <template v-else>
      <p class="flex items-center justify-center gap-2 text-primary font-bold text-sm font-mono text-center">
        <component :is="icon" :size="20" /> {{ truncateName(selectedFile.name) }}
      </p>
    </template>
  </div>

  <!-- Hidden file input — triggered programmatically -->
  <input
    ref="inputRef"
    type="file"
    :accept="accept"
    class="hidden"
    @change="handleFileChange"
  />
</template>
