<script setup lang="ts">
// ─── Vue core imports ───────────────────────────────────────────────────────
import { RouterLink, useLink } from 'vue-router'
// ─── Pinia imports ──────────────────────────────────────────────────────────
import { storeToRefs } from 'pinia'
// ─── Store imports ──────────────────────────────────────────────────────────
import { useAuthStore } from '@/stores/auth'
import { User } from 'lucide-vue-next'

// ─── Store access ───────────────────────────────────────────────────────────
// Read username from auth store to display in the top-right badge
const { username } = storeToRefs(useAuthStore())

// ─── Nav links ──────────────────────────────────────────────────────────────
// Centralized so additions only need one place changed
const navLinks = [
  { name: 'feed',   label: 'FEED' },
  { name: 'upload', label: 'UPLOAD' },
  { name: 'admin',  label: 'ADMIN' },
]
</script>

<template>
  <!-- Fixed top navigation — offset all page content with pt-16 -->
  <nav class="fixed top-0 left-0 right-0 h-16 z-40 bg-card border-b-2 border-border flex items-center justify-between px-6 font-mono">

    <!-- Left: Logo wordmark -->
    <RouterLink
      :to="{ name: 'feed' }"
      class="font-bold uppercase text-xl text-primary tracking-widest hover:opacity-80 transition-opacity"
    >
      PROJECTHUB
    </RouterLink>

    <!-- Right: Nav links + username badge -->
    <div class="flex items-center gap-6">
      <!-- Navigation links -->
      <RouterLink
        v-for="link in navLinks"
        :key="link.name"
        :to="{ name: link.name }"
        class="uppercase font-bold text-sm text-foreground hover:text-primary transition-colors duration-200"
        active-class="text-primary underline underline-offset-4 decoration-2 decoration-primary"
      >
        {{ link.label }}
      </RouterLink>

      <!-- Username badge — displays builder's name set in NameModal -->
      <span class="flex items-center gap-1 bg-primary text-primary-foreground border-2 border-border text-xs font-bold uppercase px-3 py-1 rounded-none shadow-[2px_2px_0px_var(--shadow)]">
        <User :size="14" /> {{ username }}
      </span>
    </div>
  </nav>
</template>
