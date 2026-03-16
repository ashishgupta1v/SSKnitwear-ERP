<?php

/*
|--------------------------------------------------------------------------
| Web Routes — SSKnitwear ERP
|--------------------------------------------------------------------------
| All ERP routes are grouped under OrderController.  Authentication and
| authorisation are intentionally omitted for the current internal‐use build;
| add Laravel Breeze / Sanctum guards here before any public deployment.
|
| Route names follow the {resource}.{action} convention so Inertia and
| generated PDF links can reference them by name rather than hard-coded URLs.
*/

use App\Http\Controllers\OrderController;
use Illuminate\Support\Facades\Route;

// ----- Order Management -----

// Show the order form with all parties and valid size list
Route::get('/', [OrderController::class, 'index'])->name('orders.index');

// Persist a new order together with its line items inside a DB transaction
Route::post('/orders', [OrderController::class, 'store'])->name('orders.store');

// ----- Party Management -----

// Quick-add a party from the inline form on the order page
Route::post('/parties', [OrderController::class, 'storeParty'])->name('parties.store');

// ----- PDF Generation -----

// Stream an A4 invoice PDF for the given order using Browsershot + Chrome
Route::get('/orders/{order}/pdf', [OrderController::class, 'generatePdf'])->name('orders.pdf');
