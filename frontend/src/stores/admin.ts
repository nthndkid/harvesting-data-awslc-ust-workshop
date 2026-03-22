import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'
import type { Project, Comment, Like, AuditTrailEvent, S3Stats, S3Object } from '@/types/projecthub.types'

export const useAdminStore = defineStore('admin', () => {
  const projects = ref<Project[]>([])
  const comments = ref<Comment[]>([])
  const likes = ref<Like[]>([])
  const auditTrail = ref<AuditTrailEvent[]>([])
  const s3Stats = ref<S3Stats | null>(null)
  const s3Objects = ref<S3Object[]>([])
  const loading = ref(false)

  // 🌐 API: GET /admin/projects
  async function fetchProjects() {
    const { data } = await api.get<any[]>('/admin/projects')
    projects.value = data.map(p => ({
      id: p.id || p.projectId,
      title: p.title,
      description: p.description,
      tags: typeof p.tags === 'string' ? p.tags.split(',').map((t: string) => t.trim()) : p.tags || [],
      demoUrl: p.demoUrl,
      coverImageKey: p.coverImageKey,
      pdfKey: p.pdfKey,
      author: p.author || p.userName || 'Unknown',
      createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—',
      likes: p.likes || p.likesCount || 0,
      comments: p.comments || p.commentsCount || 0
    }))
  }

  // 🌐 API: GET /admin/comments
  async function fetchComments() {
    const { data } = await api.get<any[]>('/admin/comments')
    comments.value = data.map(c => ({
      id: c.id || c.commentId,
      projectId: c.projectId,
      author: c.author || c.userName || 'Anonymous',
      body: c.body,
      createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'
    }))
  }

  // 🌐 API: GET /admin/likes
  async function fetchLikes() {
    const { data } = await api.get<any[]>('/admin/likes')
    likes.value = data.map(l => ({
      id: l.id || l.likeId,
      projectId: l.projectId,
      likedBy: l.likedBy || l.userName || 'Someone',
      projectTitle: l.projectTitle || 'Unknown Title',
      createdAt: l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '—'
    }))
  }

  // 🌐 API: GET /admin/s3-stats
  async function fetchS3Stats() {
    const { data } = await api.get<S3Stats>('/admin/s3-stats')
    s3Stats.value = data
  }

  // 🌐 API: GET /admin/s3-objects
  async function fetchS3Objects() {
    const { data } = await api.get<any[]>('/admin/s3-objects')
    s3Objects.value = data.map(obj => ({
      key: obj.key,
      sizeMB: obj.sizeMB || 0,
      lastModified: obj.lastModified ? new Date(obj.lastModified).toLocaleString() : '—'
    }))
  }

  // 🌐 API: GET /admin/audit-trail
  async function fetchAuditTrail(eventType?: 'AUTH' | 'ACCESS' | 'DATA') {
    loading.value = true
    try {
      const params = eventType ? { eventType } : {}
      const { data } = await api.get<AuditTrailEvent[]>('/admin/audit-trail', { params })
      auditTrail.value = data
    } finally {
      loading.value = false
    }
  }

  // Load all three AWS services at once
  async function fetchAll() {
    await Promise.all([
      fetchProjects(),
      fetchComments(),
      fetchLikes(),
      fetchS3Stats(),
      fetchS3Objects(),
      fetchAuditTrail(),
    ])
  }

  return {
    projects, comments, likes, auditTrail, s3Stats, s3Objects, loading,
    fetchProjects, fetchComments, fetchLikes,
    fetchS3Stats, fetchS3Objects, fetchAuditTrail, fetchAll,
  }
})
