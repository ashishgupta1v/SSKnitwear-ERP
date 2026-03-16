<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

/*
|--------------------------------------------------------------------------
| Create the Application
|--------------------------------------------------------------------------
| Laravel 11 uses a fluent bootstrap style: no Http/Kernel.php, no
| App/Console.php. Routing, middleware, and exception handling are wired
| here through the Application::configure() builder chain.
*/
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',    // Health-check endpoint used by Forge / load-balancers
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Append Inertia middleware to the web group so every browser request
        // gets the shared props (app name, CSRF token, etc.) merged automatically.
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Register custom exception renderers/reporters here when needed.
    })->create();

