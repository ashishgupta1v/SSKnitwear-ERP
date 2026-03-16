<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

/**
 * HandleInertiaRequests
 *
 * Sits in the web middleware group (registered in bootstrap/app.php) and runs
 * on every browser request.  Its two responsibilities are:
 *
 * 1. Version string — Inertia compares this on each page visit; a mismatch
 *    triggers a hard reload so the client picks up fresh assets after a deploy.
 *
 * 2. Shared data — The array returned by share() is merged into every Inertia
 *    page's props, making values like the app name available everywhere
 *    without passing them explicitly from every controller.
 */
class HandleInertiaRequests extends Middleware
{
    /**
     * The root Blade view that wraps all Inertia pages.
     * Maps to resources/views/app.blade.php.
     */
    protected $rootView = 'app';

    /**
     * Returns the current asset version.
     * When Vite produces a new manifest, this changes and forces a full reload.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Data available to ALL Inertia pages via usePage().props.
     * Keep this lean — only add values every page genuinely needs.
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            // Exposes APP_NAME (.env) to every Vue page as page.props.appName
            'appName' => config('app.name'),
        ]);
    }
}
