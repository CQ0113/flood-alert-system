<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Resource extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'name',
        'quantity',
        'unit',
        'location',
        'coordinates',
        'latitude',
        'longitude',
        'organization',
        'contact_name',
        'contact_phone',
        'contact_email',
        'status',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    /**
     * Scope to filter by type.
     */
    public function scopeType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope to filter by status.
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get available resources.
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    /**
     * Scope to get resources by organization.
     */
    public function scopeOrganization($query, string $organization)
    {
        return $query->where('organization', $organization);
    }

    /**
     * Scope to get resources with quantity greater than zero.
     */
    public function scopeInStock($query)
    {
        return $query->where('quantity', '>', 0);
    }
}
