<script setup lang="ts">
// ─── Vue core imports ───────────────────────────────────────────────────────
import { storeToRefs } from 'pinia'
// ─── Component imports ──────────────────────────────────────────────────────
import AppNavbar from '@/components/AppNavbar.vue'
import NameModal from '@/components/NameModal.vue'
// ─── Store imports ──────────────────────────────────────────────────────────
import { useAuthStore } from '@/stores/auth'

// ─── Store access ───────────────────────────────────────────────────────────
// isAuthenticated drives the app gate — NameModal shows until name is entered
const { isAuthenticated } = storeToRefs(useAuthStore())
</script>

<template>
  <!-- NameModal: shown on first visit until builder enters their name -->
  <!-- Rendered regardless of auth state — it handles its own visibility -->
  <NameModal />

  <!-- Main app shell: only renders after name is set -->
  <template v-if="isAuthenticated">
    <!-- Fixed top navigation bar -->
    <AppNavbar />

    <!-- Page content — offset by navbar height (pt-16) -->
    <main class="pt-16 min-h-screen bg-background">
      <RouterView />
    </main>
  </template>
</template>
