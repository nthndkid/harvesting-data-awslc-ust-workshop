import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import confetti from 'canvas-confetti'

type MissionId = 'SERVER' | 'RDS' | 'S3' | 'DYNAMO' | 'UPLOAD' | 'ENGAGEMENT' | 'ADMIN'

export const useMissionStore = defineStore('mission', () => {
  const missions = ref({
    // Infra missions: strictly live state from /health
    SERVER: false,
    RDS: false,
    S3: false,
    DYNAMO: false,
    // Action missions: persistent local state
    UPLOAD: localStorage.getItem('ph_mission_UPLOAD') === 'true',
    ENGAGEMENT: localStorage.getItem('ph_mission_ENGAGEMENT') === 'true',
    ADMIN: localStorage.getItem('ph_mission_ADMIN') === 'true',
  })

  // Computed properties for UI
  const progressCount = computed(() => {
    return Object.values(missions.value).filter(Boolean).length
  })
  const isAllComplete = computed(() => progressCount.value === 7)

  // Queue system for congratulations modals
  const congratsQueue = ref<MissionId[]>([])
  const currentCongrats = computed(() => congratsQueue.value[0] || null)

  function dismissCongrats() {
    congratsQueue.value.shift() // Pops the first item out
  }

  // Action: Complete a persistent manual action mission
  function completeMission(missionId: MissionId) {
    if (missions.value[missionId]) return // Already completed

    // Mark complete and save to local storage
    missions.value[missionId] = true
    localStorage.setItem(`ph_mission_${missionId}`, 'true')

    // Enqueue the congrats modal
    congratsQueue.value.push(missionId)

    // BLAST CONFETTI! 🎉
    triggerConfetti()
  }

  // Internal: Set live infra mission state, but only celebrate once ever
  function setInfraLive(missionId: MissionId) {
    missions.value[missionId] = true
    
    // Check if we've already celebrated this connection
    if (localStorage.getItem(`ph_celebrated_${missionId}`) !== 'true') {
      localStorage.setItem(`ph_celebrated_${missionId}`, 'true')
      congratsQueue.value.push(missionId)
      triggerConfetti()
    }
  }

  // Helper action: Check health for the backend integration missions
  async function checkHealth() {
    // Reset infra states in case this is called dynamically
    missions.value.SERVER = false
    missions.value.RDS = false
    missions.value.S3 = false
    missions.value.DYNAMO = false

    try {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const res = await fetch(`${url}/admin/health`)
      if (res.ok) {
        setInfraLive('SERVER')

        const data = await res.json()
        if (data.rds) setInfraLive('RDS')
        if (data.s3) setInfraLive('S3')
        if (data.dynamodb) setInfraLive('DYNAMO')
      }
    } catch {
      // API is likely down, ignore silently.
    }
  }

  function triggerConfetti() {
    const end = Date.now() + 2 * 1000 // 2 seconds of confetti
    const colors = ['#F5A800', '#0A0A0A', '#FFFFFF'] // Primary, Base, Card

    ;(function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      })
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    })()
  }

  // Utility to clear progress (useful for testing/resetting workshop state)
  function clearProgress() {
    Object.keys(missions.value).forEach((key) => {
      missions.value[key as MissionId] = false
      localStorage.removeItem(`ph_mission_${key}`)
      localStorage.removeItem(`ph_celebrated_${key}`)
    })
  }

  return { 
    missions, 
    progressCount, 
    isAllComplete, 
    completeMission, 
    checkHealth,
    clearProgress,
    congratsQueue,
    currentCongrats,
    dismissCongrats
  }
})
