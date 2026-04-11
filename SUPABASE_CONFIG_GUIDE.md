# Supabase Configuration Troubleshooting Guide

## The Problem

You're seeing: **"Supabase is not configured. Create .env from .env.example."**

This error appears when the app cannot initialize the Supabase client because environment variables are missing or not properly loaded.

---

## Step 1: Verify Local Environment Setup

### 1.1 Check your .env file

Run this command to validate your environment:

```bash
node scripts/check-env.js
```

This will tell you:
- ✓ If `.env` file exists and is in the right location
- ✓ If `VITE_SUPABASE_URL` is set
- ✓ If `VITE_SUPABASE_ANON_KEY` is set
- ✓ If vite.config.ts is properly configured

**Expected output:**
```
✓ Supabase URL set:     YES
✓ Supabase Key set:     YES
✓ envPrefix configured: YES
```

### 1.2 If the script shows missing values

Copy from `.env.example` and add your Supabase credentials:

```bash
# Linux/macOS
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Then edit `.env` and add your Supabase credentials:

```env
VITE_DATA_PROVIDER=supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Find these values in your Supabase dashboard:
1. Go to Supabase Dashboard
2. Select your project
3. Click Settings → API
4. Copy the `Project URL` → paste to `VITE_SUPABASE_URL`
5. Copy the `anon public` key → paste to `VITE_SUPABASE_ANON_KEY`

---

## Step 2: Restart the Development Server

After updating `.env`, restart the dev server:

```bash
# Press Ctrl+C to stop the current server
npm run dev
```

**Critical:** The dev server reads `.env` on startup. Changes to `.env` **require a full restart**.

---

## Step 3: Check Browser Diagnostics

### Open Browser Console

1. Open your app in browser: `http://localhost:5173`
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Look for these diagnostic messages:

**If Supabase is configured (green banner):**
```
✅ Supabase Initialized: { urlFound: true, keyFound: true }
✅ Provider configured: { supabaseClient: 'initialized', providerMode: 'supabase' }
```

**If Supabase is NOT configured (red banner with troubleshooting):**
```
⚠️ Supabase Configuration Missing: { 
  urlFound: false,  // URL was not found
  keyFound: false,  // Key was not found
  allEnvKeys: [ ... ] // Detected environment variables
}
```

### Click "Show Detailed Logs"

In the red/green banner in the bottom-right, click button to expand details:
- **Detected Env Variables:** Shows what Vite loaded (should include VITE_SUPABASE_*)
- **Full Debug Info:** Complete environment dump for deep debugging

---

## Step 4: Verify Supabase Credentials

Make sure you're using the correct credentials:

```bash
# Don't use these (they won't work):
# ❌ NEXT_PUBLIC_SUPABASE_URL (unless you have envPrefix set differently)
# ❌ Raw project name without URL

# Do use these:
# ✓ VITE_SUPABASE_URL=https://xyzabc.supabase.co (with https://)
# ✓ VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs... (the full key)
```

---

## Step 5: For Vercel Deployment

If you're deploying to Vercel and getting this error:

### 5.1 Set Environment Variables in Vercel

1. Go to **Vercel Dashboard**
2. Select your project
3. Click **Settings** → **Environment Variables**
4. Add these variables (use ONE of the naming conventions):

**Option A (Recommended - uses VITE_ prefix):**
```
VITE_SUPABASE_URL = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY = your-anon-key
VITE_DATA_PROVIDER = supabase
```

**Option B (Alternative - uses NEXT_PUBLIC_ prefix):**
```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
VITE_DATA_PROVIDER = supabase
```

### 5.2 Trigger a Rebuild

**Important:** Don't just restart - you must **redeploy/rebuild**:

1. Go to **Deployments**
2. Click the three dots on the latest deployment
3. Select **Redeploy** (triggers a full rebuild)

Or push a new commit to trigger auto-deploy:
```bash
git add .
git commit -m "fix: trigger Vercel rebuild"
git push
```

**Why?** Vite injects environment variables during build time (`npm run build`). A restart won't reload them.

---

## Advanced Troubleshooting

### Check if Vite is exposing the variables

In browser console, run:

```javascript
// Check what Vite loaded
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)

// Should NOT be undefined
```

### Verify vite.config.ts has envPrefix

Check that `vite.config.ts` includes:

```typescript
export default defineConfig({
  plugins: [vue()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'SUPABASE_'],
})
```

If not, add it and restart the dev server.

### Check for .env.local conflicts

If `.env.local` exists, it **overrides** `.env`. Verify:

```bash
# Check for .env.local
ls -la .env*  # Linux/macOS
dir /a .env*  # Windows PowerShell
```

If it exists and is causing issues, delete it:
```bash
rm .env.local  # Linux/macOS
Remove-Item .env.local  # Windows PowerShell
```

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Red "Supabase is not configured" banner | Missing env vars | Run `node scripts/check-env.js` and add vars to .env |
| Constants show "not found" in browser | Dev server didn't reload .env on startup | Restart: `npm run dev` |
| Works locally but fails on Vercel | Vercel env vars not set correctly | Add VITE_* vars to Vercel Settings |
| Vercel still fails after env setup | Vercel didn't rebuild | Click "Redeploy" in Vercel dashboard |
| Browser shows wrong env vars in console | Old build cached | Clear cache: `npm run build` then refresh |

---

## Diagnostic Files Created

Your project now includes:

- **`scripts/check-env.js`** - Environment validation script
- **`src/components/EnvironmentDiagnostics.vue`** - In-app diagnostics banner
- **`src/utils/envInspector.ts`** - Detailed environment inspector
- **`src/lib/supabase.ts`** - Enhanced with logging and diagnostics

These tools will help you diagnose configuration issues immediately.

---

## Need More Help?

1. **Check the diagnostic banner** - Bottom-right corner shows color-coded status
2. **Open browser console (F12)** - Look for detailed logs starting with ✅ or ⚠️
3. **Run the validation script** - `node scripts/check-env.js`
4. **Review browser Network tab** - Check if API calls are being made

---

## Quick Checklist

- [ ] `.env` file exists in workspace root
- [ ] `VITE_SUPABASE_URL` is set to `https://your-project.supabase.co`
- [ ] `VITE_SUPABASE_ANON_KEY` is set to your anon key
- [ ] Dev server restarted after editing `.env`
- [ ] Browser shows green ✅ banner or no banner at all
- [ ] Browser console shows "Supabase Initialized" message
- [ ] (For Vercel) Environment variables set in Vercel Settings
- [ ] (For Vercel) Rebuild triggered, not just restart

---

**If you've completed all steps and still see errors, check the detailed diagnostic logs in the browser console (F12).**
