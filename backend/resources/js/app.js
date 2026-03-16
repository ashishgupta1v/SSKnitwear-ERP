/**
 * app.js — Inertia + Vue 3 entry point
 *
 * This file is the single JavaScript entry point for the Laravel Vite pipeline.
 * It mounts the Inertia client-side adapter, resolves page components, and
 * initialises the Vue 3 application instance.
 *
 * Vite automatically code-splits each page component via the eager glob so the
 * browser only downloads the JS it needs for the current page.
 */
import './bootstrap';

import { createInertiaApp } from '@inertiajs/vue3';
import { createApp, h } from 'vue';

createInertiaApp({
    /**
     * Resolve a page name (e.g. "Orders/Index") to its Vue component.
     * `eager: true` loads all pages up-front; swap to `eager: false` for
     * lazy loading when the app grows larger.
     */
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.vue', { eager: true });

        return pages[`./Pages/${name}.vue`];
    },

    /**
     * Mount the Vue app onto the server-rendered Inertia root element.
     * The Inertia plugin is registered here so `useForm`, `usePage`, etc.
     * are available in all page components.
     */
    setup({ el, App, props, plugin }) {
        createApp({ render: () => h(App, props) })
            .use(plugin)
            .mount(el);
    },

    // Top loading bar colour — matches the Singhal Sons teal brand colour.
    progress: {
        color: '#0f766e',
    },
});
