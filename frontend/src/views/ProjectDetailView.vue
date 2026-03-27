<script setup lang="ts">
// ─── Vue core imports ───────────────────────────────────────────────────────
import { ref, computed, onMounted } from 'vue'
// ─── Vue Router imports ─────────────────────────────────────────────────────
import { useRoute, RouterLink } from 'vue-router'
// ─── Pinia imports ──────────────────────────────────────────────────────────
import { storeToRefs } from 'pinia'
// ─── Component imports ──────────────────────────────────────────────────────
import CommentItem from '@/components/CommentItem.vue'
// ─── Store imports ──────────────────────────────────────────────────────────
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'
import { useMissionStore } from '@/stores/mission'
import {
  User,
  Image as ImageIcon,
  ExternalLink,
  FileText,
  ThumbsUp,
} from 'lucide-vue-next'
// ─── Type imports ───────────────────────────────────────────────────────────
import type { Project, Comment } from '@/types/projecthub.types'

// ─── Route ──────────────────────────────────────────────────────────────────
const route = useRoute()
const id = route.params.id as string

// ─── Store access ───────────────────────────────────────────────────────────
const { username } = storeToRefs(useAuthStore())
const projectsStore = useProjectsStore()
const missionStore = useMissionStore()

// ─── Data source ────────────────────────────────────────────────────────────
const project = ref<Project | null>(null)
const comments = ref<Comment[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const coverUrl = ref<string | null>(null)

// ─── Local state ────────────────────────────────────────────────────────────
const isLiked = ref(false)
const likeCount = ref(0)
const isSubmittingComment = ref(false)

onMounted(async () => {
  isLoading.value = true
  error.value = null
  try {
    // 1. Fetch project details
    project.value = await projectsStore.fetchProject(id)
    if (project.value) {
      likeCount.value = project.value.likes || 0
      
      // 2. Fetch cover image URL if it exists
      if (project.value.coverImageKey) {
        try {
          coverUrl.value = await projectsStore.getCoverUrl(id)
        } catch (e) {
          console.error('Failed to fetch cover URL', e)
        }
      }
    }

    // 3. Fetch comments
    comments.value = await projectsStore.fetchComments(id)
  } catch (err) {
    error.value = 'Failed to load project details'
    console.error(err)
  } finally {
    isLoading.value = false
  }
})

// New comment form
const newCommentBody = ref('')

// ─── Computed ───────────────────────────────────────────────────────────────
// Dynamic comment section heading count
const commentCount = computed(() => comments.value.length)

// ─── Methods ────────────────────────────────────────────────────────────────
// Toggle like — flips state and updates count
async function toggleLike() {
  try {
    const data = await projectsStore.toggleLike(id)
    isLiked.value = data.liked
    likeCount.value = data.count
  } catch (e) {
    console.error('Failed to toggle like', e)
  }
}

// Handle PDF download — fetches presigned URL from API
async function handlePdfDownload() {
  try {
    const url = await projectsStore.getPdfUrl(id)
    window.open(url, '_blank')
  } catch (e) {
    alert('Failed to get download link')
    console.error(e)
  }
}

// Submit a new comment
async function handleCommentSubmit() {
  if (!newCommentBody.value.trim() || isSubmittingComment.value) return
  
  isSubmittingComment.value = true
  try {
    const newComment = await projectsStore.postComment(id, newCommentBody.value.trim())
    // Prepend so the new comment appears at the top
    comments.value.unshift(newComment)
    // Clear the textarea
    newCommentBody.value = ''
    // 🏆 MISSION: Valuable Contributor
    missionStore.completeMission('COMMENT')
  } catch (e) {
    alert('Failed to post comment')
    console.error(e)
  } finally {
    isSubmittingComment.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-6 py-10">

    <!-- ── Loading State ──────────────────────────────────────────────────── -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-24 gap-6">
      <p class="text-muted font-bold uppercase text-sm font-mono animate-pulse">LOADING PROJECT...</p>
    </div>

    <!-- ── API Error State ────────────────────────────────────────────────── -->
    <div v-else-if="error" class="text-center py-12">
      <div class="bg-card border-2 border-border rounded-none shadow-[5px_5px_0px_var(--shadow)] p-10">
        <p class="font-bold uppercase text-2xl text-foreground mb-4">{{ error }}</p>
        <RouterLink
          :to="{ name: 'feed' }"
          class="bg-card text-card-foreground border-2 border-border rounded-none shadow-[4px_4px_0px_var(--shadow)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_var(--shadow)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-200 font-bold uppercase px-6 py-3 inline-block"
        >
          ← BACK TO FEED
        </RouterLink>
      </div>
    </div>

    <!-- ── Not Found State ────────────────────────────────────────────────── -->
    <div
      v-else-if="!project"
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
    <template v-else>

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

      <!-- Cover image -->
      <div v-if="!coverUrl"
        class="bg-card border-2 border-border rounded-none h-48 flex items-center justify-center mb-6">
        <span class="flex items-center gap-2 text-muted font-mono text-sm">
          <ImageIcon :size="18" /> NO COVER IMAGE
        </span>
      </div>
      <img v-else :src="coverUrl" alt="Cover"
        class="w-full h-48 object-cover border-2 border-border mb-6 shadow-[4px_4px_0px_var(--shadow)]" />

      <!-- About this project (accent card with gold left border) -->
      <div class="bg-card text-card-foreground border-2 border-border border-l-[6px] border-l-primary rounded-none shadow-[5px_5px_0px_var(--shadow)] p-6 mb-6">
        <p class="text-primary font-bold uppercase text-xs mb-3">ABOUT THIS PROJECT</p>
        <p class="text-card-foreground text-sm leading-relaxed">{{ project.description }}</p>
      </div>

      <!-- Action Buttons Row -->
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <!-- Live demo button (only if demoUrl exists) -->
        <a
          v-if="project.demoUrl"
          :href="project.demoUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex-1 bg-card text-card-foreground border-2 border-border rounded-none shadow-[4px_4px_0px_var(--shadow)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_var(--shadow)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-200 font-bold uppercase text-center py-3"
        >
          <div class="flex items-center justify-center gap-2">
            <ExternalLink :size="18" /> VIEW LIVE DEMO →
          </div>
        </a>

        <!-- PDF download button -->
        <button
          @click="handlePdfDownload"
          class="flex-1 bg-primary text-primary-foreground border-2 border-border rounded-none shadow-[4px_4px_0px_var(--shadow)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_var(--shadow)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-200 font-bold uppercase py-3"
        >
          <div class="flex items-center justify-center gap-2">
            <FileText :size="18" /> DOWNLOAD RESEARCH PDF →
          </div>
        </button>
      </div>

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
        <p class="text-muted text-xs mb-3">Posting as: {{ username || 'Anonymous' }}</p>

        <!-- Textarea -->
        <textarea
          id="comment-textarea"
          v-model="newCommentBody"
          rows="4"
          placeholder="Write something thoughtful..."
          :disabled="isSubmittingComment"
          class="bg-card text-card-foreground border-2 border-border rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background px-4 py-2 w-full font-mono text-sm resize-none mb-4"
        ></textarea>

        <!-- Submit button — right-aligned -->
        <div class="flex justify-end">
          <button
            @click="handleCommentSubmit"
            :disabled="isSubmittingComment || !newCommentBody.trim()"
            class="bg-primary text-primary-foreground border-2 border-border rounded-none shadow-[4px_4px_0px_var(--shadow)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_var(--shadow)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-200 font-bold uppercase px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSubmittingComment ? 'POSTING...' : 'POST COMMENT →' }}
          </button>
        </div>
      </div>

    </template>
  </div>
</template>
