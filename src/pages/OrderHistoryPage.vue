<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { listOrders, fetchOrder, providerConfigured } from '../services/orderDataProvider'
import { useTheme } from '../composables/useTheme'
import { formatDateIST, formatDateTimeIST } from '../lib/dateFormatter'
import type { OrderSummary, OrderDetail } from '../types/order'

const router = useRouter()
const { isDark, toggleTheme } = useTheme()
const orders = ref<OrderSummary[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')

// Expanded order detail
const expandedOrderId = ref<number | null>(null)
const expandedOrder = ref<OrderDetail | null>(null)
const loadingDetail = ref(false)

const filteredOrders = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return orders.value

  return orders.value.filter((order) => {
    const partyName = (order.party as { name: string } | null)?.name ?? ''
    return (
      String(order.id).includes(q) ||
      order.item_name.toLowerCase().includes(q) ||
      partyName.toLowerCase().includes(q) ||
      String(order.grand_total).includes(q) ||
      formatDate(order.created_at).toLowerCase().includes(q)
    )
  })
})

const formatMoney = (value: number) => Number(value || 0).toFixed(2)

const formatDate = (dateStr: string) => formatDateIST(dateStr)

const formatDateTime = (dateStr: string) => formatDateTimeIST(dateStr)

const loadOrders = async () => {
  if (!providerConfigured) {
    error.value = 'Data provider is not configured.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    orders.value = await listOrders()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to load orders.'
  } finally {
    loading.value = false
  }
}

const toggleDetail = async (orderId: number) => {
  if (expandedOrderId.value === orderId) {
    expandedOrderId.value = null
    expandedOrder.value = null
    return
  }

  expandedOrderId.value = orderId
  expandedOrder.value = null
  loadingDetail.value = true

  try {
    expandedOrder.value = await fetchOrder(orderId)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to load order details.'
    expandedOrderId.value = null
  } finally {
    loadingDetail.value = false
  }
}

const goToEntry = () => {
  router.push({ name: 'order-entry' })
}

onMounted(loadOrders)
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <!-- Header -->
    <header class="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">Singhal Sons Knitwear</p>
          <h1 class="text-lg font-semibold">Order History</h1>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            @click="toggleTheme"
          >
            {{ isDark ? 'Light Mode' : 'Dark Mode' }}
          </button>
          <button
            class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            @click="goToEntry"
          >
            ← Back
          </button>
          <button
            class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
            @click="loadOrders"
          >
            Refresh
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 py-4">
      <!-- Search bar -->
      <div class="mb-4">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by order #, party name, item, amount, or date..."
          class="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="text-sm text-slate-500">Loading orders...</div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {{ error }}
      </div>

      <!-- Empty state -->
      <div v-else-if="!filteredOrders.length && !searchQuery" class="flex flex-col items-center justify-center py-16 text-center">
        <p class="text-slate-500">No orders found.</p>
        <button
          class="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          @click="goToEntry"
        >
          Create your first order
        </button>
      </div>

      <!-- No search results -->
      <div v-else-if="!filteredOrders.length && searchQuery" class="py-16 text-center text-sm text-slate-500">
        No orders match "<strong>{{ searchQuery }}</strong>"
      </div>

      <!-- Order list -->
      <div v-else class="space-y-2">
        <div
          v-for="order in filteredOrders"
          :key="order.id"
          class="rounded-xl border border-slate-200 bg-white shadow-sm transition"
        >
          <!-- Summary row (clickable) -->
          <button
            class="flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-slate-50"
            @click="toggleDetail(order.id)"
          >
            <!-- Order ID badge -->
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-xs font-bold text-teal-700">
              #{{ order.id }}
            </span>

            <!-- Main info -->
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span class="truncate text-sm font-medium text-slate-900">
                  {{ (order.party as { name: string } | null)?.name ?? 'Unknown party' }}
                </span>
                <span class="text-xs text-slate-400">&middot;</span>
                <span class="truncate text-xs text-slate-500">{{ order.item_name }}</span>
              </div>
              <p class="mt-0.5 text-xs text-slate-400">{{ formatDate(order.created_at) }}</p>
            </div>

            <!-- Grand total -->
            <div class="shrink-0 text-right">
              <p class="text-sm font-semibold text-slate-900">&#8377; {{ formatMoney(order.grand_total) }}</p>
            </div>

            <!-- Expand chevron -->
            <svg
              class="h-4 w-4 shrink-0 text-slate-400 transition-transform"
              :class="{ 'rotate-180': expandedOrderId === order.id }"
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
            >
              <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
            </svg>
          </button>

          <!-- Expanded detail -->
          <div v-if="expandedOrderId === order.id" class="border-t border-slate-100 px-4 py-4">
            <div v-if="loadingDetail" class="py-4 text-center text-sm text-slate-400">Loading details...</div>

            <div v-else-if="expandedOrder" class="space-y-4">
              <!-- Order metadata grid -->
              <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-4">
                <div>
                  <span class="text-xs font-medium uppercase text-slate-400">Order #</span>
                  <p class="font-medium">{{ expandedOrder.id }}</p>
                </div>
                <div>
                  <span class="text-xs font-medium uppercase text-slate-400">Date</span>
                  <p>{{ formatDateTime(expandedOrder.created_at) }}</p>
                </div>
                <div>
                  <span class="text-xs font-medium uppercase text-slate-400">Party</span>
                  <p>{{ (expandedOrder.party as { name: string } | null)?.name ?? 'N/A' }}</p>
                </div>
                <div>
                  <span class="text-xs font-medium uppercase text-slate-400">City</span>
                  <p>{{ (expandedOrder.party as { city: string | null } | null)?.city ?? 'N/A' }}</p>
                </div>
                <div>
                  <span class="text-xs font-medium uppercase text-slate-400">Item</span>
                  <p>{{ expandedOrder.item_name }}</p>
                </div>
                <div>
                  <span class="text-xs font-medium uppercase text-slate-400">Embroidery</span>
                  <p>{{ expandedOrder.is_embroidery ? (expandedOrder.embroidery_details || 'Yes') : 'No' }}</p>
                </div>
                <div>
                  <span class="text-xs font-medium uppercase text-slate-400">Batch</span>
                  <p>{{ expandedOrder.is_batch ? 'Yes' : 'No' }}</p>
                </div>
                <div>
                  <span class="text-xs font-medium uppercase text-slate-400">Printing</span>
                  <p>{{ expandedOrder.is_printing ? 'Yes' : 'No' }}</p>
                </div>
                <div>
                  <span class="text-xs font-medium uppercase text-slate-400">Process Rate</span>
                  <p>&#8377; {{ formatMoney(expandedOrder.process_rate) }}</p>
                </div>
                <div>
                  <span class="text-xs font-medium uppercase text-slate-400">GST %</span>
                  <p>{{ expandedOrder.gst_percent }}%</p>
                </div>
                <div>
                  <span class="text-xs font-medium uppercase text-slate-400">Transport</span>
                  <p>{{ expandedOrder.transport_details || 'N/A' }}</p>
                </div>
                <div>
                  <span class="text-xs font-medium uppercase text-slate-400">Grand Total</span>
                  <p class="font-semibold text-slate-900">&#8377; {{ formatMoney(expandedOrder.grand_total) }}</p>
                </div>
              </div>

              <!-- Line items table -->
              <div v-if="expandedOrder.items && expandedOrder.items.length">
                <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Line Items</h3>
                <div class="overflow-x-auto">
                  <table class="min-w-full border-collapse text-sm">
                    <thead>
                      <tr class="bg-slate-50 text-left text-slate-600">
                        <th class="border border-slate-200 px-3 py-2">Size</th>
                        <th class="border border-slate-200 px-3 py-2">Color</th>
                        <th class="border border-slate-200 px-3 py-2 text-right">Pieces</th>
                        <th class="border border-slate-200 px-3 py-2 text-right">Rate</th>
                        <th class="border border-slate-200 px-3 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in expandedOrder.items" :key="item.id">
                        <td class="border border-slate-200 px-3 py-2">{{ item.size }}</td>
                        <td class="border border-slate-200 px-3 py-2">{{ item.color || '—' }}</td>
                        <td class="border border-slate-200 px-3 py-2 text-right">{{ item.pieces }}</td>
                        <td class="border border-slate-200 px-3 py-2 text-right">&#8377; {{ formatMoney(item.rate) }}</td>
                        <td class="border border-slate-200 px-3 py-2 text-right font-medium">&#8377; {{ formatMoney(item.subtotal) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary stats -->
        <div class="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
          <span class="text-slate-500">
            Showing {{ filteredOrders.length }} of {{ orders.length }} order{{ orders.length === 1 ? '' : 's' }}
          </span>
          <span class="font-semibold text-slate-900">
            Total: &#8377; {{ formatMoney(filteredOrders.reduce((sum, o) => sum + Number(o.grand_total), 0)) }}
          </span>
        </div>
      </div>
    </main>
  </div>
</template>
