<script setup lang="ts">
import { Trophy, X } from 'lucide-vue-next'
import { useMissionStore } from '@/stores/mission'
import { computed } from 'vue'

const missionStore = useMissionStore()

const missionsData = {
  SERVER: { title: 'BACKEND ONLINE', desc: 'Successfully start the Hono API background server' },
  RDS: { title: 'RDS POSTGRESQL CONNECTED', desc: 'Successfully connect backend to your relational database' },
  S3: { title: 'S3 STORAGE SECURED', desc: 'Successfully wire up S3 for immutable object storage' },
  DYNAMO: { title: 'DYNAMODB CONNECTED', desc: 'Initialize your NoSQL event log table' },
  UPLOAD: { title: 'FIRST DEPLOYMENT', desc: 'Successfully upload a Project with Image & PDF' },
  ENGAGEMENT: { title: 'COMMUNITY ARCHITECT', desc: 'Like any project on the feed' },
  ADMIN: { title: 'DATA ADMIN', desc: 'Load the Admin Dashboard stats' }
}

const currentMission = computed(() => {
  if (!missionStore.currentCongrats) return null
  return missionsData[missionStore.currentCongrats]
})

function close() {
  missionStore.dismissCongrats()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="missionStore.currentCongrats && currentMission"
      class="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      @click.self="close"
    >
      <div class="bg-card w-full max-w-sm border-[3px] border-border shadow-[8px_8px_0px_var(--shadow)] animate-in zoom-in spin-in-2 duration-300 text-center flex flex-col">
        
        <div class="bg-primary border-b-[3px] border-border py-8 flex flex-col items-center justify-center relative">
          <Trophy :size="56" stroke-width="2" class="text-primary-foreground mb-3 animate-bounce flex-shrink-0" />
          <h2 class="font-bold text-2xl md:text-3xl tracking-widest uppercase text-primary-foreground leading-none">MISSION <br/> ACCOMPLISHED!</h2>
        </div>

        <div class="p-6 md:p-8">
          <p class="text-xs font-bold uppercase text-muted mb-2 tracking-widest">{{ missionStore.currentCongrats }}</p>
          <h3 class="font-bold text-lg text-foreground uppercase mb-2 leading-tight">
            {{ currentMission.title }}
          </h3>
          <p class="text-sm text-foreground font-mono leading-relaxed mb-6">
            {{ currentMission.desc }}
          </p>

          <button
            @click="close"
            class="w-full bg-primary text-primary-foreground border-2 border-border font-bold text-sm uppercase px-4 py-3 shadow-[4px_4px_0px_var(--shadow)] hover:translate-y-[2px] hover:translate-x-[2px] active:shadow-none hover:shadow-[2px_2px_0px_var(--shadow)] transition-all"
          >
            AWESOME →
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
