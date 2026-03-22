<script setup lang="ts">
import { Trophy, CheckCircle2, Circle, X } from 'lucide-vue-next'
import { useMissionStore } from '@/stores/mission'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const missionStore = useMissionStore()

const missions = [
  {
    id: 'SERVER',
    title: 'BACKEND ONLINE',
    desc: 'Successfully start the Hono API background server',
    status: () => missionStore.missions.SERVER
  },
  {
    id: 'RDS',
    title: 'RDS POSTGRESQL CONNECTED',
    desc: 'Successfully connect backend to your relational database',
    status: () => missionStore.missions.RDS
  },
  {
    id: 'S3',
    title: 'S3 STORAGE SECURED',
    desc: 'Successfully wire up S3 for immutable object storage',
    status: () => missionStore.missions.S3
  },
  {
    id: 'DYNAMO',
    title: 'DYNAMODB CONNECTED',
    desc: 'Initialize your NoSQL event log table',
    status: () => missionStore.missions.DYNAMO
  },
  {
    id: 'UPLOAD',
    title: 'FIRST DEPLOYMENT',
    desc: 'Successfully upload a Project with Image & PDF',
    status: () => missionStore.missions.UPLOAD
  },
  {
    id: 'LIKE',
    title: 'COMMUNITY ARCHITECT',
    desc: 'Like any project on the feed',
    status: () => missionStore.missions.LIKE
  },
  {
    id: 'ADMIN',
    title: 'DATA ADMIN',
    desc: 'Load the Admin Dashboard stats',
    status: () => missionStore.missions.ADMIN
  }
]
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      @click.self="emit('close')"
    >
      <div class="bg-card w-full max-w-lg border-[3px] border-border shadow-[8px_8px_0px_var(--shadow)] animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        <!-- Header -->
        <div class="bg-primary border-b-[3px] border-border px-6 py-4 flex-shrink-0 flex items-center justify-between">
          <div class="flex items-center gap-2 text-primary-foreground">
            <Trophy :size="24" stroke-width="2.5" />
            <h2 class="font-bold text-xl tracking-wide uppercase">MISSION LOG</h2>
          </div>
          <button 
            @click="emit('close')"
            class="text-primary-foreground hover:bg-black/20 p-1 transition-colors outline-none focus:ring-2 focus:ring-black"
          >
            <X :size="24" stroke-width="3" />
          </button>
        </div>

        <!-- Scrollable Body -->
        <div class="p-6 md:p-8 overflow-y-auto flex-1">
          <p class="text-sm text-foreground font-mono leading-relaxed mb-6">
            Complete all seven missions to establish your polyglot persistence architecture and unlock your workshop rewards.
          </p>

          <div class="space-y-4">
            <!-- Mission cards -->
            <div
              v-for="(mission, index) in missions"
              :key="mission.id"
              class="flex gap-4 p-4 border-[3px] rounded-none transition-all duration-300"
              :class="mission.status() 
                ? 'border-green-600 bg-green-50 shadow-[4px_4px_0px_#16a34a]' 
                : 'border-border bg-background shadow-[4px_4px_0px_var(--shadow)]'"
            >
              <!-- Status Icon -->
              <div class="mt-0.5 flex-shrink-0">
                <CheckCircle2
                  v-if="mission.status()"
                  :size="24"
                  stroke-width="3"
                  class="text-green-600 animate-in zoom-in spin-in-12 duration-500"
                />
                <Circle
                  v-else
                  :size="24"
                  stroke-width="2.5"
                  class="text-muted"
                />
              </div>

              <!-- Content -->
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-bold font-mono px-2 py-0.5" 
                    :class="mission.status() ? 'bg-green-600 text-white' : 'bg-foreground text-background'">
                    #{{ index + 1 }}
                  </span>
                  <h3 class="font-bold uppercase text-foreground text-sm tracking-wide">
                    {{ mission.title }}
                  </h3>
                </div>
                <p class="text-xs text-muted font-mono leading-tight">
                  {{ mission.desc }}
                </p>
                
                <div v-if="mission.status()" class="mt-2">
                  <span class="inline-block bg-green-200 text-green-800 font-bold uppercase text-[10px] px-2 py-0.5 rounded-sm">
                    COMPLETED
                  </span>
                </div>
                <div v-else class="mt-2">
                  <span class="inline-block bg-primary/20 text-foreground font-bold uppercase text-[10px] px-2 py-0.5 rounded-sm">
                    PENDING...
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Fixed Footer -->
        <div class="bg-card border-t-[3px] border-border p-5 md:px-8 flex-shrink-0 flex justify-between items-center">
          <span class="font-mono text-sm font-bold uppercase">
            PROGRESS
          </span>
          <span class="bg-primary text-primary-foreground font-bold px-3 py-1 font-mono text-lg border-2 border-border shadow-[2px_2px_0px_var(--shadow)]">
            {{ missionStore.progressCount }} / 7
          </span>
        </div>
      </div>
    </div>
  </Teleport>
</template>
