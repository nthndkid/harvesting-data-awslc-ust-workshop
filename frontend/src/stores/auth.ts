import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/lib/api'

export const useAuthStore = defineStore('auth', () => {
  const username = ref<string | null>(localStorage.getItem('ph_username'))
  const userId = ref<string | null>(localStorage.getItem('ph_userid'))
  
  // App is considered authenticated ONLY if we have both name and a valid UUID from backend
  const isAuthenticated = computed(() => username.value !== null && userId.value !== null)

  // 🌐 Workshop simplified login: Strictly by name
  async function setUsername(name: string) {
    try {
      const { data } = await api.post<{ userId: string; userName: string }>(
        '/auth/login',
        { userName: name }
      )
      _persist(data.userId, data.userName)
    } catch (e) {
      console.error('Failed to login with name:', e)
      // Fallback to local only if API fails, so workshop can continue
      username.value = name
      localStorage.setItem('ph_username', name)
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
    const { data } = await api.post<{ userId: string; userName: string }>(
      '/auth/login',
      { userName: name }
    )
    _persist(data.userId, data.userName)
  }

  // 🌐 Future-proof login
  async function login(name: string) {
    const { data } = await api.post<{ userId: string; userName: string }>(
      '/auth/login',
      { userName: name }
    )
    _persist(data.userId, data.userName)
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

  return { username, userId, isAuthenticated, setUsername, register, login, logout, tryAutoLogin }
})
