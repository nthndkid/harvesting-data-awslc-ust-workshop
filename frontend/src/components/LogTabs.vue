<script setup lang="ts">
// ─── Vue core imports ───────────────────────────────────────────────────────
import { ref, computed } from 'vue'
// ─── Component imports ──────────────────────────────────────────────────────
import AdminTable from '@/components/AdminTable.vue'
// ─── Type imports ───────────────────────────────────────────────────────────
import type { AuditTrailEvent } from '@/types/projecthub.types'
// ─── Data imports ───────────────────────────────────────────────────────────
import { mockAuditTrail } from '@/data/mockData'

// ─── Tab state ──────────────────────────────────────────────────────────────
type AuditTab = 'ALL' | 'AUTH' | 'ACCESS' | 'DATA'
const activeTab = ref<AuditTab>('ALL')

const tabs: AuditTab[] = ['ALL', 'AUTH', 'ACCESS', 'DATA']

// ─── Computed ───────────────────────────────────────────────────────────────
// 📝 DynamoDB — single audit trail table per participant
// Table: projecthub-[name]-events (e.g. projecthub-maria-events)
// PK: userId  SK: timestamp#uuid
// eventType: 'AUTH' | 'ACCESS' | 'DATA'
// TTL: expiresAt — logs auto-delete 90 days after creation
// 🌐 API: GET /admin/audit-trail?eventType=AUTH|ACCESS|DATA (or all)
// Currently: filtering mockAuditTrail array from src/data/mockData.ts
const filteredEvents = computed<AuditTrailEvent[]>(() =>
  activeTab.value === 'ALL'
    ? mockAuditTrail
    : mockAuditTrail.filter(e => e.eventType === activeTab.value)
)

// Map filtered events to string[][] for AdminTable
const auditRows = computed(() =>
  filteredEvents.value.map(e => [
    e.userId,
    e.eventType,
    e.action,
    e.resourceId ?? '—',
    e.timestamp,
    String(e.expiresAt),
  ])
)
</script>

<template>
  <div>
    <!-- ── Tab switcher ────────────────────────────────────────────────── -->
    <div class="flex gap-2 mb-4 flex-wrap">
      <button
        v-for="tab in tabs"
        :key="tab"
        @click="activeTab = tab"
        :class="[
          'border-2 border-border rounded-none font-bold uppercase text-xs px-4 py-2 transition-all duration-200',
          activeTab === tab
            // Active tab — primary gold
            ? 'bg-primary text-primary-foreground shadow-[4px_4px_0px_var(--shadow)] -translate-x-[2px] -translate-y-[2px]'
            // Inactive tab — ghost
            : 'bg-card text-card-foreground shadow-[4px_4px_0px_var(--shadow)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[6px_6px_0px_var(--shadow)] active:translate-x-0 active:translate-y-0 active:shadow-none'
        ]"
      >
        {{ tab }}
        <span class="ml-1 opacity-70">({{ tab === 'ALL' ? mockAuditTrail.length : mockAuditTrail.filter(e => e.eventType === tab).length }})</span>
      </button>
    </div>

    <!-- ── Filtered audit trail table ────────────────────────────────── -->
    <AdminTable
      :columns="['USER ID', 'EVENT TYPE', 'ACTION', 'RESOURCE ID', 'TIMESTAMP', 'EXPIRES AT']"
      :rows="auditRows"
      :pageSize="5"
    />
  </div>
</template>
