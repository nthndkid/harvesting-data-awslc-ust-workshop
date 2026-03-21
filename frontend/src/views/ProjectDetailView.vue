<script setup lang="ts">
// ─── Vue core imports ───────────────────────────────────────────────────────
import { ref, computed } from 'vue'
// ─── Vue Router imports ─────────────────────────────────────────────────────
import { useRoute, RouterLink } from 'vue-router'
// ─── Pinia imports ──────────────────────────────────────────────────────────
import { storeToRefs } from 'pinia'
// ─── Component imports ──────────────────────────────────────────────────────
import CommentItem from '@/components/CommentItem.vue'
// ─── Store imports ──────────────────────────────────────────────────────────
import { useAuthStore } from '@/stores/auth'
import {
  User,
  Image as ImageIcon,
  ExternalLink,
  FileText,
  ThumbsUp,
} from 'lucide-vue-next'
// ─── Type imports ───────────────────────────────────────────────────────────
import type { Comment } from '@/types/projecthub.types'
// ─── Data imports ───────────────────────────────────────────────────────────
import { mockProjects, mockComments } from '@/data/mockData'

// ─── Route ──────────────────────────────────────────────────────────────────
const route = useRoute()
const id = route.params.id as string

// ─── Store access ───────────────────────────────────────────────────────────
const { username } = storeToRefs(useAuthStore())

// ─── Data source ────────────────────────────────────────────────────────────
// 🌐 API: GET /projects/:id
// → Returns single project from RDS PostgreSQL
// Currently: finding by id in mockProjects array
const project = mockProjects.find(p => p.id === id)

// Load comments for this project into local ref (so new comments can be added)
// 🌐 API: GET /projects/:id/comments
// Currently: filtering mockComments by projectId
const comments = ref<Comment[]>(
  mockComments.filter(c => c.projectId === id)
)

// ─── Local state ────────────────────────────────────────────────────────────
// Like toggle — local state only in mock build
const isLiked = ref(false)
const likeCount = ref(project?.likes ?? 0)

// New comment form
const newCommentBody = ref('')

// ─── Computed ───────────────────────────────────────────────────────────────
// Dynamic comment section heading count
const commentCount = computed(() => comments.value.length)

// ─── Methods ────────────────────────────────────────────────────────────────
// Toggle like — flips state and updates count
// 🌐 API: POST /projects/:id/like
// → Hono toggles like in RDS likes table
// → Writes transaction log to DynamoDB (LIKE or UNLIKE)
function toggleLike() {
  if (isLiked.value) {
    likeCount.value--
  } else {
    likeCount.value++
  }
  isLiked.value = !isLiked.value
}

// Handle PDF download — shows alert in mock build (S3 not connected)
// 🌐 API: GET /projects/:id/download-pdf
// → Hono calls S3 GetObject presigned URL (15min expiry)
// → Open the returned URL in a new tab
function handlePdfDownload() {
  window.alert('PDF download coming soon — S3 not connected yet')
}

// Submit a new comment — prepends to list
// 🌐 API: POST /projects/:id/comments
// → Inserts into RDS comments table
// → Writes transaction log to DynamoDB (COMMENT CREATE)
function handleCommentSubmit() {
  // Validate — must not be empty
  if (!newCommentBody.value.trim()) return

  const newComment: Comment = {
    id: Date.now().toString(),
    projectId: id,
    author: username.value ?? 'Anonymous',
    body: newCommentBody.value.trim(),
    createdAt: new Date().toISOString().split('T')[0]!, // YYYY-MM-DD format
  }

  // Prepend so the new comment appears at the top
  comments.value.unshift(newComment)

  // Clear the textarea
  newCommentBody.value = ''
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-6 py-10">

    <!-- ── Not Found State ────────────────────────────────────────────────── -->
    <!-- Shown when the project id doesn't match any mock project -->
    <div
      v-if="!project"
      class="flex flex-col items-center justify-center py-24 gap-6"
    >
      <div class="bg-card border-2 border-border rounded-none shadow-[5px_5px_0px_var(--shadow)] p-10 text-center">
        <p class="font-bold uppercase text-2xl text-foreground mb-4">PROJECT NOT FOUND</p>
        <RouterLink
          :to="{ name: 'feed' }"
          class="bg-card text-card-foreground border-2 border-border rounded-none shadow-[4px_4px_0px_var(--shadow)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_var(--shadow)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-200 font-bold uppercase px-6 py-3 inline-block"
        >
          ← BACK TO FEED
        </RouterLink>
      </div>
    </div>

    <!-- ── Project Detail ─────────────────────────────────────────────────── -->
    <template v-if="project">

      <!-- Back link -->
      <RouterLink
        :to="{ name: 'feed' }"
        class="text-primary font-bold uppercase text-sm hover:underline inline-block mb-6"
      >
        ← BACK TO FEED
      </RouterLink>

      <!-- Project title -->
      <h1 class="text-3xl font-bold uppercase text-foreground leading-tight">
        {{ project.title }}
      </h1>

      <!-- Author + date -->
      <p class="flex items-center gap-1 text-muted text-sm mt-2">
        <User :size="14" /> {{ project.author }} · {{ project.createdAt }}
      </p>

      <!-- Gold divider -->
      <hr class="border-t-2 border-primary my-6" />

      <!-- Cover image placeholder -->
      <!-- 🌐 API: GET /projects/:id/cover -->
      <!-- → Hono calls S3 GetObject → returns presigned URL (15min) -->
      <!-- → Replace placeholder with: <img :src="coverUrl" class="w-full h-48 object-cover" /> -->
      <div class="bg-card border-2 border-border rounded-none h-48 flex items-center justify-center mb-6">
        <span class="flex items-center gap-2 text-muted font-mono text-sm">
          <ImageIcon :size="18" /> COVER IMAGE
        </span>
      </div>

      <!-- About this project (accent card with gold left border) -->
      <div class="bg-card text-card-foreground border-2 border-border border-l-[6px] border-l-primary rounded-none shadow-[5px_5px_0px_var(--shadow)] p-6 mb-6">
        <p class="text-primary font-bold uppercase text-xs mb-3">ABOUT THIS PROJECT</p>
        <p class="text-card-foreground text-sm leading-relaxed">{{ project.description }}</p>
      </div>

      <!-- Live demo button (only if demoUrl exists) -->
      <a
        v-if="project.demoUrl"
        :href="project.demoUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="block w-full bg-card text-card-foreground border-2 border-border rounded-none shadow-[4px_4px_0px_var(--shadow)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_var(--shadow)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-200 font-bold uppercase text-center py-3 mb-4"
      >
        <div class="flex items-center justify-center gap-2">
          <ExternalLink :size="18" /> VIEW LIVE DEMO →
        </div>
      </a>

      <!-- PDF download button (always rendered — every project has a PDF) -->
      <button
        @click="handlePdfDownload"
        class="block w-full bg-primary text-primary-foreground border-2 border-border rounded-none shadow-[4px_4px_0px_var(--shadow)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_var(--shadow)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-200 font-bold uppercase py-3 mb-6"
      >
        <div class="flex items-center justify-center gap-2">
          <FileText :size="18" /> DOWNLOAD RESEARCH PDF →
        </div>
      </button>

      <!-- Tag badges -->
      <div class="flex flex-wrap gap-2 mb-6">
        <span
          v-for="tag in project.tags"
          :key="tag"
          class="inline-block bg-primary text-primary-foreground border-2 border-border rounded-none uppercase text-xs font-bold px-2 py-1"
        >
          {{ tag }}
        </span>
      </div>

      <!-- Like toggle button -->
      <!-- Unliked: ghost button | Liked: primary gold button -->
      <button
        @click="toggleLike"
        :class="[
          'w-full border-2 border-border rounded-none shadow-[4px_4px_0px_var(--shadow)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_var(--shadow)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-200 font-bold uppercase py-3 mb-8',
          isLiked
            ? 'bg-primary text-primary-foreground'
            : 'bg-card text-card-foreground'
        ]"
      >
        <div class="flex items-center justify-center gap-2">
          <ThumbsUp :size="18" /> {{ isLiked ? `LIKED (${likeCount})` : `LIKE (${likeCount})` }}
        </div>
      </button>

      <!-- ── Comments section ────────────────────────────────────────────── -->
      <div class="border-l-[6px] border-primary pl-4 mb-6">
        <h2 class="text-2xl font-bold uppercase text-foreground">
          COMMENTS ({{ commentCount }})
        </h2>
      </div>

      <!-- Comment list -->
      <div class="flex flex-col gap-4 mb-8">
        <CommentItem
          v-for="comment in comments"
          :key="comment.id"
          :comment="comment"
        />
        <!-- Empty comments state -->
        <p v-if="comments.length === 0" class="text-muted text-sm">
          No comments yet — be the first!
        </p>
      </div>

      <!-- ── Add comment form ────────────────────────────────────────────── -->
      <div class="bg-card border-2 border-border rounded-none shadow-[5px_5px_0px_var(--shadow)] p-6">
        <!-- Label + posting-as hint -->
        <label for="comment-textarea" class="text-primary font-bold uppercase text-xs block mb-1">
          YOUR COMMENT
        </label>
        <p class="text-muted text-xs mb-3">Posting as: {{ username }}</p>

        <!-- Textarea -->
        <textarea
          id="comment-textarea"
          v-model="newCommentBody"
          rows="4"
          placeholder="Write something thoughtful..."
          class="bg-card text-card-foreground border-2 border-border rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background px-4 py-2 w-full font-mono text-sm resize-none mb-4"
        ></textarea>

        <!-- Submit button — right-aligned -->
        <div class="flex justify-end">
          <button
            @click="handleCommentSubmit"
            class="bg-primary text-primary-foreground border-2 border-border rounded-none shadow-[4px_4px_0px_var(--shadow)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_var(--shadow)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-200 font-bold uppercase px-6 py-2"
          >
            POST COMMENT →
          </button>
        </div>
      </div>

    </template>
  </div>
</template>
