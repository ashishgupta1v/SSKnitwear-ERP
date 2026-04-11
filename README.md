# SSKnitwear ERP

Lightweight textile order management and billing system for Singhal Sons Knitwear.

## Workspace structure

- Root app: Phase 1 Vite prototype with Vercel deployment.
- [backend/](backend): Phase 2 full Laravel 11 + Inertia + Vue + Browsershot implementation.

## Phase 1: Lightning Prototype (Vercel + Supabase)

Architecture: Vue 3 + Tailwind (CDN) + Supabase JavaScript client.

### Why this phase exists

- Fastest path to production-like demo with Vercel + Supabase
- Real-time billing calculations directly in the browser
- Direct persistence to Supabase tables (`parties`, `orders`, `order_items`)

### Local setup (root Vite app)

1. Copy `.env.example` to `.env`.
2. Choose provider mode:
	- `VITE_DATA_PROVIDER=supabase` for Phase 1
	- `VITE_DATA_PROVIDER=laravel` for Phase 2 bridge mode
3. Add provider credentials/config:
	- `VITE_SUPABASE_URL`
	- `VITE_SUPABASE_ANON_KEY`
	- `VITE_BACKEND_BASE_URL` when using Laravel mode
4. Install dependencies:
	- `npm install`
5. Start development server:
	- `npm run dev`

### Provider switch behavior

- `supabase`: root app reads/writes directly to Supabase and uses browser `window.print()`.
- `laravel`: root app calls Laravel JSON endpoints for parties/order save and opens Laravel-generated PDF output.
- The UI stays the same in both modes.

### Vercel deployment

1. Push the repo to GitHub.
2. In Vercel, create a new project linked to that GitHub repo.
3. Build settings are auto-detected from `vercel.json`:
	- Build command: `npm run build`
	- Publish directory: `dist`
4. Add environment variables in Vercel Project Settings:
	- `VITE_SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
	- `VITE_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
	- `VITE_DATA_PROVIDER=supabase`
5. Trigger deploy.

### Phase 1 limitation

- PDF generation is browser-native only (`window.print()` → Save as PDF).
- Server-side PDF generation (Spatie/Browsershot) is available in Phase 2 backend.

### When to move to Laravel + VPS (Forge / DigitalOcean / App Service)

Move to Phase 2 backend hosting when you need any of the following:

- server-side PDF generation with Spatie/Browsershot
- secure server-side business rules and validation
- centralized order lifecycle logic in Laravel
- Inertia.js rendering where Laravel handles heavy lifting and Vue remains the UI layer

Recommended stack for that transition:

- Deploy [backend/](backend) to a Forge-managed DigitalOcean VPS
- Keep Vue components through Inertia.js in Laravel
- Let Laravel endpoints generate invoices and run Browsershot with Chrome on the server

## Implemented features in backend

- Supabase/PostgreSQL-ready Laravel migrations for `parties`, `orders`, `order_items`
- Inertia-powered Vue single-page order form
- Searchable party selector + quick-add party flow
- Embroidery / Batch / Printing toggles with process rate surcharge
- Live bill calculations:
  - Row Total = $Pieces \times Rate$
  - Total Pieces = $\sum Pieces$
  - Process Surcharge = $Total\ Pieces \times Process\ Rate$
  - Grand Total = $(Subtotal + Surcharge) \times (1 + GST\%)$
- PDF bill generation through Spatie Browsershot

## Backend quick start

1. Open [backend/.env.example](backend/.env.example) and copy to `.env`.
2. Fill in Supabase PostgreSQL credentials and `FRONTEND_URLS`.
3. Install backend JS packages:
	- `npm --prefix backend install`
4. Run migrations:
	- `php backend/artisan migrate`
5. Start the backend:
	- `php backend/artisan serve`
6. Start Vite for backend assets:
	- `npm --prefix backend run dev`

For deployment guidance, see [DEPLOYMENT_ROADMAP.md](DEPLOYMENT_ROADMAP.md).
