<script setup lang="ts">
// ─── Vue core imports ───────────────────────────────────────────────────────
import { ref, onMounted } from 'vue'
import { RouterLink, useLink } from 'vue-router'
// ─── Pinia imports ──────────────────────────────────────────────────────────
import { storeToRefs } from 'pinia'
// ─── Store imports ──────────────────────────────────────────────────────────
import { useAuthStore } from '@/stores/auth'
import { useMissionStore } from '@/stores/mission'
import { User, Trophy, LogOut } from 'lucide-vue-next'
// ─── Component imports ──────────────────────────────────────────────────────
import MissionModal from '@/components/MissionModal.vue'
import CongratsModal from '@/components/CongratsModal.vue'

// Read username from auth store to display in the top-right badge
const authStore = useAuthStore()
const { username } = storeToRefs(authStore)

const missionStore = useMissionStore()
const showMissionLog = ref(false)

// ─── Nav links ──────────────────────────────────────────────────────────────
// Centralized so additions only need one place changed
const navLinks = [
  { name: 'feed',   label: 'FEED' },
  { name: 'upload', label: 'UPLOAD' },
  { name: 'admin',  label: 'ADMIN' },
]

// ─── Lifecycle ──────────────────────────────────────────────────────────────
// Check infrastructure connectivity on any page reload
onMounted(() => {
  missionStore.checkHealth()
})
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

      <!-- Mission Log Toggle -->
      <button
        @click="showMissionLog = true"
        class="hidden sm:flex items-center gap-2 bg-background border-2 border-border px-3 py-1.5 hover:bg-muted font-bold text-xs uppercase shadow-[2px_2px_0px_var(--shadow)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0px_var(--shadow)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-200 text-foreground"
      >
        <Trophy :size="14" class="text-primary" />
        {{ missionStore.progressCount }} / 7 MISSIONS
      </button>

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

      <!-- Logout button -->
      <button
        @click="authStore.logout()"
        title="Logout"
        class="bg-card text-card-foreground border-2 border-border p-1.5 hover:bg-red-500 hover:text-white transition-colors duration-200 shadow-[2px_2px_0px_var(--shadow)] active:translate-x-0 active:translate-y-0 active:shadow-none"
      >
        <LogOut :size="14" />
      </button>
    </div>
  </nav>

  <!-- Mission Log Modal -->
  <MissionModal 
    :isOpen="showMissionLog" 
    @close="showMissionLog = false" 
  />

  <!-- Dedicated Congratulations Queue Modal -->
  <CongratsModal />
</template>
