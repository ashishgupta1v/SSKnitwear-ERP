<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { supabase } from './lib/supabase'

type Party = {
  id: number
  name: string
  city: string | null
  phone: string | null
  gst_no: string | null
}

type ItemRow = {
  size: string
  color: string
  pieces: number
  rate: number
}

const DEFAULT_SIZES = ['32', '34', '36', '38', '40', '42', '44']

const makeItem = (size = ''): ItemRow => ({
  size,
  color: '',
  pieces: 0,
  rate: 0,
})

const form = ref({
  party_id: '',
  item_name: 'Lower / Track Pant',
  is_embroidery: false,
  is_batch: false,
  is_printing: false,
  process_rate: 0,
  transport_details: '',
  gst_percent: 5,
  items: DEFAULT_SIZES.map((size) => makeItem(size)),
})

const parties = ref<Party[]>([])
const partyQuery = ref('')
const showPartyCreate = ref(false)
const creatingParty = ref(false)
const savingOrder = ref(false)
const feedback = ref('')
const lastSavedOrderId = ref<number | null>(null)

const quickParty = ref({
  name: '',
  city: '',
  phone: '',
  gst_no: '',
})

const isSupabaseConfigured = computed(() => Boolean(supabase))

const filteredParties = computed(() => {
  const query = partyQuery.value.trim().toLowerCase()

  if (!query) {
    return parties.value
  }

  return parties.value.filter((party) => {
    return [party.name, party.city, party.phone, party.gst_no]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  })
})

const isProcessActive = computed(() => {
  return form.value.is_embroidery || form.value.is_batch || form.value.is_printing
})

const rows = computed(() => {
  return form.value.items.map((item) => {
    const pieces = Number(item.pieces || 0)
    const rate = Number(item.rate || 0)

    return {
      ...item,
      subtotal: pieces * rate,
    }
  })
})

const subtotal = computed(() => rows.value.reduce((sum, row) => sum + row.subtotal, 0))
const totalPieces = computed(() => rows.value.reduce((sum, row) => sum + Number(row.pieces || 0), 0))
const processSurcharge = computed(() => {
  return isProcessActive.value ? totalPieces.value * Number(form.value.process_rate || 0) : 0
})
const gstAmount = computed(() => {
  return (subtotal.value + processSurcharge.value) * (Number(form.value.gst_percent || 0) / 100)
})
const grandTotal = computed(() => subtotal.value + processSurcharge.value + gstAmount.value)

const formatMoney = (value: number) => Number(value || 0).toFixed(2)

const addSizeRow = () => {
  form.value.items.push(makeItem('Custom'))
}

const removeSizeRow = (index: number) => {
  if (form.value.items.length <= 1) {
    return
  }

  form.value.items.splice(index, 1)
}

const loadParties = async () => {
  if (!supabase) {
    feedback.value = 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.'
    return
  }

  const { data, error } = await supabase
    .from('parties')
    .select('id, name, city, phone, gst_no')
    .order('name', { ascending: true })

  if (error) {
    feedback.value = error.message
    return
  }

  parties.value = (data ?? []) as Party[]
}

const addParty = async () => {
  feedback.value = ''

  if (!supabase) {
    feedback.value = 'Supabase is not configured.'
    return
  }

  if (!quickParty.value.name.trim()) {
    feedback.value = 'Party name is required.'
    return
  }

  creatingParty.value = true

  const payload = {
    name: quickParty.value.name.trim(),
    city: quickParty.value.city.trim() || null,
    phone: quickParty.value.phone.trim() || null,
    gst_no: quickParty.value.gst_no.trim() || null,
  }

  const { data, error } = await supabase
    .from('parties')
    .insert([payload])
    .select('id, name, city, phone, gst_no')
    .single()

  creatingParty.value = false

  if (error || !data) {
    feedback.value = error?.message ?? 'Unable to add party.'
    return
  }

  parties.value = [...parties.value, data as Party].sort((a, b) => a.name.localeCompare(b.name))
  form.value.party_id = String(data.id)
  showPartyCreate.value = false
  quickParty.value = { name: '', city: '', phone: '', gst_no: '' }
  feedback.value = 'Party added successfully.'
}

const saveOrder = async () => {
  feedback.value = ''

  if (!supabase) {
    feedback.value = 'Supabase is not configured.'
    return
  }

  if (!form.value.party_id) {
    feedback.value = 'Please select a party.'
    return
  }

  savingOrder.value = true

  const orderPayload = {
    party_id: Number(form.value.party_id),
    item_name: form.value.item_name.trim(),
    is_embroidery: form.value.is_embroidery,
    is_batch: form.value.is_batch,
    is_printing: form.value.is_printing,
    process_rate: isProcessActive.value ? Number(form.value.process_rate || 0) : 0,
    transport_details: form.value.transport_details.trim() || null,
    gst_percent: Number(form.value.gst_percent || 0),
    grand_total: Number(grandTotal.value.toFixed(2)),
  }

  const { data: createdOrder, error: orderError } = await supabase
    .from('orders')
    .insert([orderPayload])
    .select('id')
    .single()

  if (orderError || !createdOrder) {
    savingOrder.value = false
    feedback.value = orderError?.message ?? 'Unable to save order.'
    return
  }

  const orderItemsPayload = rows.value
    .filter((row) => Number(row.pieces || 0) > 0)
    .map((row) => ({
      order_id: createdOrder.id,
      size: row.size,
      color: row.color?.trim() || null,
      pieces: Number(row.pieces || 0),
      rate: Number(row.rate || 0),
      subtotal: Number(row.subtotal.toFixed(2)),
    }))

  if (orderItemsPayload.length === 0) {
    savingOrder.value = false
    feedback.value = 'Add at least one row with pieces greater than 0.'
    return
  }

  const { error: itemError } = await supabase.from('order_items').insert(orderItemsPayload)

  savingOrder.value = false

  if (itemError) {
    feedback.value = itemError.message
    return
  }

  lastSavedOrderId.value = createdOrder.id
  feedback.value = `Order #${createdOrder.id} saved successfully.`
}

const printBill = () => {
  window.print()
}

onMounted(loadParties)
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">Singhal Sons Knitwear</p>
          <h1 class="text-lg font-semibold">Lightning Prototype · Netlify + Supabase</h1>
        </div>
        <div class="no-print flex items-center gap-2">
          <button
            class="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
            :disabled="savingOrder || !isSupabaseConfigured"
            @click="saveOrder"
          >
            {{ savingOrder ? 'Saving...' : 'Save Order' }}
          </button>
          <button
            class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500"
            @click="printBill"
          >
            Print to PDF
          </button>
        </div>
      </div>
    </header>

    <main class="print-full-width mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-12">
      <aside class="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-4">
        <div
          v-if="!isSupabaseConfigured"
          class="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
        >
          Supabase is not configured. Create <strong>.env</strong> from <strong>.env.example</strong>.
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Party Select</label>
          <div class="flex gap-2">
            <input
              v-model="partyQuery"
              type="text"
              placeholder="Search by name / city / phone"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-0 transition focus:border-teal-500"
            />
            <button class="no-print rounded-lg border border-slate-300 px-3 py-2 text-lg leading-none" @click="showPartyCreate = !showPartyCreate">
              +
            </button>
          </div>
          <select v-model="form.party_id" class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option disabled value="">Select party</option>
            <option v-for="party in filteredParties" :key="party.id" :value="String(party.id)">
              {{ party.name }} · {{ party.city || 'NA' }}
            </option>
          </select>
        </div>

        <div v-if="showPartyCreate" class="no-print space-y-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
          <input v-model="quickParty.name" type="text" placeholder="Party name" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input v-model="quickParty.city" type="text" placeholder="City" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input v-model="quickParty.phone" type="text" placeholder="Phone" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <input v-model="quickParty.gst_no" type="text" placeholder="GST No" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button class="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60" :disabled="creatingParty || !isSupabaseConfigured" @click="addParty">
            {{ creatingParty ? 'Adding...' : 'Quick Add Party' }}
          </button>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Item Name</label>
          <input v-model="form.item_name" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>

        <div class="grid gap-2">
          <label class="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
            <span>Embroidery</span>
            <input v-model="form.is_embroidery" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-teal-600" />
          </label>
          <label class="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
            <span>Batch</span>
            <input v-model="form.is_batch" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-teal-600" />
          </label>
          <label class="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-sm">
            <span>Printing</span>
            <input v-model="form.is_printing" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-teal-600" />
          </label>
        </div>

        <div v-if="isProcessActive">
          <label class="mb-1 block text-sm font-medium text-slate-700">Process Rate</label>
          <input v-model.number="form.process_rate" type="number" min="0" step="0.01" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">GST %</label>
          <input v-model.number="form.gst_percent" type="number" min="0" step="0.01" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium text-slate-700">Transport Details</label>
          <input v-model="form.transport_details" type="text" placeholder="Lorry / courier / self pickup" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>

        <div v-if="feedback" class="rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-sm text-teal-800">
          {{ feedback }}
        </div>

        <div v-if="lastSavedOrderId" class="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Last saved order: #{{ lastSavedOrderId }}
        </div>
      </aside>

      <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-8">
        <div class="mb-3 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold">Size Grid</h2>
            <p class="text-sm text-slate-500">Real-time math with Supabase persistence.</p>
          </div>
          <button class="no-print rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium" @click="addSizeRow">Add Row</button>
        </div>

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
              <tr v-for="(item, index) in form.items" :key="`${item.size}-${index}`">
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
                <td class="border border-slate-200 px-3 py-2 text-right font-medium">
                  ₹ {{ formatMoney(rows[index].subtotal) }}
                </td>
                <td class="no-print border border-slate-200 px-3 py-2 text-center">
                  <button class="text-xs font-medium text-rose-600" @click="removeSizeRow(index)">Remove</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="mt-4 grid gap-4 lg:grid-cols-2">
          <div class="rounded-2xl border border-slate-200 p-4">
            <h3 class="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Bill Summary</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between"><span>Total Pieces</span><strong>{{ totalPieces }}</strong></div>
              <div class="flex justify-between"><span>Subtotal</span><strong>₹ {{ formatMoney(subtotal) }}</strong></div>
              <div class="flex justify-between"><span>Process Surcharge</span><strong>₹ {{ formatMoney(processSurcharge) }}</strong></div>
              <div class="flex justify-between"><span>GST {{ form.gst_percent }}%</span><strong>₹ {{ formatMoney(gstAmount) }}</strong></div>
            </div>
          </div>
          <div class="rounded-2xl bg-slate-900 p-4 text-white">
            <div class="text-xs uppercase tracking-[0.2em] text-slate-300">Grand Total</div>
            <div class="mt-2 text-3xl font-bold">₹ {{ formatMoney(grandTotal) }}</div>
            <p class="mt-3 text-sm text-slate-300">Formula: (Subtotal + Surcharge) × (1 + GST%)</p>
            <div class="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
              Phase 1 limitation: bill export uses browser Print to PDF.
            </div>
          </div>
        </footer>
      </section>
    </main>
  </div>
</template>
