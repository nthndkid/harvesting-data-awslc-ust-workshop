<script setup lang="ts">
// ─── Vue core imports ───────────────────────────────────────────────────────
import { ref, computed } from 'vue'
// ─── Component imports ──────────────────────────────────────────────────────
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-vue-next'

// ─── Props ──────────────────────────────────────────────────────────────────
const props = withDefaults(defineProps<{
  columns: string[]    // Header labels, e.g. ['#', 'TITLE', 'BUILDER']
  rows: string[][]     // Each inner array = one row
  pageSize?: number    // Items per page (default: 10)
}>(), {
  pageSize: 10
})

// ─── Table state ────────────────────────────────────────────────────────────
const searchQuery = ref('')
const currentPage = ref(1)

// Sorting state: which column index and order (asc/desc)
const sortKey = ref<number | null>(null)
const sortOrder = ref<'asc' | 'desc'>('asc')

// ─── Computed ───────────────────────────────────────────────────────────────
// 🔍 Filter logic: checks if ANY cell in the row matches the search query
const filteredRows = computed(() => {
  if (!searchQuery.value.trim()) return props.rows
  
  const query = searchQuery.value.toLowerCase()
  return props.rows.filter(row => 
    row.some(cell => String(cell).toLowerCase().includes(query))
  )
})

// 🔃 Sorting logic: sorts the filtered rows
const sortedRows = computed(() => {
  if (sortKey.value === null) return filteredRows.value
  
  return [...filteredRows.value].sort((a, b) => {
    const valA = a[sortKey.value!]?.toLowerCase() || ''
    const valB = b[sortKey.value!]?.toLowerCase() || ''
    
    if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
})

// 📄 Pagination logic: slice the sorted results
const totalPages = computed(() => Math.ceil(sortedRows.value.length / props.pageSize))

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize
  const end = start + props.pageSize
  return sortedRows.value.slice(start, end)
})

// ─── Methods ────────────────────────────────────────────────────────────────
function sortBy(index: number) {
  if (sortKey.value === index) {
    // Cycle: desc -> none -> asc
    if (sortOrder.value === 'asc') sortOrder.value = 'desc'
    else sortKey.value = null
  } else {
    sortKey.value = index
    sortOrder.value = 'asc'
  }
  currentPage.value = 1 // Reset pagination on sort
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

function goToPage(page: number) {
  currentPage.value = page
}

// Reset page when searching
function onSearchChange() {
  currentPage.value = 1
}
</script>

<template>
  <div class="space-y-4">
    <!-- 🔍 Filter Bar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="relative w-full max-w-sm">
        <input
          v-model="searchQuery"
          @input="onSearchChange"
          type="text"
          placeholder="Filter records..."
          class="bg-card text-card-foreground border-2 border-border rounded-none focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background px-4 py-2 w-full font-mono text-sm shadow-[3px_3px_0px_var(--shadow)]"
        />
      </div>
      
      <!-- Result count -->
      <p class="text-xs text-muted font-mono uppercase">
        Showing {{ paginatedRows.length }} of {{ sortedRows.length }} results
      </p>
    </div>

    <!-- ── Table Container ────────────────────────────────────────────────── -->
    <div class="overflow-x-auto border-2 border-border rounded-none shadow-[4px_4px_0px_var(--shadow)]">
      <table class="w-full text-left border-collapse bg-card">
        <!-- Header row -->
        <thead>
          <tr class="bg-primary text-primary-foreground border-b-2 border-border uppercase font-bold text-xs md:text-sm">
            <th
              v-for="(col, index) in columns"
              :key="col"
              @click="sortBy(index)"
              class="px-4 py-3 border-r-2 border-border last:border-r-0 whitespace-nowrap cursor-pointer hover:bg-white/10 select-none group"
            >
              <div class="flex items-center gap-1">
                {{ col }}
                <span class="transition-opacity" :class="sortKey === index ? 'opacity-100' : 'opacity-20 group-hover:opacity-50'">
                  <ChevronUp v-if="sortKey === index && sortOrder === 'asc'" :size="14" />
                  <ChevronDown v-else-if="sortKey === index && sortOrder === 'desc'" :size="14" />
                  <ChevronsUpDown v-else :size="14" />
                </span>
              </div>
            </th>
          </tr>
        </thead>

        <!-- Body rows -->
        <tbody>
          <!-- Empty state -->
          <tr v-if="paginatedRows.length === 0">
            <td
              :colspan="columns.length"
              class="text-center text-muted px-4 py-10 text-sm font-mono"
            >
              {{ searchQuery ? 'No matches found for your search.' : 'No data yet.' }}
            </td>
          </tr>

          <!-- Data rows -->
          <tr
            v-for="(row, rowIndex) in paginatedRows"
            :key="rowIndex"
            class="border-b-2 border-border last:border-b-0 text-xs md:text-sm text-card-foreground bg-card hover:bg-primary/5 transition-colors duration-150"
          >
            <td
              v-for="(cell, cellIndex) in row"
              :key="cellIndex"
              class="px-4 py-3 border-r-2 border-border last:border-r-0 max-w-[240px]"
            >
              <!-- S3 key cells -->
              <code
                v-if="cell && (cell.startsWith('pdfs/') || cell.startsWith('covers/'))"
                class="bg-primary/10 text-primary border border-border px-2 py-0.5 text-xs font-mono rounded-none break-all"
              >
                {{ cell }}
              </code>
              <!-- Regular cell -->
              <span v-else class="block truncate">
                {{ cell && cell.length > 80 ? cell.slice(0, 80) + '...' : (cell || '—') }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Pagination Controls ────────────────────────────────────────────── -->
    <div v-if="totalPages > 1" class="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
      <!-- Page number pills -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          @click="prevPage"
          :disabled="currentPage === 1"
          class="bg-card text-card-foreground border-2 border-border rounded-none px-3 py-1 font-bold text-xs uppercase shadow-[2px_2px_0px_var(--shadow)] transition-all disabled:opacity-30 disabled:shadow-none hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_var(--shadow)] active:translate-x-0 active:translate-y-0 active:shadow-none"
        >
          PREV
        </button>

        <!-- Dynamic page numbers -->
        <button
          v-for="page in totalPages"
          :key="page"
          @click="goToPage(page)"
          :class="[
            'min-w-[32px] px-2 py-1 font-mono text-xs border-2 select-none transition-all',
            currentPage === page 
              ? 'bg-primary text-primary-foreground border-border shadow-[2px_2px_0px_var(--shadow)]'
              : 'bg-card text-card-foreground border-transparent hover:border-border hover:shadow-[2px_2px_0px_var(--shadow)]'
          ]"
        >
          {{ page }}
        </button>

        <button
          @click="nextPage"
          :disabled="currentPage === totalPages"
          class="bg-card text-card-foreground border-2 border-border rounded-none px-3 py-1 font-bold text-xs uppercase shadow-[2px_2px_0px_var(--shadow)] transition-all disabled:opacity-30 disabled:shadow-none hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_var(--shadow)] active:translate-x-0 active:translate-y-0 active:shadow-none"
        >
          NEXT
        </button>
      </div>
      
      <p class="text-xs font-mono uppercase text-muted">
        Page {{ currentPage }} of {{ totalPages }}
      </p>
    </div>
  </div>
</template>
