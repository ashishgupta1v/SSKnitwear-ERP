<?php

use App\Http\Controllers\OrderController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Root Vite Prototype to Laravel Bridge
|--------------------------------------------------------------------------
| These endpoints allow the standalone root Vite prototype to switch from
| direct Supabase writes (Phase 1) to Laravel-managed persistence / PDF
| generation (Phase 2) without changing the UI.
*/

Route::get('/parties', [OrderController::class, 'listParties'])->name('api.parties.index');
Route::post('/parties', [OrderController::class, 'storeParty'])->name('api.parties.store');
Route::post('/orders', [OrderController::class, 'store'])->name('api.orders.store');
Route::delete('/orders/{order}', [OrderController::class, 'destroy'])->name('api.orders.destroy');
Route::get('/orders/{order}/pdf', [OrderController::class, 'generatePdf'])->name('api.orders.pdf');
