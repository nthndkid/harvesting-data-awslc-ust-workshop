import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'
import { useMissionStore } from '@/stores/mission'
import type { Project, Comment } from '@/types/projecthub.types'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Mapping helper to bridge the RDS backend response to the frontend types
  const _mapProject = (p: any): Project => ({
    id: p.projectId,
    title: p.title,
    description: p.description,
    tags: Array.isArray(p.tags) ? p.tags : (typeof p.tags === 'string' ? p.tags.split(',').map((t: string) => t.trim()) : []),
    demoUrl: p.demoUrl,
    coverImageKey: p.coverImageKey,
    pdfKey: p.pdfKey,
    author: p.userName || 'Unknown Builder',
    createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Just now',
    likes: p.likesCount || 0,
    comments: p.commentsCount || 0,
  })

  // 🌐 API: GET /projects
  async function fetchProjects() {
    loading.value = true
    error.value = null
    try {
      const { data } = await api.get<any[]>('/projects')
      // Ensure data is array before mapping
      projects.value = Array.isArray(data) ? data.map(_mapProject) : []
    } catch {
      error.value = 'Failed to load projects'
    } finally {
      loading.value = false
    }
  }

  // 🌐 API: GET /projects/:id
  async function fetchProject(id: string) {
    const { data } = await api.get<any>(`/projects/${id}`)
    return _mapProject(data)
  }

  // 🌐 API: GET /projects/:id/cover
  async function getCoverUrl(id: string): Promise<string> {
    const { data } = await api.get<{ url: string }>(`/projects/${id}/cover`)
    return data.url
  }

  // 🌐 API: GET /projects/:id/download-pdf
  async function getPdfUrl(id: string): Promise<string> {
    const { data } = await api.get<{ url: string }>(`/projects/${id}/download-pdf`)
    return data.url
  }

  // 🌐 API: POST /projects/:id/like
  async function toggleLike(projectId: string) {
    const userId = localStorage.getItem('ph_userid')
    if (!userId) throw new Error('You must be logged in to like a project')

    // Backend now returns updated { liked: boolean, count: number }
    const { data } = await api.post<{ liked: boolean; count: number }>(
      `/projects/${projectId}/like`,
      { userId }
    )
    
    // Updates local feed state if necessary
    const project = projects.value.find(p => p.id === projectId)
    if (project && data) {
      project.likes = data.count
    }

    // 🏆 Gamification Trigger
    const missionStore = useMissionStore()
    missionStore.completeMission('LIKE')
    
    return data
  }

  // 🌐 API: GET /projects/:id/comments
  async function fetchComments(projectId: string) {
    const { data } = await api.get<any[]>(`/projects/${projectId}/comments`)
    return data.map(c => ({
      id: c.commentId,
      projectId: c.projectId,
      author: c.userName || 'Anonymous',
      body: c.body,
      createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Just now',
    }))
  }

  // 🌐 API: POST /projects/:id/comments
  async function postComment(projectId: string, body: string) {
    const userId = localStorage.getItem('ph_userid')
    if (!userId) throw new Error('You must be logged in to comment')

    const { data } = await api.post<any>(
      `/projects/${projectId}/comments`,
      { body, userId }
    )
    return {
      id: data.commentId,
      projectId: data.projectId,
      author: data.userName || localStorage.getItem('ph_username') || 'Anonymous',
      body: data.body,
      createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Just now',
    }
  }

  return {
    projects, loading, error,
    fetchProjects, fetchProject,
    getCoverUrl, getPdfUrl,
    toggleLike,
    fetchComments, postComment,
  }
})
