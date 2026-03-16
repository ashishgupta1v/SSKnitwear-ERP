<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the parties table.
 *
 * A party is a buyer / customer.  The GST number is optional because some
 * small buyers are unregistered.  Phone is capped at 20 chars to accommodate
 * international formats and extensions (e.g. +91-98765-43210).
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('parties', function (Blueprint $table) {
            $table->id();
            $table->string('name');                    // Business or individual name
            $table->string('city')->nullable();        // City / district for dispatch address
            $table->string('phone', 20)->nullable();   // Contact number
            $table->string('gst_no')->nullable();      // 15-char GSTIN (nullable for unregistered buyers)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parties');
    }
};
