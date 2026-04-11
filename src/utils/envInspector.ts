/**
 * Complete Environment Variable Inspector
 * Use this to debug what Vite has exposed to the browser
 */

export function inspectEnvironment() {
  const env = import.meta.env as Record<string, string | undefined>

  const allKeys = Object.keys(env).sort()
  const supabaseKeys = allKeys.filter((key) => key.includes('SUPABASE') || key.includes('DATA_PROVIDER'))
  const allNonUndefinedKeys = allKeys.filter((key) => env[key] !== undefined && env[key] !== '')

  const report = {
    timestamp: new Date().toISOString(),
    mode: env.MODE,
    allKeysCount: allKeys.length,
    definedKeysCount: allNonUndefinedKeys.length,
    supabaseKeysCount: supabaseKeys.length,
    supabaseKeys: supabaseKeys.map((key) => ({
      key,
      value: env[key] ? env[key]!.substring(0, 30) + (env[key]!.length > 30 ? '...' : '') : 'undefined',
      isDefined: Boolean(env[key]),
    })),
    allKeys: allNonUndefinedKeys.slice(0, 20), // Show first 20 non-undefined keys
    fullEnvironmentObject: env,
  }

  console.group('🔍 Complete Environment Variable Inspector')
  console.log('Report:', report)
  console.log('Full env object:', env)
  console.groupEnd()

  return report
}

// Auto-run on module load
if (typeof window !== 'undefined' && (window as any).__DEBUG_ENV__) {
  inspectEnvironment()
}
