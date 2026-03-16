<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Party
 *
 * Represents a buyer / customer in the SSKnitwear system.
 * A party can have multiple orders over time.
 *
 * @property int         $id
 * @property string      $name
 * @property string|null $city
 * @property string|null $phone
 * @property string|null $gst_no      GST registration number (15-char alphanumeric)
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class Party extends Model
{
    use HasFactory;

    /** Columns that may be set via mass-assignment (e.g. Party::create([...])). */
    protected $fillable = [
        'name',
        'city',
        'phone',
        'gst_no',
    ];

    /**
     * A party can place many orders.
     * Deleting a party will cascade-delete its orders (set in the migration).
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
