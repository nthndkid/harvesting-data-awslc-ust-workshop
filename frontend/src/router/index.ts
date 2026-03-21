// ─── Vue Router — ProjectHub ──────────────────────────────────────────────────
// 4 routes, all lazy-loaded (code-splitting per route for performance).
// Use { name: '...' } objects everywhere in RouterLink — never hardcode paths.
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Feed — home/discovery page
    { path: '/',             name: 'feed',           component: () => import('@/views/FeedView.vue') },
    // Project Detail — single project with comments + like
    { path: '/project/:id', name: 'project-detail', component: () => import('@/views/ProjectDetailView.vue') },
    // Upload — submit a new project
    { path: '/upload',       name: 'upload',         component: () => import('@/views/UploadView.vue') },
    // Admin — database & infrastructure overview (workshop reveal moment)
    { path: '/admin',        name: 'admin',          component: () => import('@/views/AdminView.vue') },
  ],
})

export default router
