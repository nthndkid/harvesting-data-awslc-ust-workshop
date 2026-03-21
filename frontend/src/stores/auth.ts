// ─── Auth Store ───────────────────────────────────────────────────────────────
// Manages the builder's name — stored in localStorage only.
// No passwords. No JWT. Just a name input for the workshop demo.
// localStorage key: ph_username
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // ─── State ────────────────────────────────────────────────────────────────
  // Hydrate from localStorage on first load — persists across page refreshes
  const username = ref<string | null>(localStorage.getItem('ph_username'))

  // ─── Computed ─────────────────────────────────────────────────────────────
  // Drives the NameModal visibility gate in App.vue
  const isAuthenticated = computed(() => username.value !== null)

  // ─── Methods ──────────────────────────────────────────────────────────────
  // Called by NameModal.vue on submit — saves name to state + localStorage
  function setUsername(name: string) {
    username.value = name
    localStorage.setItem('ph_username', name)
  }

  return { username, isAuthenticated, setUsername }
})
