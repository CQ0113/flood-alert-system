<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Report extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'location',
        'coordinates',
        'latitude',
        'longitude',
        'type',
        'status',
        'image_path',
        'image_url',
        'description',
        'submitted_by',
    ];

    protected $casts = [
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    /**
     * Get the user who submitted this report.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the AI verification logs for this report.
     */
    public function aiVerificationLogs(): HasMany
    {
        return $this->hasMany(AiVerificationLog::class);
    }

    /**
     * Get the latest AI verification log.
     */
    public function latestVerification()
    {
        return $this->hasOne(AiVerificationLog::class)->latestOfMany();
    }

    /**
     * Scope to filter by status.
     */
    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to filter by type.
     */
    public function scopeType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope to get only pending reports.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope to get only verified reports.
     */
    public function scopeVerified($query)
    {
        return $query->where('status', 'verified');
    }
}
