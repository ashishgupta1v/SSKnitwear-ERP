#!/usr/bin/env node

/**
 * Environment Diagnostic Script
 * Run with: node scripts/check-env.js
 * 
 * This script checks if your .env file is properly configured
 * for Supabase in both local development and Vercel deployment.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

console.log('🔍 Environment Configuration Diagnostic')
console.log('=' .repeat(60))

// 1. Check .env file exists
const envPath = path.join(rootDir, '.env')
const envLocalPath = path.join(rootDir, '.env.local')
const envExamplePath = path.join(rootDir, '.env.example')

console.log('\n📁 File Check:')
console.log(`  .env exists:         ${fs.existsSync(envPath) ? '✓ YES' : '✗ NO'}`)
console.log(`  .env.local exists:   ${fs.existsSync(envLocalPath) ? '✓ YES' : '✗ NO'} (overrides .env)`)
console.log(`  .env.example exists: ${fs.existsSync(envExamplePath) ? '✓ YES' : '✗ NO'}`)

// 2. Read and check .env content
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  const lines = envContent.split('\n').filter((line) => !line.startsWith('#') && line.trim())

  console.log('\n📋 .env Configuration:')
  const hasUrl = lines.some((line) => line.includes('VITE_SUPABASE_URL') ||
    line.includes('NEXT_PUBLIC_SUPABASE_URL') ||
    line.includes('SUPABASE_URL'))
  const hasKey = lines.some((line) => line.includes('VITE_SUPABASE_ANON_KEY') ||
    line.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
    line.includes('SUPABASE_ANON_KEY'))
  const hasProvider = lines.some((line) => line.includes('VITE_DATA_PROVIDER'))

  console.log(`  Supabase URL set:     ${hasUrl ? '✓ YES' : '✗ NO'}`)
  console.log(`  Supabase Key set:     ${hasKey ? '✓ YES' : '✗ NO'}`)
  console.log(`  Data Provider mode:   ${hasProvider ? '✓ YES' : '✗ NO (defaults to supabase)'}`)

  // Show actual variables (with masked values)
  console.log('\n  Variables found:')
  lines.forEach((line) => {
    const [key, value] = line.split('=')
    if (key.trim()) {
      const displayValue = value && value.trim()
        ? value.substring(0, 20) + (value.length > 20 ? '...' : '')
        : '<empty>'
      console.log(`    ${key.trim()}: ${displayValue}`)
    }
  })
}

// 3. Check vite.config.ts
const viteConfigPath = path.join(rootDir, 'vite.config.ts')
if (fs.existsSync(viteConfigPath)) {
  const viteContent = fs.readFileSync(viteConfigPath, 'utf-8')
  const hasEnvPrefix = viteContent.includes('envPrefix')

  console.log('\n⚙️  Vite Configuration:')
  console.log(`  envPrefix configured: ${hasEnvPrefix ? '✓ YES' : '✗ NO'}`)

  if (hasEnvPrefix) {
    const match = viteContent.match(/envPrefix:\s*\[(.*?)\]/)
    if (match) {
      console.log(`  Supported prefixes:   ${match[1].replace(/['"]/g, '')}`)
    }
  }
}

// 4. Check package.json for dev server command
const packageJsonPath = path.join(rootDir, 'package.json')
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
  console.log('\n📦 Scripts:')
  console.log(`  npm run dev:   ${packageJson.scripts?.dev || 'NOT FOUND'}`)
  console.log(`  npm run build: ${packageJson.scripts?.build || 'NOT FOUND'}`)
}

// 5. Recommendations
console.log('\n✅ Recommendations:')
console.log(
  `1. Ensure .env file exists in the workspace root: ${rootDir}`,
)
console.log('2. If .env.local exists, it overrides .env - check both')
console.log(
  '3. Make sure .env has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set',
)
console.log('4. Restart the dev server after editing .env: npm run dev')
console.log('5. For Vercel deployment:')
console.log('   - Set env vars in Vercel Project Settings')
console.log('   - Use VITE_* or NEXT_PUBLIC_* prefixes')
console.log('   - Trigger a rebuild (cannot just restart)')
console.log('6. Check browser console (F12) for detailed diagnostics')

console.log('\n' + '='.repeat(60))
