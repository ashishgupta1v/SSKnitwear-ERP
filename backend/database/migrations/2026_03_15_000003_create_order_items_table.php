<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the order_items table.
 *
 * Each row represents one size-grid entry in the physical bill book.
 * Row subtotal is stored (pieces × rate) to keep the invoice generation
 * fast and consistent even if rate data changes in the future.
 *
 * Cascade-delete ensures no orphaned items exist when an order is removed.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();

            // FK to orders; deleting an order cascades to its items
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();

            $table->string('size');                               // e.g. "32", "34", "Custom"
            $table->string('color')->nullable();                  // Optional colour label
            $table->unsignedInteger('pieces')->default(0);        // Quantity for this size
            $table->decimal('rate', 10, 2)->default(0);           // Fabric rate per piece (INR)
            $table->decimal('subtotal', 12, 2)->default(0);       // pieces × rate

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
