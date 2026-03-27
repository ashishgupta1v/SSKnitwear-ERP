<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useTheme } from '../../composables/useTheme'

const router = useRouter()
const { isDark, toggleTheme } = useTheme()

defineProps<{
  savingOrder: boolean
  canSave: boolean
  modeLabel: string
}>()

const emit = defineEmits<{
  (e: 'save'): void
  (e: 'print'): void
  (e: 'new-order'): void
}>()

const goToHistory = () => {
  router.push({ name: 'order-history' })
}
</script>

<template>
  <header class="no-print sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div class="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.25em] text-teal-700">Singhal Sons Knitwear</p>
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-lg font-semibold">Order Entry</h1>
          <span class="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{{ modeLabel }}</span>
        </div>
      </div>
      <div class="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
        <button
          class="inline-flex min-w-[6rem] items-center justify-center rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-teal-500 hover:to-cyan-500"
          @click="emit('new-order')"
        >
          + New Order
        </button>
        <button
          class="inline-flex min-w-[6rem] items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="savingOrder || !canSave"
          @click="emit('save')"
        >
          {{ savingOrder ? 'Saving...' : 'Save Order' }}
        </button>
        <button
          class="inline-flex min-w-[6rem] items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
          @click="emit('print')"
        >
          Print to PDF
        </button>
        <button
          class="inline-flex min-w-[6rem] items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
          @click="goToHistory"
        >
          Order History
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
</template>
