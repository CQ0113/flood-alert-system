<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiVerificationLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_id',
        'action',
        'confidence',
        'details',
        'model',
        'analysis_data',
    ];

    protected $casts = [
        'confidence' => 'decimal:2',
        'analysis_data' => 'array',
    ];

    /**
     * Get the report this verification log belongs to.
     */
    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    /**
     * Scope to filter by action type.
     */
    public function scopeAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope to get high confidence verifications.
     */
    public function scopeHighConfidence($query, float $threshold = 80.0)
    {
        return $query->where('confidence', '>=', $threshold);
    }
}
