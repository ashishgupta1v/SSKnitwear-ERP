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
      :saving-order="order.savingOrder.value"
      :can-save="order.canSave.value"
      :mode-label="order.modeLabel.value"
      @save="order.saveOrder"
      @print="order.printBill"
    />

    <!-- Main content area with sidebar and workbench -->
    <main class="print-full-width mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-12">
      <!-- Sidebar for party/item selection and form controls -->
      <OrderSidebar
        :form="order.form.value"
        :quick-party="order.quickParty.value"
        :show-party-create="order.showPartyCreate.value"
        :show-item-create="order.showItemCreate.value"
        :custom-item-name="order.customItemName.value"
        :parties="order.parties.value"
        :item-options="order.itemOptions.value"
        :creating-party="order.creatingParty.value"
        :provider-warning="order.providerWarning.value"
        :feedback="order.feedback.value"
        :last-saved-order-id="order.lastSavedOrderId.value"
        :can-save="order.canSave.value"
        @update:form="order.form.value = $event"
        @update:quick-party="order.quickParty.value = $event"
        @update:show-party-create="order.showPartyCreate.value = $event"
        @update:show-item-create="order.showItemCreate.value = $event"
        @update:custom-item-name="order.customItemName.value = $event"
        @add-party="order.addParty"
        @add-item="order.addCustomItemOption"
      />

      <!-- Workbench for size grid, summary, and totals -->
      <OrderWorkbench
        :form="order.form.value"
        :rows="order.rows.value"
        :total-pieces="order.totalPieces.value"
        :subtotal="order.subtotal.value"
        :process-surcharge="order.processSurcharge.value"
        :gst-amount="order.gstAmount.value"
        :grand-total="order.grandTotal.value"
        :invoice-date="order.invoiceDate.value"
        :selected-party="order.selectedParty.value"
        :last-saved-order-id="order.lastSavedOrderId.value"
        :embroidery-summary="order.embroiderySummary.value"
        @update:form="order.form.value = $event"
        @add-row="order.addSizeRow"
        @remove-row="order.removeSizeRow"
      />
    </main>
  </div>
</template>
