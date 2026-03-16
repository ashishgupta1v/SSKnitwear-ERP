<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Order
 *
 * Represents a single billing estimate for a party.
 * An order contains one or more OrderItems (size-grid rows).
 *
 * Process flags (is_embroidery, is_batch, is_printing) determine whether a
 * per-piece process surcharge is applied on top of the fabric subtotal.
 *
 * Grand total formula:
 *   grandTotal = (subtotal + processSurcharge) × (1 + gst_percent / 100)
 *   where processSurcharge = totalPieces × process_rate
 *
 * @property int         $id
 * @property int         $party_id
 * @property string      $item_name        e.g. “Lower / Track Pant”
 * @property bool        $is_embroidery
 * @property string|null $embroidery_details
 * @property bool        $is_batch
 * @property bool        $is_printing
 * @property float       $process_rate     Rate per piece for any active process
 * @property string|null $transport_details
 * @property float       $gst_percent      Default 5.00
 * @property float       $grand_total
 */
class Order extends Model
{
    use HasFactory;

    /** Columns that may be set via mass-assignment. */
    protected $fillable = [
        'party_id',
        'item_name',
        'is_embroidery',
        'embroidery_details',
        'is_batch',
        'is_printing',
        'process_rate',
        'transport_details',
        'gst_percent',
        'grand_total',
    ];

    /**
     * Automatic type casts.
     * Booleans are stored as TINYINT in MySQL / INTEGER in SQLite.
     * Decimal casts ensure PHP always works with strings of known precision
     * rather than floating-point approximations.
     */
    protected $casts = [
        'is_embroidery' => 'boolean',
        'is_batch'      => 'boolean',
        'is_printing'   => 'boolean',
        'process_rate'  => 'decimal:2',
        'gst_percent'   => 'decimal:2',
        'grand_total'   => 'decimal:2',
    ];

    /** The party this order belongs to. */
    public function party(): BelongsTo
    {
        return $this->belongsTo(Party::class);
    }

    /** Line items (size–colour–pieces rows) for this order. */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
