<script setup lang="ts">
// ─── Vue core imports ───────────────────────────────────────────────────────
import { ref } from 'vue'
// ─── Router imports ─────────────────────────────────────────────────────────
import { RouterLink } from 'vue-router'
// ─── Component imports ──────────────────────────────────────────────────────
import ProjectCard from '@/components/ProjectCard.vue'
// ─── Type imports ───────────────────────────────────────────────────────────
import type { Project } from '@/types/projecthub.types'

// ─── Data source ────────────────────────────────────────────────────────────
// 🌐 API: GET /projects
// → Returns all projects from RDS — projects table joined with users
// Currently: using mockProjects from src/data/mockData.ts
import { mockProjects } from '@/data/mockData'
const projects = ref<Project[]>([...mockProjects])
</script>

<template>
  <div class="max-w-7xl mx-auto px-6 py-10">

    <!-- ── Page heading (gold left border pattern) ─────────────────────────── -->
    <div class="border-l-[6px] border-primary pl-4 mb-8">
      <h1 class="text-4xl font-bold uppercase text-foreground tracking-wide">PROJECT FEED</h1>
      <p class="text-muted text-sm mt-1">Builds from the community</p>
    </div>

    <!-- ── Empty state ────────────────────────────────────────────────────── -->
    <!-- Shown when no projects exist in the array -->
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

    <!-- ── Project grid ───────────────────────────────────────────────────── -->
    <!-- 2-column desktop, 1-column mobile -->
    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      <!-- Use project.id as key — never index -->
      <ProjectCard
        v-for="project in projects"
        :key="project.id"
        :project="project"
      />
    </div>
  </div>
</template>
