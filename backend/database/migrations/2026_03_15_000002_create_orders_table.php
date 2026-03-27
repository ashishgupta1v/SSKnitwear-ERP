<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the orders table.
 *
 * One order = one billing estimate for one party.
 * Process flags (is_embroidery, is_batch, is_printing) gate the surcharge:
 *   surcharge = total_pieces × process_rate
 * Grand total is computed in PHP / Vue and stored for fast reporting without
 * recalculating every time an invoice is fetched.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            // FK to parties; deleting a party cascades to its orders
            $table->foreignId('party_id')->constrained('parties')->cascadeOnDelete();

            $table->string('item_name');                             // e.g. "Lower / Track Pant"

            // Process type flags — any active flag enables the process surcharge
            $table->boolean('is_embroidery')->default(false);
            $table->boolean('is_batch')->default(false);
            $table->boolean('is_printing')->default(false);

            $table->decimal('process_rate', 10, 2)->default(0);     // Per-piece rate (INR)
            $table->string('transport_details')->nullable();         // Transport / courier / self pickup
            $table->decimal('gst_percent', 5, 2)->default(5.00);    // Standard knitwear GST is 5%
            $table->decimal('grand_total', 12, 2)->default(0);      // Stored for fast reporting

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
