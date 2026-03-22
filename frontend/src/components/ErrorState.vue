<script setup lang="ts">
import { AlertTriangle, ServerCrash } from 'lucide-vue-next'

defineProps<{
  error?: string | null
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 px-6 max-w-xl mx-auto w-full text-center">
    <div class="bg-card text-card-foreground border-2 border-border border-l-[6px] border-l-primary rounded-none shadow-[5px_5px_0px_var(--shadow)] p-8 w-full">
      <div class="flex items-center justify-center mb-4 text-primary">
        <ServerCrash :size="48" stroke-width="1.5" />
      </div>
      <h2 class="text-2xl font-bold uppercase tracking-wide mb-2 text-foreground">CONNECTION ERROR</h2>
      <p class="text-muted text-sm mb-6 leading-relaxed">
        {{ error || 'Cannot connect to the backend server. Please verify your VITE_API_URL and ensure the backend is running.' }}
      </p>
      
      <div class="bg-primary/5 border-2 border-border p-4 flex flex-col items-start gap-1 text-left rounded-none">
        <p class="text-xs uppercase font-bold text-foreground flex items-center gap-1.5 mb-2">
          <AlertTriangle :size="14" class="text-primary" /> TROUBLESHOOTING
        </p>
        <code class="text-xs font-mono text-muted w-full break-all block">1. Is the hono server running?</code>
        <code class="text-xs font-mono text-muted w-full break-all block">2. Check &lt;project-root&gt;/frontend/.env</code>
        <code class="text-xs font-mono text-muted w-full break-all block">3. Ensure port matches VITE_API_URL</code>
      </div>
    </div>
  </div>
</template>
