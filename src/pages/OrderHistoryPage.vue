<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { listOrders, fetchOrder, deleteOrder, providerConfigured } from '../services/orderDataProvider'
import { useTheme } from '../composables/useTheme'
import { formatDateIST, formatDateTimeIST } from '../lib/dateFormatter'
import type { OrderSummary, OrderDetail } from '../types/order'

const router = useRouter()
const { isDark, toggleTheme } = useTheme()
const orders = ref<OrderSummary[]>([])
const loading = ref(false)
const error = ref('')
const success = ref('')
const searchQuery = ref('')

// Expanded order detail
const expandedOrderId = ref<number | null>(null)
const expandedOrder = ref<OrderDetail | null>(null)
const loadingDetail = ref(false)
const deletingOrderId = ref<number | null>(null)
const deleteModalOpen = ref(false)
const orderPendingDelete = ref<OrderSummary | null>(null)

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
  success.value = ''
  try {
    orders.value = await listOrders()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to load orders.'
  } finally {
    loading.value = false
  }
}

const requestDeleteOrder = (order: OrderSummary) => {
  if (deletingOrderId.value) {
    return
  }

  orderPendingDelete.value = order
  deleteModalOpen.value = true
}

const closeDeleteModal = (force = false) => {
  if (deletingOrderId.value && !force) {
    return
  }

  deleteModalOpen.value = false
  // Keep data briefly so leave animation can finish cleanly.
  setTimeout(() => {
    orderPendingDelete.value = null
  }, 180)
}

const handleCloseDeleteModal = () => {
  closeDeleteModal()
}

const removeOrder = async () => {
  const order = orderPendingDelete.value
  if (!order) {
    return
  }

  if (deletingOrderId.value) {
    return
  }

  deletingOrderId.value = order.id
  error.value = ''
  success.value = ''

  try {
    const result = await deleteOrder(order.id)
    orders.value = orders.value.filter((o) => o.id !== order.id)

    if (expandedOrderId.value === order.id) {
      expandedOrderId.value = null
      expandedOrder.value = null
    }

    success.value = result.message
    closeDeleteModal(true)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unable to delete order.'
  } finally {
    deletingOrderId.value = null
  }
}

const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && deleteModalOpen.value) {
    closeDeleteModal()
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

onMounted(() => {
  loadOrders()
  window.addEventListener('keydown', handleEscapeKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscapeKey)
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <!-- Header -->
    <header class="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div class="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">Singhal Sons Knitwear</p>
          <h1 class="text-lg font-semibold">Order History</h1>
        </div>
        <div class="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
          <button
            class="inline-flex min-w-[8.75rem] items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
            @click="goToEntry"
          >
            <svg class="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Back
          </button>
          <button
            class="inline-flex min-w-[8.75rem] items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            @click="loadOrders"
          >
            <svg class="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 12A8 8 0 106.34 17.66" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M20 4V12H12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Refresh
          </button>
          <button
            type="button"
            class="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleTheme"
          >
            <svg
              v-if="isDark"
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 3V5M12 19V21M5.64 5.64L7.05 7.05M16.95 16.95L18.36 18.36M3 12H5M19 12H21M5.64 18.36L7.05 16.95M16.95 7.05L18.36 5.64M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <svg
              v-else
              class="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 12.79C20.8427 14.4922 20.2039 16.1144 19.1589 17.4608C18.114 18.8072 16.706 19.8214 15.1015 20.3839C13.497 20.9464 11.7644 21.0333 10.1121 20.6344C8.45982 20.2356 6.95594 19.3676 5.78177 18.1364C4.6076 16.9053 3.81204 15.3611 3.49197 13.6915C3.1719 12.0219 3.3404 10.2953 3.97779 8.72058C4.61519 7.14586 5.69368 5.7899 7.08482 4.81579C8.47595 3.84169 10.1162 3.29157 11.81 3.23C10.8183 4.57146 10.3402 6.22441 10.4603 7.88855C10.5804 9.55269 11.2912 11.1197 12.465 12.2935C13.6388 13.4673 15.2058 14.1781 16.8699 14.2982C18.5341 14.4183 20.187 13.9402 21.5285 12.9485C21.4724 12.8955 21.4195 12.8426 21.37 12.79H21Z"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
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

      <div v-if="error" class="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {{ error }}
      </div>

      <div v-if="success" class="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        {{ success }}
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div class="text-sm text-slate-500">Loading orders...</div>
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
          <div class="flex items-center gap-2 px-2 py-2 sm:px-3">
            <button
              class="flex flex-1 items-center gap-4 rounded-lg px-2 py-2 text-left transition hover:bg-slate-50"
              @click="toggleDetail(order.id)"
            >
            <!-- Order ID badge -->
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-xs font-bold text-teal-700">
              #{{ order.id }}
            </span>

            <img
              v-if="order.reference_image_data"
              :src="order.reference_image_data"
              :alt="order.reference_image_name || `Reference image for order ${order.id}`"
              class="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover"
            />

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

            <button
              type="button"
              class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="deletingOrderId === order.id"
              title="Delete this order"
              @click="requestDeleteOrder(order)"
            >
              <svg
                class="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M4 7H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <path d="M10 11V17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <path d="M14 11V17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                <path d="M6 7L7 19C7.06 19.62 7.58 20.1 8.2 20.1H15.8C16.42 20.1 16.94 19.62 17 19L18 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M9 7V4.6C9 4.27 9.27 4 9.6 4H14.4C14.73 4 15 4.27 15 4.6V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              {{ deletingOrderId === order.id ? 'Deleting...' : 'Delete' }}
            </button>
          </div>

          <!-- Expanded detail -->
          <div v-if="expandedOrderId === order.id" class="border-t border-slate-100 px-4 py-4">
            <div v-if="loadingDetail" class="py-4 text-center text-sm text-slate-400">Loading details...</div>

            <div v-else-if="expandedOrder" class="space-y-4">
              <div v-if="expandedOrder.reference_image_data" class="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div class="mb-2 flex items-center justify-between gap-3">
                  <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">Reference Image</h3>
                  <span class="text-xs text-slate-400">{{ expandedOrder.reference_image_name || 'Uploaded image' }}</span>
                </div>
                <img
                  :src="expandedOrder.reference_image_data"
                  :alt="expandedOrder.reference_image_name || `Reference image for order ${expandedOrder.id}`"
                  class="max-h-72 w-full rounded-lg object-contain"
                />
              </div>

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

    <Transition name="confirm-modal">
      <div
        v-if="deleteModalOpen && orderPendingDelete"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 px-4"
        @click.self="handleCloseDeleteModal"
      >
        <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div class="mb-4 flex items-start gap-3">
          <div class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M4 7H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              <path d="M10 11V17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              <path d="M14 11V17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              <path d="M6 7L7 19C7.06 19.62 7.58 20.1 8.2 20.1H15.8C16.42 20.1 16.94 19.62 17 19L18 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M9 7V4.6C9 4.27 9.27 4 9.6 4H14.4C14.73 4 15 4.27 15 4.6V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div>
            <h3 class="text-base font-semibold text-slate-900">Delete order permanently?</h3>
            <p class="mt-1 text-sm text-slate-600">
              Order #{{ orderPendingDelete.id }} for
              <span class="font-medium text-slate-800">{{ (orderPendingDelete.party as { name: string } | null)?.name ?? 'Unknown party' }}</span>
              will be removed. This action cannot be undone.
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            class="inline-flex min-w-[5.5rem] items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
            :disabled="Boolean(deletingOrderId)"
            @click="handleCloseDeleteModal"
          >
            Cancel
          </button>
          <button
            type="button"
            class="inline-flex min-w-[5.5rem] items-center justify-center rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="deletingOrderId === orderPendingDelete.id"
            @click="removeOrder"
          >
            {{ deletingOrderId === orderPendingDelete.id ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.confirm-modal-enter-active,
.confirm-modal-leave-active {
  transition: opacity 180ms ease;
}

.confirm-modal-enter-active > div,
.confirm-modal-leave-active > div {
  transition: transform 180ms ease, opacity 180ms ease;
}

.confirm-modal-enter-from,
.confirm-modal-leave-to {
  opacity: 0;
}

.confirm-modal-enter-from > div,
.confirm-modal-leave-to > div {
  transform: translateY(8px) scale(0.98);
  opacity: 0;
}
</style>
