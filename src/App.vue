<script setup lang="ts">
// Import Vue components for the order entry interface
import OrderHeader from './components/order/OrderHeader.vue'
import OrderSidebar from './components/order/OrderSidebar.vue'
import OrderWorkbench from './components/order/OrderWorkbench.vue'
// Import the main composable for order state management
import { useOrderEntry } from './composables/useOrderEntry'

// Initialize the order entry composable with reactive state and methods
const order = useOrderEntry()
</script>

<template>
  <!-- Root app container with background and layout -->
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <!-- Header component with save/print buttons and mode indicator -->
    <OrderHeader
      :saving-order="order.savingOrder"
      :can-save="order.canSave"
      :mode-label="order.modeLabel"
      @save="order.saveOrder"
      @print="order.printBill"
    />

    <!-- Main content area with sidebar and workbench -->
    <main class="print-full-width mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-12">
      <!-- Sidebar for party/item selection and form controls -->
      <OrderSidebar
        v-model:form="order.form"
        v-model:quick-party="order.quickParty"
        v-model:show-party-create="order.showPartyCreate"
        v-model:show-item-create="order.showItemCreate"
        v-model:custom-item-name="order.customItemName"
        :parties="order.parties"
        :item-options="order.itemOptions"
        :creating-party="order.creatingParty"
        :provider-warning="order.providerWarning"
        :feedback="order.feedback"
        :last-saved-order-id="order.lastSavedOrderId"
        :can-save="order.canSave"
        @add-party="order.addParty"
        @add-item="order.addCustomItemOption"
      />

      <!-- Workbench for size grid, summary, and totals -->
      <OrderWorkbench
        v-model:form="order.form"
        :rows="order.rows"
        :total-pieces="order.totalPieces"
        :subtotal="order.subtotal"
        :process-surcharge="order.processSurcharge"
        :gst-amount="order.gstAmount"
        :grand-total="order.grandTotal"
        :invoice-date="order.invoiceDate"
        :selected-party="order.selectedParty"
        :last-saved-order-id="order.lastSavedOrderId"
        :embroidery-summary="order.embroiderySummary"
        @add-row="order.addSizeRow"
        @remove-row="order.removeSizeRow"
      />
    </main>
  </div>
</template>
