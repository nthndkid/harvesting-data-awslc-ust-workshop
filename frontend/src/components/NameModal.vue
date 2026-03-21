<script setup lang="ts">
// ─── Vue core imports ───────────────────────────────────────────────────────
import { ref } from 'vue'
// ─── Pinia imports ──────────────────────────────────────────────────────────
import { useAuthStore } from '@/stores/auth'

// ─── Store access ───────────────────────────────────────────────────────────
const authStore = useAuthStore()

// ─── Local state ────────────────────────────────────────────────────────────
// Controlled input for the builder's name
const nameInput = ref('')

// ─── Methods ────────────────────────────────────────────────────────────────
// Save name to Pinia store + localStorage, then dismiss modal
function handleSubmit() {
  const trimmed = nameInput.value.trim()
  if (!trimmed) return  // Don't submit if empty
  authStore.setUsername(trimmed)
}
</script>

<template>
  <!-- Full-screen overlay — only visible when !isAuthenticated (App.vue controls rendering) -->
  <!-- Backdrop: dark overlay behind the card -->
  <Teleport to="body">
    <div
      v-if="!authStore.isAuthenticated"
      class="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80"
    >
      <!-- Modal card: gold shadow to make it pop -->
      <div class="bg-card border-2 border-border shadow-[8px_8px_0px_var(--primary)] p-12 max-w-md w-full mx-4 rounded-none">

        <!-- Heading -->
        <h1 class="text-2xl font-bold uppercase text-card-foreground tracking-wide">
          WELCOME TO PROJECTHUB
        </h1>

        <!-- Subtext -->
        <p class="text-muted text-sm mt-2 mb-8">
          What should we call you, builder?
        </p>

        <!-- Name form -->
        <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">
          <!-- Name input — gold focus ring for Neobrutalist style -->
          <input
            id="name-input"
            v-model="nameInput"
            type="text"
            placeholder="Your name..."
            autofocus
            class="bg-card text-card-foreground border-2 border-border rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background px-4 py-3 w-full font-mono text-base"
          />

          <!-- Submit button — full width primary -->
          <button
            type="submit"
            class="w-full bg-primary text-primary-foreground border-2 border-border rounded-none shadow-[4px_4px_0px_var(--shadow)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_var(--shadow)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all duration-200 font-bold uppercase py-3 text-lg"
          >
            LET'S GO →
          </button>
        </form>
      </div>
    </div>
  </Teleport>
</template>
