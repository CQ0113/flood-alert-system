<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlertSubscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'email',
        'telegram_id',
        'method',
        'location',
        'latitude',
        'longitude',
        'radius_km',
        'is_active',
        'alert_types',
        'verified_at',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'radius_km' => 'decimal:2',
        'is_active' => 'boolean',
        'alert_types' => 'array',
        'verified_at' => 'datetime',
    ];

    /**
     * Get the user associated with this subscription.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to get active subscriptions.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by method.
     */
    public function scopeMethod($query, string $method)
    {
        return $query->where('method', $method);
    }

    /**
     * Scope to get verified subscriptions.
     */
    public function scopeVerified($query)
    {
        return $query->whereNotNull('verified_at');
    }

    /**
     * Scope to get subscriptions that include email.
     */
    public function scopeWithEmail($query)
    {
        return $query->whereIn('method', ['email', 'both']);
    }

    /**
     * Scope to get subscriptions that include telegram.
     */
    public function scopeWithTelegram($query)
    {
        return $query->whereIn('method', ['telegram', 'both']);
    }

    /**
     * Check if subscription is verified.
     */
    public function isVerified(): bool
    {
        return $this->verified_at !== null;
    }
}
