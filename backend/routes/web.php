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

// ----- Frontend Guidance -----

// Keep backend root simple so accidental opens do not land on old web flow.
Route::get('/', function () {
	return response(
		'<h2>Use frontend on :5173</h2><p>Open <a href="http://localhost:5173">http://localhost:5173</a> (or your current Vite port).</p>',
		200,
		['Content-Type' => 'text/html; charset=UTF-8']
	);
})->name('backend.root.info');

// ----- Order Management -----

// Persist a new order together with its line items inside a DB transaction
Route::post('/orders', [OrderController::class, 'store'])->name('orders.store');

// ----- Party Management -----

// Quick-add a party from the inline form on the order page
Route::post('/parties', [OrderController::class, 'storeParty'])->name('parties.store');

// ----- PDF Generation -----

// Stream an A4 invoice PDF for the given order using Browsershot + Chrome
Route::get('/orders/{order}/pdf', [OrderController::class, 'generatePdf'])->name('orders.pdf');
