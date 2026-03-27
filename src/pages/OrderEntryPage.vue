<script setup lang="ts">
import OrderHeader from '../components/order/OrderHeader.vue'
import OrderSidebar from '../components/order/OrderSidebar.vue'
import OrderWorkbench from '../components/order/OrderWorkbench.vue'
import { useOrderEntry } from '../composables/useOrderEntry'
import { computed } from 'vue'

const order = useOrderEntry()

const savingOrder = computed(() => order.savingOrder.value)
const canSave = computed(() => order.canSave.value)
const modeLabel = computed(() => order.modeLabel.value)
const form = computed(() => order.form.value)
const quickParty = computed(() => order.quickParty.value)
const showPartyCreate = computed(() => order.showPartyCreate.value)
const showItemCreate = computed(() => order.showItemCreate.value)
const customItemName = computed(() => order.customItemName.value)
const parties = computed(() => order.parties.value)
const itemOptions = computed(() => order.itemOptions.value)
const creatingParty = computed(() => order.creatingParty.value)
const providerWarning = computed(() => order.providerWarning.value)
const feedback = computed(() => order.feedback.value)
const lastSavedOrderId = computed(() => order.lastSavedOrderId.value)
const rows = computed(() => order.rows.value)
const totalPieces = computed(() => order.totalPieces.value)
const subtotal = computed(() => order.subtotal.value)
const processSurcharge = computed(() => order.processSurcharge.value)
const gstAmount = computed(() => order.gstAmount.value)
const grandTotal = computed(() => order.grandTotal.value)
const invoiceDate = computed(() => order.invoiceDate.value)
const selectedParty = computed(() => order.selectedParty.value)
const embroiderySummary = computed(() => order.embroiderySummary.value)
</script>

<template>
  <div>
    <OrderHeader
      :saving-order="savingOrder"
      :can-save="canSave"
      :mode-label="modeLabel"
      @save="order.saveOrder"
      @print="order.printBill"
    />

    <main class="print-full-width mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-12">
      <OrderSidebar
        :form="form"
        :quick-party="quickParty"
        :show-party-create="showPartyCreate"
        :show-item-create="showItemCreate"
        :custom-item-name="customItemName"
        :parties="parties"
        :item-options="itemOptions"
        :creating-party="creatingParty"
        :provider-warning="providerWarning"
        :feedback="feedback"
        :last-saved-order-id="lastSavedOrderId"
        :can-save="canSave"
        @update:form="order.form.value = $event"
        @update:quick-party="order.quickParty.value = $event"
        @update:show-party-create="order.showPartyCreate.value = $event"
        @update:show-item-create="order.showItemCreate.value = $event"
        @update:custom-item-name="order.customItemName.value = $event"
        @add-party="order.addParty"
        @add-item="order.addCustomItemOption"
      />

      <OrderWorkbench
        :form="form"
        :rows="rows"
        :total-pieces="totalPieces"
        :subtotal="subtotal"
        :process-surcharge="processSurcharge"
        :gst-amount="gstAmount"
        :grand-total="grandTotal"
        :invoice-date="invoiceDate"
        :selected-party="selectedParty"
        :last-saved-order-id="lastSavedOrderId"
        :embroidery-summary="embroiderySummary"
        @update:form="order.form.value = $event"
        @add-row="order.addSizeRow"
        @remove-row="order.removeSizeRow"
      />
    </main>
  </div>
</template>
