<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

/*
|--------------------------------------------------------------------------
| Check If The Application Is Under Maintenance
|--------------------------------------------------------------------------
| If the application is in maintenance mode, a pre-rendered template will
| be loaded to allow the maintenance message to be shown without spinning
| up a brand new Laravel application on every maintenance mode request.
*/
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

/*
|--------------------------------------------------------------------------
| Register the Composer Autoloader
|--------------------------------------------------------------------------
| Composer generates a class map for all classes in this application
| and the required vendor libraries. PSR-4 autoloading means you no
| longer need to manually require individual files.
*/
require __DIR__.'/../vendor/autoload.php';

/*
|--------------------------------------------------------------------------
| Run The Application
|--------------------------------------------------------------------------
| Bootstrap the application, then hand the request to the kernel to be
| handled and return a response to the browser. This is the front
| controller — all HTTP traffic flows through this single file.
*/
(require_once __DIR__.'/../bootstrap/app.php')
    ->handleRequest(Request::capture());
