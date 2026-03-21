<script setup lang="ts">
// ─── Props ──────────────────────────────────────────────────────────────────
const props = defineProps<{
  label: string     // e.g. "TOTAL FILES"
  value: string     // e.g. "12"
  subtext: string   // e.g. "cover images + PDFs"
  highlight?: boolean  // if true, value text uses text-primary (gold)
}>()
</script>

<template>
  <!-- Stat card with gold shadow — visually distinct from RDS table cards -->
  <div class="bg-card border-2 border-border rounded-none shadow-[5px_5px_0px_var(--primary)] p-6">
    <!-- Label -->
    <p class="text-xs font-bold uppercase text-muted mb-2">{{ label }}</p>
    <!-- Value — gold if highlight, else default card text -->
    <p
      :class="[
        'text-3xl font-bold font-mono',
        highlight ? 'text-primary' : 'text-card-foreground'
      ]"
    >
      {{ value }}
    </p>
    <!-- Subtext -->
    <p class="text-muted text-xs mt-1">{{ subtext }}</p>
  </div>
</template>
