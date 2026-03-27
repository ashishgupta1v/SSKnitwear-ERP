<script setup lang="ts">
import type { DraftForm, ItemRow, Party } from '../../types/order'

defineProps<{
  form: DraftForm
  rows: ItemRow[]
  selectedParty: Party | null
  invoiceDate: string
  invoiceDateTime: string
  lastSavedOrderId: number | null
  subtotal: number
  processSurcharge: number
  gstAmount: number
  grandTotal: number
  embroiderySummary: string
}>()

const formatMoney = (value: number) => Number(value || 0).toFixed(2)
const getOrderItems = (rows: ItemRow[]) => rows.filter((row) => Number(row.pieces || 0) > 0)
</script>

<template>
  <div class="print-only">
    <div class="bg-white p-8 text-gray-900">
      <!-- Company Header -->
      <div class="mb-8 border-b-2 border-gray-300 pb-4">
        <h1 class="text-3xl font-bold text-teal-700">SINGHAL SONS KNITWEAR</h1>
        <p class="text-sm text-gray-600">Order Invoice</p>
      </div>

      <!-- Order Header Info -->
      <div class="mb-8 grid grid-cols-2 gap-8">
        <!-- Party Details -->
        <div>
          <h3 class="mb-2 text-sm font-semibold text-gray-700">CUSTOMER DETAILS</h3>
          <div class="space-y-1 text-sm">
            <p><span class="font-semibold">Name:</span> {{ selectedParty?.name || 'N/A' }}</p>
            <p><span class="font-semibold">City:</span> {{ selectedParty?.city || 'N/A' }}</p>
            <p><span class="font-semibold">Phone:</span> {{ selectedParty?.phone || 'N/A' }}</p>
            <p><span class="font-semibold">GST No:</span> {{ selectedParty?.gst_no || 'N/A' }}</p>
          </div>
        </div>

        <!-- Order Details -->
        <div>
          <h3 class="mb-2 text-sm font-semibold text-gray-700">ORDER DETAILS</h3>
          <div class="space-y-1 text-sm">
            <p v-if="lastSavedOrderId"><span class="font-semibold">Order ID:</span> #{{ lastSavedOrderId }}</p>
            <p><span class="font-semibold">Date & Time:</span> {{ invoiceDateTime }}</p>
            <p><span class="font-semibold">Item:</span> {{ form.item_name }}</p>
            <p><span class="font-semibold">Total Pieces:</span> {{ getOrderItems(rows).reduce((sum, row) => sum + Number(row.pieces || 0), 0) }}</p>
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div class="mb-8">
        <h3 class="mb-3 text-sm font-semibold text-gray-700">ORDER ITEMS</h3>
        <table class="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr class="bg-gray-100">
              <th class="border border-gray-300 px-3 py-2 text-left font-semibold">Size</th>
              <th class="border border-gray-300 px-3 py-2 text-left font-semibold">Color</th>
              <th class="border border-gray-300 px-3 py-2 text-center font-semibold">Pieces</th>
              <th class="border border-gray-300 px-3 py-2 text-right font-semibold">Rate</th>
              <th class="border border-gray-300 px-3 py-2 text-right font-semibold">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, idx) in getOrderItems(rows)" :key="idx">
              <td class="border border-gray-300 px-3 py-2">{{ row.size || '-' }}</td>
              <td class="border border-gray-300 px-3 py-2">{{ row.color || '-' }}</td>
              <td class="border border-gray-300 px-3 py-2 text-center">{{ row.pieces }}</td>
              <td class="border border-gray-300 px-3 py-2 text-right">₹{{ formatMoney(row.rate) }}</td>
              <td class="border border-gray-300 px-3 py-2 text-right">₹{{ formatMoney(Number(row.pieces) * Number(row.rate)) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Summary Section -->
      <div class="mb-8 grid grid-cols-2 gap-8">
        <!-- Special Details -->
        <div v-if="form.is_embroidery || form.is_batch || form.is_printing || form.transport_details">
          <h3 class="mb-2 text-sm font-semibold text-gray-700">SPECIAL REQUIREMENTS</h3>
          <div class="space-y-1 text-sm">
            <p v-if="form.is_embroidery"><span class="font-semibold">Embroidery:</span> {{ embroiderySummary }}</p>
            <p v-if="form.is_batch"><span class="font-semibold">Batch Order:</span> Yes</p>
            <p v-if="form.is_printing"><span class="font-semibold">Printing:</span> Yes</p>
            <p v-if="form.transport_details"><span class="font-semibold">Transport:</span> {{ form.transport_details }}</p>
          </div>
        </div>

        <!-- Financial Summary -->
        <div>
          <h3 class="mb-2 text-sm font-semibold text-gray-700">FINANCIAL SUMMARY</h3>
          <div class="space-y-1 border-t border-gray-300 pt-2 text-sm">
            <div class="flex justify-between">
              <span>Subtotal:</span>
              <span class="font-semibold">₹{{ formatMoney(subtotal) }}</span>
            </div>
            <div v-if="form.is_printing" class="flex justify-between">
              <span>Printing Charges:</span>
              <span class="font-semibold">₹0.00</span>
            </div>
            <div v-if="form.process_rate && processSurcharge > 0" class="flex justify-between">
              <span>Process Surcharge (@ ₹{{ formatMoney(form.process_rate) }}):</span>
              <span class="font-semibold">₹{{ formatMoney(processSurcharge) }}</span>
            </div>
            <div class="flex justify-between border-t border-gray-300 pt-2">
              <span>Subtotal after charges:</span>
              <span class="font-semibold">₹{{ formatMoney(subtotal + processSurcharge) }}</span>
            </div>
            <div class="flex justify-between">
              <span>GST ({{ form.gst_percent }}%):</span>
              <span class="font-semibold">₹{{ formatMoney(gstAmount) }}</span>
            </div>
            <div class="flex justify-between border-t-2 border-gray-400 pt-2 text-base font-bold">
              <span>TOTAL AMOUNT:</span>
              <span class="text-teal-700">₹{{ formatMoney(grandTotal) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t-2 border-gray-300 pt-4 text-center text-xs text-gray-600">
        <p>This is a computer-generated invoice. No signature required.</p>
        <p>Thank you for your business!</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.print-only {
  display: none;
}

@media print {
  .print-only {
    display: block;
  }

  /* Hide non-print content */
  :global(.no-print) {
    display: none !important;
  }

  /* Optimize for print */
  :global(body) {
    margin: 0;
    padding: 0;
  }

  div {
    page-break-inside: avoid;
  }
}
</style>
