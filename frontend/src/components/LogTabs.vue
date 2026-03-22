<script setup lang="ts">
// ─── Vue core imports ───────────────────────────────────────────────────────
import { ref, computed, onMounted } from 'vue'
// ─── Component imports ──────────────────────────────────────────────────────
import AdminTable from '@/components/AdminTable.vue'
// ─── Store imports ──────────────────────────────────────────────────────────
import { useAdminStore } from '@/stores/admin'
import { storeToRefs } from 'pinia'

// ─── Tab state ──────────────────────────────────────────────────────────────
type AuditTab = 'ALL' | 'AUTH' | 'ACCESS' | 'DATA'
const activeTab = ref<AuditTab>('ALL')
const tabs: AuditTab[] = ['ALL', 'AUTH', 'ACCESS', 'DATA']

// ─── Store access ───────────────────────────────────────────────────────────
const adminStore = useAdminStore()
const { auditTrail, loading } = storeToRefs(adminStore)

// ─── Computed ───────────────────────────────────────────────────────────────
// Filtered audit trail from store
const filteredEvents = computed(() => {
  if (activeTab.value === 'ALL') return auditTrail.value
  return auditTrail.value.filter(e => e.eventType === activeTab.value)
})

// Map filtered events to string[][] for AdminTable
const auditRows = computed(() =>
  filteredEvents.value.map(e => [
    e.userId || '—',
    e.eventType,
    e.action,
    e.resourceId ?? '—',
    e.timestamp,
    String(e.expiresAt),
  ])
)

// Helper to count events by type
function getCount(type: AuditTab) {
  if (type === 'ALL') return auditTrail.value.length
  return auditTrail.value.filter(e => e.eventType === type).length
}

onMounted(async () => {
  // Fetch audit trail if not already loaded (though fetchAll usually handles this)
  if (auditTrail.value.length === 0) {
    await adminStore.fetchAuditTrail()
  }
})
</script>

<template>
  <div>
    <!-- ── Tab switcher ────────────────────────────────────────────────── -->
    <div class="flex gap-2 mb-4 flex-wrap">
      <button
        v-for="tab in tabs"
        :key="tab"
        @click="activeTab = tab"
        :disabled="loading"
        :class="[
          'border-2 border-border rounded-none font-bold uppercase text-xs px-4 py-2 transition-all duration-200 disabled:opacity-50',
          activeTab === tab
            ? 'bg-primary text-primary-foreground shadow-[4px_4px_0px_var(--shadow)] -translate-x-[2px] -translate-y-[2px]'
            : 'bg-card text-card-foreground shadow-[4px_4px_0px_var(--shadow)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_var(--shadow)] active:translate-x-0 active:translate-y-0 active:shadow-none'
        ]"
      >
        {{ tab }}
        <span class="ml-1 opacity-70">({{ getCount(tab) }})</span>
      </button>
    </div>

    <!-- ── Loading state ────────────────────────────────────────────────── -->
    <div v-if="loading && auditTrail.length === 0" class="py-12 text-center text-muted font-mono uppercase text-xs">
      Querying DynamoDB...
    </div>

    <!-- ── Filtered audit trail table ────────────────────────────────── -->
    <AdminTable
      v-else
      :columns="['USER ID', 'EVENT TYPE', 'ACTION', 'RESOURCE ID', 'TIMESTAMP', 'TTL']"
      :rows="auditRows"
      :pageSize="5"
    />
  </div>
</template>
