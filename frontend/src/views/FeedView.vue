<script setup lang="ts">
// ─── Vue core imports ───────────────────────────────────────────────────────
import { onMounted } from 'vue'
// ─── Router imports ─────────────────────────────────────────────────────────
import { RouterLink } from 'vue-router'
// ─── Store imports ──────────────────────────────────────────────────────────
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '@/stores/projects'
// ─── Component imports ──────────────────────────────────────────────────────
import ProjectCard from '@/components/ProjectCard.vue'

const store = useProjectsStore()
const { projects, loading, error } = storeToRefs(store)

onMounted(() => {
  store.fetchProjects()
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-10">

    <!-- ── Page heading (gold left border pattern) ─────────────────────────── -->
    <div class="border-l-[6px] border-primary pl-4 mb-8">
      <h1 class="text-4xl font-bold uppercase text-foreground tracking-wide">PROJECT FEED</h1>
      <p class="text-muted text-sm mt-1">Builds from the community</p>
    </div>

    <!-- ── Loading State ──────────────────────────────────────────────────── -->
    <div v-if="loading"
      class="text-muted text-center py-12 font-bold uppercase tracking-wide font-mono animate-pulse">
      LOADING...
    </div>

    <!-- ── API Error State ────────────────────────────────────────────────── -->
    <div v-else-if="error" class="text-center py-12">
      <p class="font-bold uppercase text-foreground">{{ error }}</p>
      <button @click="store.fetchProjects()"
        class="bg-card text-card-foreground border-2 border-border rounded-none
               shadow-[4px_4px_0px_var(--shadow)] hover:-translate-x-[2px]
               hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_var(--shadow)]
               active:translate-x-0 active:translate-y-0 active:shadow-none
               transition-all duration-200 font-bold uppercase px-4 py-2 mt-4">
        TRY AGAIN →
      </button>
    </div>

    <!-- ── Project grid ───────────────────────────────────────────────────── -->
    <template v-else>
      <!-- ── Empty state ────────────────────────────────────────────────────── -->
      <div
        v-if="projects.length === 0"
        class="flex flex-col items-center justify-center py-24 gap-6"
      >
        <p class="text-foreground font-bold uppercase text-2xl">NO PROJECTS YET</p>
        <RouterLink
          :to="{ name: 'upload' }"
          class="bg-card text-card-foreground border-2 border-border rounded-none shadow-[4px_4px_0px_var(--shadow)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_var(--shadow)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-200 font-bold uppercase px-6 py-3"
        >
          ← UPLOAD YOURS
        </RouterLink>
      </div>

      <!-- 2-column desktop, 1-column mobile -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <ProjectCard
          v-for="project in projects"
          :key="project.id"
          :project="project"
        />
      </div>
    </template>
  </div>
</template>
