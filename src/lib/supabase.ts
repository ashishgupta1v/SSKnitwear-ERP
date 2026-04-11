import { createClient } from '@supabase/supabase-js'

type EnvMap = Record<string, string | undefined>

const env = import.meta.env as EnvMap

// Log all available environment keys
const allEnvKeys = Object.keys(env)
const supabaseRelatedKeys = allEnvKeys.filter((key) => 
  key.includes('SUPABASE') || 
  key.includes('DATA_PROVIDER') ||
  key.includes('BACKEND')
)

const firstNonEmpty = (...values: Array<string | undefined>) => {
  for (const value of values) {
    const normalized = String(value ?? '').trim()
    if (normalized) {
      return normalized
    }
  }
  return ''
}

const supabaseUrl = firstNonEmpty(
  env.VITE_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_URL,
)

const supabaseAnonKey = firstNonEmpty(
  env.VITE_SUPABASE_ANON_KEY,
  env.VITE_SUPABASE_PUBLISHABLE_KEY,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  env.SUPABASE_ANON_KEY,
)

// Diagnostic info for debugging environment loading
export const supabaseDiagnostics = {
  urlFound: Boolean(supabaseUrl),
  keyFound: Boolean(supabaseAnonKey),
  urlValue: supabaseUrl || 'NOT FOUND',
  keyPrefix: supabaseAnonKey ? supabaseAnonKey.substring(0, 30) + '...' : 'NOT FOUND',
  allEnvKeys: supabaseRelatedKeys,
  checkedUrlVars: [
    { name: 'VITE_SUPABASE_URL', value: env.VITE_SUPABASE_URL ? '✓' : '✗' },
    { name: 'NEXT_PUBLIC_SUPABASE_URL', value: env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗' },
    { name: 'SUPABASE_URL', value: env.SUPABASE_URL ? '✓' : '✗' },
  ],
  checkedKeyVars: [
    { name: 'VITE_SUPABASE_ANON_KEY', value: env.VITE_SUPABASE_ANON_KEY ? '✓' : '✗' },
    { name: 'VITE_SUPABASE_PUBLISHABLE_KEY', value: env.VITE_SUPABASE_PUBLISHABLE_KEY ? '✓' : '✗' },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓' : '✗' },
    { name: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', value: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? '✓' : '✗' },
    { name: 'SUPABASE_ANON_KEY', value: env.SUPABASE_ANON_KEY ? '✓' : '✗' },
  ],
  mode: env.MODE || 'unknown',
  dataProvider: env.VITE_DATA_PROVIDER || 'not set',
}

// Log diagnostics on load
if (!supabaseUrl || !supabaseAnonKey) {
  console.group('⚠️ SUPABASE CONFIGURATION WARNING')
  console.warn('Supabase configuration is incomplete or missing.')
  console.table(supabaseDiagnostics.checkedUrlVars)
  console.table(supabaseDiagnostics.checkedKeyVars)
  console.log('Full Diagnostics:', supabaseDiagnostics)
  console.warn('Environment variables available:', allEnvKeys)
  console.groupEnd()
} else {
  console.group('✅ SUPABASE INITIALIZATION SUCCESS')
  console.log('URL found:', supabaseUrl.substring(0, 40) + '...')
  console.log('Key found: Yes')
  console.groupEnd()
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null
