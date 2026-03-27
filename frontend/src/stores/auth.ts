import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/lib/api'

export const useAuthStore = defineStore('auth', () => {
  const username = ref<string | null>(localStorage.getItem('ph_username'))
  const userId = ref<string | null>(localStorage.getItem('ph_userid'))
  const loading = ref(false)
  
  // App is considered authenticated if we have a name (offline/online)
  const isAuthenticated = computed(() => username.value !== null)
  
  // Helper to check if the current userId is a valid UUID (comes from backend)
  const isUserIdUuid = computed(() => {
    if (!userId.value) return false
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(userId.value)
  })

  // 🌐 Workshop simplified login: Strictly by name
  async function setUsername(name: string) {
    loading.value = true
    try {
      const { data } = await api.post<{ userId: string; userName: string }>(
        '/auth/login',
        { userName: name }
      )
      _persist(data.userId, data.userName)
    } catch (e) {
      console.error('Failed to login with name:', e)
      // Fallback to local only if API fails, so workshop can continue
      // Set name as the userId so x-user-id header has something to send later
      _persist(name, name)
    } finally {
      loading.value = false
    }
  }

  // Background auto-login for users who have a name in localStorage but no UUID yet
  // This happens if they revisit the app after the API was wired up
  async function tryAutoLogin() {
    if (username.value && !userId.value) {
      console.log('🔄 Attempting background auto-login for:', username.value)
      await setUsername(username.value)
    }
  }

  // 🌐 Future-proof register
  async function register(name: string) {
    loading.value = true
    try {
      const { data } = await api.post<{ userId: string; userName: string }>(
        '/auth/login',
        { userName: name }
      )
      _persist(data.userId, data.userName)
    } finally {
      loading.value = false
    }
  }

  // 🌐 Future-proof login
  async function login(name: string) {
    loading.value = true
    try {
      const { data } = await api.post<{ userId: string; userName: string }>(
        '/auth/login',
        { userName: name }
      )
      _persist(data.userId, data.userName)
    } finally {
      loading.value = false
    }
  }

  function logout() {
    username.value = null
    userId.value = null
    localStorage.removeItem('ph_username')
    localStorage.removeItem('ph_userid')
  }

  function _persist(id: string, name: string) {
    userId.value = id
    username.value = name
    localStorage.setItem('ph_userid', id)
    localStorage.setItem('ph_username', name)
  }

  return { username, userId, isAuthenticated, isUserIdUuid, loading, setUsername, register, login, logout, tryAutoLogin }
})
