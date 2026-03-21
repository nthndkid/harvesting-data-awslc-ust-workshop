<script setup lang="ts">
// ─── Vue Router imports ─────────────────────────────────────────────────────
import { RouterLink } from 'vue-router'
// ─── Component imports ──────────────────────────────────────────────────────
import { ExternalLink, User, ThumbsUp, MessageSquare } from 'lucide-vue-next'
// ─── Type imports ───────────────────────────────────────────────────────────
import type { Project } from '@/types/projecthub.types'

// ─── Props ──────────────────────────────────────────────────────────────────
// All content comes from the parent — nothing hardcoded in this component
const props = defineProps<{
  project: Project
}>()
</script>

<template>
  <!-- Project card — full card hover lifts (neobrutalist effect) -->
  <div class="bg-card border-2 border-border rounded-none shadow-[5px_5px_0px_var(--shadow)] hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[8px_8px_0px_var(--shadow)] transition-all duration-200 p-6 flex flex-col gap-3">

    <!-- ── Badge row: PROJECT badge + tag badges ───────────────────────────── -->
    <div class="flex flex-wrap gap-2">
      <!-- "PROJECT" — always shown, gold filled -->
      <span class="inline-block bg-primary text-primary-foreground border-2 border-border rounded-none uppercase text-xs font-bold px-2 py-1">
        PROJECT
      </span>
      <!-- Tag badges — ghost style, only rendered if tags exist -->
      <span
        v-for="tag in project.tags"
        :key="tag"
        class="inline-block bg-card text-card-foreground border-2 border-border rounded-none uppercase text-xs font-bold px-2 py-1"
      >
        {{ tag }}
      </span>
    </div>

    <!-- ── Title ───────────────────────────────────────────────────────────── -->
    <h2 class="font-bold uppercase text-lg text-card-foreground line-clamp-2 leading-snug">
      {{ project.title }}
    </h2>

    <!-- ── Description ────────────────────────────────────────────────────── -->
    <p class="text-muted text-sm line-clamp-3 leading-relaxed">
      {{ project.description }}
    </p>

    <!-- ── Demo URL (hidden when null) ────────────────────────────────────── -->
    <a
      v-if="project.demoUrl"
      :href="project.demoUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="text-primary text-xs font-mono hover:underline truncate block"
    >
      <div class="flex items-center gap-1">
        <ExternalLink :size="12" />
        {{ project.demoUrl }}
      </div>
    </a>

    <!-- ── Author + date ──────────────────────────────────────────────────── -->
    <p class="text-muted text-xs">
      <span class="flex items-center gap-1">
        <User :size="12" /> {{ project.author }} · {{ project.createdAt }}
      </span>
    </p>

    <!-- ── Action row: likes / comments / view link ───────────────────────── -->
    <div class="flex items-center gap-3 mt-auto pt-2">
      <!-- Likes — display only on feed card (no interaction here) -->
      <span class="bg-card text-card-foreground border-2 border-border rounded-none text-xs font-bold uppercase px-3 py-1 flex items-center gap-1">
        <ThumbsUp :size="14" /> {{ project.likes }}
      </span>
      <!-- Comments — display only -->
      <span class="bg-card text-card-foreground border-2 border-border rounded-none text-xs font-bold uppercase px-3 py-1 flex items-center gap-1">
        <MessageSquare :size="14" /> {{ project.comments }}
      </span>
      <!-- VIEW → navigates to the project detail page -->
      <!-- RouterLink inside card — not the full card, just this button -->
      <RouterLink
        :to="{ name: 'project-detail', params: { id: project.id } }"
        class="ml-auto bg-primary text-primary-foreground border-2 border-border rounded-none shadow-[4px_4px_0px_var(--shadow)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_var(--shadow)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-200 font-bold uppercase text-xs px-4 py-2"
      >
        VIEW →
      </RouterLink>
    </div>
  </div>
</template>
