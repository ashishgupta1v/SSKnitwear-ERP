<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DraftForm, Party, QuickParty } from '../../types/order'

// Define props for sidebar data and state
const props = defineProps<{
  form: DraftForm
  quickParty: QuickParty
  showPartyCreate: boolean
  showItemCreate: boolean
  customItemName: string
  parties: Party[]
  itemOptions: string[]
  creatingParty: boolean
  providerWarning: string
  feedback: string
  lastSavedOrderId: number | null
  canSave: boolean
}>()

// Define emits for updating models and actions
const emit = defineEmits<{
  (e: 'update:form', value: DraftForm): void
  (e: 'update:quick-party', value: QuickParty): void
  (e: 'update:show-party-create', value: boolean): void
  (e: 'update:show-item-create', value: boolean): void
  (e: 'update:custom-item-name', value: string): void
  (e: 'add-party'): void
  (e: 'add-item'): void
}>()

// Local reactive copies for v-model bindings
const localForm = ref({ ...props.form })
const localQuickParty = ref({ ...props.quickParty })
const localShowPartyCreate = ref(props.showPartyCreate)
const localShowItemCreate = ref(props.showItemCreate)
const localCustomItemName = ref(props.customItemName)

// Watch props to update locals
watch(() => props.form, (newForm) => { localForm.value = { ...newForm } }, { deep: true })
watch(() => props.quickParty, (newQuickParty) => { localQuickParty.value = { ...newQuickParty } }, { deep: true })
watch(() => props.showPartyCreate, (newValue) => { localShowPartyCreate.value = newValue })
watch(() => props.showItemCreate, (newValue) => { localShowItemCreate.value = newValue })
watch(() => props.customItemName, (newValue) => { localCustomItemName.value = newValue })

// Watch locals to emit updates
watch(localForm, (newForm) => { emit('update:form', newForm) }, { deep: true })
watch(localQuickParty, (newQuickParty) => { emit('update:quick-party', newQuickParty) }, { deep: true })
watch(localShowPartyCreate, (newValue) => { emit('update:show-party-create', newValue) })
watch(localShowItemCreate, (newValue) => { emit('update:show-item-create', newValue) })
watch(localCustomItemName, (newValue) => { emit('update:custom-item-name', newValue) })
</script>

<template>
  <!-- Sidebar for order configuration -->
  <aside class="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-4">
    <!-- Provider warning if not configured -->
    <div
      v-if="providerWarning"
      class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
    >
      {{ providerWarning }}
    </div>

    <!-- Party selection section -->
    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700">Party Select</label>
      <div class="flex items-start gap-2">
        <!-- Party dropdown -->
        <select v-model="localForm.party_id" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option disabled value="">Select party</option>
          <option v-for="party in props.parties" :key="party.id" :value="String(party.id)">
            {{ party.name }} · {{ party.city || 'NA' }}
          </option>
        </select>
        <!-- Toggle party creation modal -->
        <button
          type="button"
          class="no-print rounded-lg border border-slate-300 px-3 py-2 text-lg leading-none"
          @click="localShowPartyCreate = !localShowPartyCreate"
        >
          +
        </button>
      </div>
    </div>

    <!-- Quick party creation form -->
    <div v-if="localShowPartyCreate" class="no-print space-y-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
      <input v-model="localQuickParty.name" type="text" placeholder="Party name" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="localQuickParty.city" type="text" placeholder="City" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="localQuickParty.phone" type="text" placeholder="Phone" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <input v-model="localQuickParty.gst_no" type="text" placeholder="GST No" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <!-- Add party button -->
      <button
        class="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        :disabled="props.creatingParty || !props.canSave"
        @click="emit('add-party')"
      >
        {{ props.creatingParty ? 'Adding...' : 'Quick Add Party' }}
      </button>
    </div>

    <!-- Item name selection section -->
    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700">Item Name</label>
      <div class="flex items-start gap-2">
        <!-- Item dropdown -->
        <select v-model="localForm.item_name" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option v-for="option in props.itemOptions" :key="option" :value="option">{{ option }}</option>
        </select>
        <!-- Toggle item creation modal -->
        <button
          type="button"
          class="no-print rounded-lg border border-slate-300 px-3 py-2 text-lg leading-none"
          @click="localShowItemCreate = !localShowItemCreate"
        >
          +
        </button>
      </div>
    </div>

    <!-- Custom item creation form -->
    <div v-if="localShowItemCreate" class="no-print space-y-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
      <input
        v-model="localCustomItemName"
        type="text"
        placeholder="Custom item name"
        class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        @keyup.enter="emit('add-item')"
      />
      <!-- Add item button -->
      <button class="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white" @click="emit('add-item')">
        Add Item Option
      </button>
    </div>

    <!-- Embroidery configuration section -->
    <div class="rounded-xl border border-slate-200 p-3 text-sm">
      <p class="font-medium text-slate-800">Embroidery</p>
      <div class="mt-2 flex items-center gap-4">
        <!-- Embroidery yes/no radio buttons -->
        <label class="inline-flex items-center gap-2">
          <input v-model="localForm.is_embroidery" :value="true" type="radio" class="h-4 w-4 border-slate-300 text-teal-600" />
          <span>Yes</span>
        </label>
        <label class="inline-flex items-center gap-2">
          <input v-model="localForm.is_embroidery" :value="false" type="radio" class="h-4 w-4 border-slate-300 text-teal-600" />
          <span>No</span>
        </label>
      </div>

      <!-- Embroidery placement checkboxes, shown if embroidery is yes -->
      <div v-if="localForm.is_embroidery" class="mt-3 space-y-2">
        <label class="flex items-center gap-2">
          <input v-model="localForm.embroidery_placements" value="Front" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-teal-600" />
          <span>Front</span>
        </label>
        <label class="flex items-center gap-2">
          <input v-model="localForm.embroidery_placements" value="Back" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-teal-600" />
          <span>Back</span>
        </label>
        <label class="flex items-center gap-2">
          <input v-model="localForm.embroidery_placements" value="Others" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-teal-600" />
          <span>Others</span>
        </label>

        <!-- Textarea for other embroidery details -->
        <textarea
          v-if="localForm.embroidery_placements.includes('Others')"
          v-model="localForm.embroidery_others_text"
          rows="2"
          placeholder="Specify other embroidery placement"
          class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
    </div>

    <!-- Process toggles for batch and printing -->
    <div class="grid gap-2">
      <label class="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
        <span>Batch</span>
        <input v-model="localForm.is_batch" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-teal-600" />
      </label>
      <label class="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
        <span>Printing</span>
        <input v-model="localForm.is_printing" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-teal-600" />
      </label>
    </div>

    <!-- Process rate input, shown if any process is active -->
    <div v-if="localForm.is_embroidery || localForm.is_batch || localForm.is_printing">
      <label class="mb-1 block text-sm font-medium text-slate-700">Process Rate</label>
      <input v-model.number="localForm.process_rate" type="number" min="0" step="0.01" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
    </div>

    <!-- GST percentage input -->
    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700">GST %</label>
      <input v-model.number="localForm.gst_percent" type="number" min="0" step="0.01" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
    </div>

    <!-- Transport details input -->
    <div>
      <label class="mb-1 block text-sm font-medium text-slate-700">Transport Details</label>
      <input v-model="localForm.transport_details" type="text" placeholder="Lorry / courier / self pickup" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
    </div>

    <!-- Feedback message display -->
    <div v-if="props.feedback" class="rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-sm text-teal-800">
      {{ props.feedback }}
    </div>

    <!-- Last saved order ID display -->
    <div v-if="props.lastSavedOrderId" class="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
      Last saved order: #{{ props.lastSavedOrderId }}
    </div>
  </aside>
</template>
