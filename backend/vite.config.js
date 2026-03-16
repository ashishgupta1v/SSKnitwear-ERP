/**
 * vite.config.js — Asset pipeline for the Laravel backend
 *
 * Entry points:
 *  - resources/css/app.css  Global stylesheet (Tailwind CDN is used in the
 *                           Blade layout; this file handles any custom CSS).
 *  - resources/js/app.js   Inertia + Vue 3 bootstrap (see app.js for details).
 *
 * The laravel-vite-plugin handles manifest generation, hot-module replacement
 * in dev (npm run dev), and the @vite() Blade directive for production builds.
 */
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [
        // Enable Vue SFC (.vue) support
        vue(),

        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,   // Live-reload on Blade / PHP file changes during dev
        }),
    ],
});
