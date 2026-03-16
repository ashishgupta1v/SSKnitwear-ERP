<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add is_batch column to the orders table.
 *
 * Batch printing is a third process type alongside embroidery and printing.
 * It was already present in the Vue form as a UI toggle (gating the process
 * surcharge) but was missing from the database, causing the stored order record
 * to be incomplete.  This migration adds the column with a safe default of
 * false so existing rows are unaffected.
 *
 * Run:  php artisan migrate
 * Roll back:  php artisan migrate:rollback --step=1
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Inserted after is_printing to keep all three process flags grouped
            $table->boolean('is_batch')->default(false)->after('is_printing');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('is_batch');
        });
    }
};
