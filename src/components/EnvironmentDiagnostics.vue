<template>
  <div class="fixed bottom-4 right-4 z-50 max-w-sm max-h-96 overflow-y-auto">
    <!-- Warning Banner - Only show if not configured -->
    <div v-if="!isConfigured" class="bg-red-50 border-2 border-red-300 rounded-lg p-4 shadow-lg mb-4">
      <div class="flex items-start gap-3">
        <div class="text-red-600 text-xl mt-1">⚠️</div>
        <div class="flex-1">
          <h3 class="font-bold text-red-900 mb-2">Supabase Configuration Issue</h3>
          <div class="text-sm text-red-800 space-y-2">
            <p><strong>Status:</strong> {{ statusMessage }}</p>
            <p v-if="providerDiagnostics.providerMode">
              <strong>Mode:</strong> {{ providerDiagnostics.providerMode }}
            </p>
            <p>
              <strong>Supabase Client:</strong>
              <span class="font-mono text-xs">{{ providerDiagnostics.supabaseClient }}</span>
            </p>

            <div v-if="supabaseDiagnostics.allEnvKeys.length" class="mt-3 pt-3 border-t border-red-200">
              <p class="text-xs font-mono bg-red-100 p-2 rounded">
                <strong>Detected Env Variables:</strong><br />
                {{ supabaseDiagnostics.allEnvKeys.join(', ') || 'None' }}
              </p>
            </div>

            <div class="mt-3 pt-3 border-t border-red-200 text-xs">
              <p class="font-bold mb-1">Fix steps:</p>
              <ol class="list-decimal list-inside space-y-1">
                <li v-if="!supabaseDiagnostics.urlFound">
                  Missing: <code class="bg-red-100 px-1 rounded">VITE_SUPABASE_URL</code>
                </li>
                <li v-if="!supabaseDiagnostics.keyFound">
                  Missing: <code class="bg-red-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code>
                </li>
                <li>Restart dev server: <code class="bg-red-100 px-1 rounded">npm run dev</code></li>
                <li>Open browser console (F12) for detailed logs</li>
              </ol>
            </div>

            <button
              @click="showDetails = !showDetails"
              class="mt-3 text-xs bg-red-200 hover:bg-red-300 text-red-900 px-2 py-1 rounded"
            >
              {{ showDetails ? 'Hide' : 'Show' }} Detailed Logs
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success Banner - Show if configured -->
    <div v-else class="bg-green-50 border-2 border-green-300 rounded-lg p-4 shadow-lg">
      <div class="flex items-start gap-3">
        <div class="text-green-600 text-xl mt-1">✅</div>
        <div class="flex-1">
          <h3 class="font-bold text-green-900">Supabase Configured</h3>
          <p class="text-sm text-green-800 mt-1">Mode: <strong>{{ providerDiagnostics.providerMode }}</strong></p>
          <button
            @click="showDetails = !showDetails"
            class="mt-2 text-xs bg-green-200 hover:bg-green-300 text-green-900 px-2 py-1 rounded"
          >
            {{ showDetails ? 'Hide' : 'Show' }} Details
          </button>
        </div>
      </div>
    </div>

    <!-- Detailed Debug Info -->
    <div v-if="showDetails" class="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs font-mono mt-4 shadow-lg">
      <div class="mb-3">
        <p class="font-bold text-blue-300 mb-1">Supabase Diagnostics:</p>
        <pre class="bg-gray-950 p-2 rounded overflow-auto max-h-40">{{ JSON.stringify(supabaseDiagnostics, null, 2) }}</pre>
      </div>

      <div class="mb-3">
        <p class="font-bold text-blue-300 mb-1">Provider Diagnostics:</p>
        <pre class="bg-gray-950 p-2 rounded overflow-auto max-h-40">{{ JSON.stringify(providerDiagnostics, null, 2) }}</pre>
      </div>

      <div>
        <p class="font-bold text-blue-300 mb-1">Next Steps:</p>
        <ol class="list-decimal list-inside space-y-1 text-yellow-300">
          <li>Check browser console (F12) for additional logs</li>
          <li v-if="!isConfigured">Ensure .env file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</li>
          <li>Restart dev server: npm run dev</li>
          <li>Check: node scripts/check-env.js for environment validation</li>
          <li v-if="!isConfigured">If you've recently modified .env, clear browser cache</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { supabaseDiagnostics } from '../lib/supabase'
import { providerConfigured, providerMode, providerDiagnostics } from '../services/orderDataProvider'
import { inspectEnvironment } from '../utils/envInspector'

const showDetails = ref(false)

const isConfigured = computed(() => providerConfigured)

const statusMessage = computed(() => {
  if (providerMode === 'laravel') {
    return 'Laravel backend mode - Supabase not needed'
  }

  if (supabaseDiagnostics.urlFound && supabaseDiagnostics.keyFound) {
    return 'All variables found, but Supabase client failed to initialize'
  }

  if (!supabaseDiagnostics.urlFound && !supabaseDiagnostics.keyFound) {
    return 'Both Supabase URL and API key missing'
  }

  return supabaseDiagnostics.urlFound ? 'Supabase URL found, but API key missing' : 'Supabase URL missing'
})

// Run environment inspection on mount for detailed debugging
onMounted(() => {
  const envReport = inspectEnvironment()
  console.log('📊 Environment inspection completed. Check console for details.')
  console.table(envReport.supabaseKeys)
})
</script>
