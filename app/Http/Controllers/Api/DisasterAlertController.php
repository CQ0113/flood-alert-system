<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DisasterAlert;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DisasterAlertController extends Controller
{
    /**
     * Display a listing of disaster alerts.
     */
    public function index(Request $request): JsonResponse
    {
        $query = DisasterAlert::orderBy('issued_at', 'desc');

        if ($request->boolean('active_only', true)) {
            $query->active();
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('severity')) {
            $query->where('severity', $request->severity);
        }

        if ($request->has('location')) {
            $query->where('location', 'like', '%' . $request->location . '%');
        }

        $alerts = $query->get()->map(function ($alert) {
            return $this->formatAlert($alert);
        });

        return response()->json($alerts);
    }

    /**
     * Store a newly created disaster alert.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:flood,storm,landslide,haze,heatwave',
            'severity' => 'required|in:critical,high,medium,low',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'location' => 'required|string|max:255',
            'coordinates' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'valid_until' => 'nullable|date',
            'instructions' => 'nullable|array',
            'instructions.*' => 'string',
        ]);

        $validated['issued_at'] = now();
        $validated['is_active'] = true;

        $alert = DisasterAlert::create($validated);

        return response()->json($this->formatAlert($alert), 201);
    }

    /**
     * Display the specified disaster alert.
     */
    public function show(DisasterAlert $disasterAlert): JsonResponse
    {
        return response()->json($this->formatAlert($disasterAlert));
    }

    /**
     * Update the specified disaster alert.
     */
    public function update(Request $request, DisasterAlert $disasterAlert): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'sometimes|in:flood,storm,landslide,haze,heatwave',
            'severity' => 'sometimes|in:critical,high,medium,low',
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'location' => 'sometimes|string|max:255',
            'coordinates' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'is_active' => 'sometimes|boolean',
            'valid_until' => 'nullable|date',
            'instructions' => 'nullable|array',
            'instructions.*' => 'string',
        ]);

        $disasterAlert->update($validated);

        return response()->json($this->formatAlert($disasterAlert));
    }

    /**
     * Remove the specified disaster alert.
     */
    public function destroy(DisasterAlert $disasterAlert): JsonResponse
    {
        $disasterAlert->delete();
        return response()->json(null, 204);
    }

    /**
     * Format alert for API response.
     */
    private function formatAlert(DisasterAlert $alert): array
    {
        return [
            'id' => $alert->id,
            'type' => $alert->type,
            'severity' => $alert->severity,
            'title' => $alert->title,
            'description' => $alert->description,
            'location' => $alert->location,
            'coordinates' => $alert->coordinates,
            'latitude' => $alert->latitude,
            'longitude' => $alert->longitude,
            'issuedAt' => $alert->issued_at->diffForHumans(),
            'validUntil' => $alert->valid_until ? 'Until ' . $alert->valid_until->format('g:i A') . ' ' . $alert->valid_until->format('l') : 'Until further notice',
            'instructions' => $alert->instructions ?? [],
            'isActive' => $alert->is_active,
            'isValid' => $alert->isValid(),
            'createdAt' => $alert->created_at->toISOString(),
        ];
    }
}
