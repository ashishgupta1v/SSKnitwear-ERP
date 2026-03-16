<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * OrderItem
 *
 * A single row in the order’s size grid.
 * Row subtotal = pieces × rate  (computed in Vue, stored here for the invoice).
 *
 * @property int    $id
 * @property int    $order_id
 * @property string $size      e.g. “32”, “34”, “Custom”
 * @property string $color     Optional colour label
 * @property int    $pieces
 * @property float  $rate      Per-piece fabric rate (INR)
 * @property float  $subtotal  pieces × rate
 */
class OrderItem extends Model
{
    use HasFactory;

    /** Columns that may be set via mass-assignment. */
    protected $fillable = [
        'order_id',
        'size',
        'color',
        'pieces',
        'rate',
        'subtotal',
    ];

    protected $casts = [
        'pieces'   => 'integer',
        'rate'     => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    /** The parent order this item belongs to. */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
