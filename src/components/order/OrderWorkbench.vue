<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DraftForm, Party } from '../../types/order'

// Define props for workbench data
const props = defineProps<{
  rows: Array<{ size: string; color: string; pieces: number; rate: number; subtotal: number }>
  totalPieces: number
  subtotal: number
  processSurcharge: number
  gstAmount: number
  grandTotal: number
  invoiceDate: string
  selectedParty: Party | null
  lastSavedOrderId: number | null
  embroiderySummary: string
  form: DraftForm
}>()

// Define emits for row management and form updates
const emit = defineEmits<{
  (e: 'add-row'): void
  (e: 'remove-row', index: number): void
  (e: 'update:form', form: DraftForm): void
}>()

// Local reactive copy of form for v-model compatibility
const localForm = ref<DraftForm>({ ...props.form })

// Guard flag to prevent watch loops (prop→local→emit→prop)
let syncingFromProps = false

// Watch for changes in localForm and emit updates (skip if syncing from props)
watch(localForm, (newForm) => {
  if (!syncingFromProps) emit('update:form', newForm)
}, { deep: true })

// Watch for changes in props.form and update localForm (guarded)
watch(() => props.form, (newForm) => {
  syncingFromProps = true
  localForm.value = { ...newForm }
  syncingFromProps = false
}, { deep: true })

// Utility function to format money
const formatMoney = (value: number) => Number(value || 0).toFixed(2)
</script>

<template>
  <!-- Main workbench section for size grid and summary -->
  <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-8">
    <!-- Print-only invoice header -->
    <div class="print-only mb-4 border-b border-slate-300 pb-3">
      <h2 class="text-xl font-bold">Singhal Sons Knitwear</h2>
      <p class="text-sm">Invoice Date: {{ props.invoiceDate }}</p>
      <p class="text-sm">Party: {{ props.selectedParty?.name || 'N/A' }}</p>
      <p class="text-sm">Item: {{ localForm.item_name }}</p>
      <p class="text-sm">Embroidery: {{ props.embroiderySummary }}</p>
      <p class="text-sm" v-if="props.lastSavedOrderId">Order #: {{ props.lastSavedOrderId }}</p>
    </div>

    <!-- Size grid header -->
    <div class="mb-3 flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold">Size Grid</h2>
        <p class="text-sm text-slate-500">Update sizes, pieces and rates.</p>
      </div>
      <!-- Add row button -->
      <button class="no-print rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium" @click="emit('add-row')">
        Add Row
      </button>
    </div>

    <!-- Size grid table -->
    <div class="overflow-x-auto">
      <table class="min-w-full border-collapse text-sm">
        <thead>
          <tr class="bg-slate-100 text-left text-slate-700">
            <th class="border border-slate-200 px-3 py-2">Size</th>
            <th class="border border-slate-200 px-3 py-2">Color</th>
            <th class="border border-slate-200 px-3 py-2">Pieces</th>
            <th class="border border-slate-200 px-3 py-2">Rate</th>
            <th class="border border-slate-200 px-3 py-2">Row Total</th>
            <th class="no-print border border-slate-200 px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          <!-- Table rows for each item -->
          <tr v-for="(item, index) in localForm.items" :key="`${item.size}-${index}`">
            <td class="border border-slate-200 px-3 py-2">
              <input v-model="item.size" type="text" class="w-24 rounded-lg border border-slate-300 px-2 py-1" />
            </td>
            <td class="border border-slate-200 px-3 py-2">
              <input v-model="item.color" type="text" class="w-full rounded-lg border border-slate-300 px-2 py-1" />
            </td>
            <td class="border border-slate-200 px-3 py-2">
              <input v-model.number="item.pieces" type="number" min="0" class="w-full rounded-lg border border-slate-300 px-2 py-1" />
            </td>
            <td class="border border-slate-200 px-3 py-2">
              <input v-model.number="item.rate" type="number" min="0" step="0.01" class="w-full rounded-lg border border-slate-300 px-2 py-1" />
            </td>
            <td class="border border-slate-200 px-3 py-2 text-right font-medium">₹ {{ formatMoney(props.rows[index].subtotal) }}</td>
            <td class="no-print border border-slate-200 px-3 py-2 text-center">
              <!-- Remove row button -->
              <button class="text-xs font-medium text-rose-600" @click="emit('remove-row', index)">Remove</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Bill summary and grand total footer -->
    <footer class="mt-4 grid gap-4 lg:grid-cols-2">
      <!-- Bill summary section -->
      <div class="rounded-2xl border border-slate-200 p-4">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Bill Summary</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span>Total Pieces</span><strong>{{ props.totalPieces }}</strong></div>
          <div class="flex justify-between"><span>Subtotal</span><strong>₹ {{ formatMoney(props.subtotal) }}</strong></div>
          <div class="flex justify-between"><span>Process Surcharge</span><strong>₹ {{ formatMoney(props.processSurcharge) }}</strong></div>
          <div class="flex justify-between"><span>GST {{ localForm.gst_percent }}%</span><strong>₹ {{ formatMoney(props.gstAmount) }}</strong></div>
        </div>
      </div>
      <!-- Grand total section -->
      <div class="rounded-2xl bg-slate-900 p-4 text-white">
        <div class="text-xs uppercase tracking-[0.2em] text-slate-300">Grand Total</div>
        <div class="mt-2 text-3xl font-bold">₹ {{ formatMoney(props.grandTotal) }}</div>
        <p class="mt-3 text-sm text-slate-300">Formula: (Subtotal + Surcharge) × (1 + GST%)</p>
      </div>
    </footer>

    <!-- Print-only footer with transport and signature -->
    <div class="print-only mt-6 border-t border-slate-300 pt-3 text-sm">
      <div class="flex items-center justify-between">
        <span>Transport: {{ localForm.transport_details || 'N/A' }}</span>
        <span>Authorized Signature</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Hide print-only elements in normal view */
.print-only {
  display: none;
}

/* Show print-only elements when printing */
@media print {
  .print-only {
    display: block !important;
  }
}
</style>
