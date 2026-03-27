import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'
import { useMissionStore } from '@/stores/mission'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const useUploadStore = defineStore('upload', () => {
  const uploading = ref(false)
  const error = ref<string | null>(null)

  // Shared file upload helper
  async function _uploadFile(endpoint: string, file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)

    const userId = localStorage.getItem('ph_userid') || 'system'

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'x-user-id': userId },
      body: formData,
    })

    if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Upload failed: ${res.statusText}`)
    }
    
    const data = await res.json()
    return data.key
  }

  // 🌐 API: POST /uploads/cover
  async function uploadCover(file: File): Promise<string> {
    return _uploadFile('/uploads/cover', file)
  }

  // 🌐 API: POST /uploads/pdf
  async function uploadPdf(file: File): Promise<string> {
    return _uploadFile('/uploads/pdf', file)
  }

  // 🌐 API: POST /projects
  async function submitProject(payload: {
    title: string
    description: string
    demoUrl: string | null
    tags: string[]
    coverImageKey: string | null
    pdfKey: string | null
  }) {
    uploading.value = true
    error.value = null
    try {
      const userId = localStorage.getItem('ph_userid')
      if (!userId) throw new Error('YOU MUST BE LOGGED IN TO SUBMIT A PROJECT')

      const backendPayload = {
        title: payload.title,
        description: payload.description,
        demoUrl: payload.demoUrl || "", // Send empty string instead of null to pass validation
        tags: payload.tags.join(', '), 
        coverImageKey: payload.coverImageKey || undefined, // undefined for optional fields
        pdfKey: payload.pdfKey || undefined,
        userId: userId
      }

      console.log('Sending project payload:', backendPayload)

      const { data } = await api.post('/projects', backendPayload)
      
      const missionStore = useMissionStore()
      missionStore.completeMission('UPLOAD')
      
      return data
    } catch (e: any) {
      // Better error formatting for Zod objects
      const serverError = e.response?.data?.error
      if (typeof serverError === 'object') {
        error.value = 'Validation failed: ' + (serverError.issues?.[0]?.message || JSON.stringify(serverError))
      } else {
        error.value = serverError || e.message || 'Failed to submit project'
      }
      
      console.error('Submit Project Error:', serverError || e)
      throw new Error(error.value || 'Failed to submit project')
    } finally {
      uploading.value = false
    }
  }

  return { uploading, error, uploadCover, uploadPdf, submitProject }
})
