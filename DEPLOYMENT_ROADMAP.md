# Deployment Roadmap to Netlify & Beyond

## Phase 1: The Lightning Prototype

### Architecture

- Root Vite frontend
- Supabase client-side reads/writes
- Netlify hosting

### Why

- Fastest way to prototype the UI and business math.
- Ideal for instant sharing and rapid bill-entry testing.

### Netlify steps

1. Push the repository to GitHub.
2. In Netlify, import the repo.
3. Set:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables if using Supabase directly:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Limitation

- PDF output should use browser print in this phase.
- Browsershot is not a good fit for static/serverless Netlify hosting.

---

## Phase 2: The Professional VILT Backend

### Architecture

- Laravel 11 backend in [backend/](backend)
- Inertia.js bridge
- Vue 3 order form
- Supabase PostgreSQL database
- Spatie Browsershot for PDF bills

### Hosting options

- Laravel Forge on a DigitalOcean droplet
- DigitalOcean App Platform

### Required server dependencies

- PHP 8.2+
- Composer
- Node.js 20+
- Chrome or Chromium
- Libraries commonly required by Puppeteer / Browsershot on Ubuntu:
  - `libnss3`
  - `libxss1`
  - `libasound2`
  - `libatk-bridge2.0-0`
  - `libgbm1`
  - `fonts-liberation`

### Deployment steps

1. Deploy the `backend/` folder as the Laravel app.
2. Configure `.env` with Supabase Postgres values.
3. Run:
   - `composer install --no-dev --optimize-autoloader`
   - `npm install`
   - `npm run build`
   - `php artisan migrate --force`
4. Ensure the server can execute Chrome/Chromium for Browsershot.

---

## Phase 3: The Print Bridge

### Flow

1. User saves order in the Inertia UI.
2. Laravel persists data into Supabase Postgres.
3. User clicks `Print Bill`.
4. Laravel renders [backend/resources/views/pdf/invoice.blade.php](backend/resources/views/pdf/invoice.blade.php).
5. Browsershot executes `Browsershot::html($html)->format('A4')->pdf()`.
6. PDF opens in a new tab or downloads for printing.

### Result

- Real-time UI for order entry in Ludhiana.
- Server-side PDF that matches the physical bill workflow.
- Clean path from prototype to production.