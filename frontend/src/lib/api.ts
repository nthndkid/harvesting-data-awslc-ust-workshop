import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach x-user-id to every request automatically
// Backend reads this header in every route for DynamoDB audit logging
api.interceptors.request.use((config) => {
  const userId = localStorage.getItem('ph_userid')
  if (userId) config.headers['x-user-id'] = userId
  return config
})

// Centralized error logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.response?.data ?? error.message)
    return Promise.reject(error)
  }
)
