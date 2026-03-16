# SSKnitwear ERP

Lightweight textile order management and billing system for Singhal Sons Knitwear.

## Workspace structure

- Root app: Phase 1 Vite prototype for rapid Netlify deployment.
- [backend/](backend): Phase 2 full Laravel 11 + Inertia + Vue + Browsershot implementation.

## Phase 1: Lightning Prototype (Netlify + Supabase)

Architecture: Vue 3 + Tailwind (CDN) + Supabase JavaScript client.

### Why this phase exists

- Fastest path to production-like demo on Netlify
- Real-time billing calculations directly in the browser
- Direct persistence to Supabase tables (`parties`, `orders`, `order_items`)

### Local setup (root Vite app)

1. Copy `.env.example` to `.env`.
2. Add Supabase credentials:
	- `VITE_SUPABASE_URL`
	- `VITE_SUPABASE_ANON_KEY`
3. Install dependencies:
	- `npm install`
4. Start development server:
	- `npm run dev`

### Netlify deployment

1. Push the repo to GitHub.
2. In Netlify, create a new site from that GitHub repo.
3. Build settings:
	- Build command: `npm run build`
	- Publish directory: `dist`
4. Add environment variables in Netlify Site Settings:
	- `VITE_SUPABASE_URL`
	- `VITE_SUPABASE_ANON_KEY`
5. Trigger deploy.

### Phase 1 limitation

- PDF generation is browser-native only (`window.print()` → Save as PDF).
- Server-side PDF generation (Spatie/Browsershot) is available in Phase 2 backend.

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
2. Fill in Supabase PostgreSQL credentials.
3. Install backend JS packages:
	- `npm --prefix backend install`
4. Run migrations:
	- `php backend/artisan migrate`
5. Start the backend:
	- `php backend/artisan serve`
6. Start Vite for backend assets:
	- `npm --prefix backend run dev`

For deployment guidance, see [DEPLOYMENT_ROADMAP.md](DEPLOYMENT_ROADMAP.md).
