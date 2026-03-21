<script setup lang="ts">
// ─── Type imports ───────────────────────────────────────────────────────────
import type { Comment } from '@/types/projecthub.types'

// ─── Props ──────────────────────────────────────────────────────────────────
const props = defineProps<{
  comment: Comment
}>()
</script>

<template>
  <!-- Comment card — standard Neobrutalist card style -->
  <div class="bg-card border-2 border-border rounded-none shadow-[4px_4px_0px_var(--shadow)] p-4">
    <!-- Top row: author (bold, uppercase) + date (muted, right-aligned) -->
    <div class="flex justify-between items-start gap-4">
      <span class="font-bold uppercase text-sm text-card-foreground">{{ comment.author }}</span>
      <span class="text-muted text-xs shrink-0">{{ comment.createdAt }}</span>
    </div>
    <!-- Comment body -->
    <p class="text-card-foreground text-sm mt-2 leading-relaxed">{{ comment.body }}</p>
  </div>
</template>
