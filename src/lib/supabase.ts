import { createClient } from '@supabase/supabase-js'

type EnvMap = Record<string, string | undefined>

const env = import.meta.env as EnvMap

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

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null
