<script setup lang="ts">
// Define props for the header component
defineProps<{
  savingOrder: boolean
  canSave: boolean
  modeLabel: string
}>()

// Define emits for save and print events
const emit = defineEmits<{
  (e: 'save'): void
  (e: 'print'): void
}>()
</script>

<template>
  <!-- Sticky header with company branding and action buttons -->
  <header class="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
      <!-- Company name and mode label -->
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">Singhal Sons Knitwear</p>
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-lg font-semibold">Order Entry</h1>
          <!-- Display current provider mode -->
          <span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{{ modeLabel }}</span>
        </div>
      </div>
      <!-- Save and print buttons -->
      <div class="flex items-center gap-2">
        <!-- Save order button, disabled if saving or not configured -->
        <button
          class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
          :disabled="savingOrder || !canSave"
          @click="emit('save')"
        >
          {{ savingOrder ? 'Saving...' : 'Save Order' }}
        </button>
        <!-- Print to PDF button -->
        <button
          class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500"
          @click="emit('print')"
        >
          Print to PDF
        </button>
      </div>
    </div>
  </header>
</template>
