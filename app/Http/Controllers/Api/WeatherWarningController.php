<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WeatherWarning;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WeatherWarningController extends Controller
{
    /**
     * Display a listing of weather warnings.
     */
    public function index(Request $request): JsonResponse
    {
        $query = WeatherWarning::orderBy('created_at', 'desc');

        if ($request->boolean('active_only', true)) {
            $query->active();
        }

        if ($request->has('severity')) {
            $query->where('severity', $request->severity);
        }

        if ($request->has('area')) {
            $query->where('area', 'like', '%' . $request->area . '%');
        }

        $warnings = $query->get()->map(function ($warning) {
            return $this->formatWarning($warning);
        });

        return response()->json($warnings);
    }

    /**
     * Store a newly created weather warning.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'area' => 'required|string|max:255',
            'severity' => 'required|in:low,medium,high',
            'description' => 'required|string',
            'source' => 'nullable|string|max:255',
            'expires_at' => 'nullable|date',
        ]);

        $validated['is_active'] = true;

        $warning = WeatherWarning::create($validated);

        return response()->json($this->formatWarning($warning), 201);
    }

    /**
     * Display the specified weather warning.
     */
    public function show(WeatherWarning $weatherWarning): JsonResponse
    {
        return response()->json($this->formatWarning($weatherWarning));
    }

    /**
     * Update the specified weather warning.
     */
    public function update(Request $request, WeatherWarning $weatherWarning): JsonResponse
    {
        $validated = $request->validate([
            'area' => 'sometimes|string|max:255',
            'severity' => 'sometimes|in:low,medium,high',
            'description' => 'sometimes|string',
            'source' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
            'expires_at' => 'nullable|date',
        ]);

        $weatherWarning->update($validated);

        return response()->json($this->formatWarning($weatherWarning));
    }

    /**
     * Remove the specified weather warning.
     */
    public function destroy(WeatherWarning $weatherWarning): JsonResponse
    {
        $weatherWarning->delete();
        return response()->json(null, 204);
    }

    /**
     * Format warning for API response.
     */
    private function formatWarning(WeatherWarning $warning): array
    {
        return [
            'id' => $warning->id,
            'area' => $warning->area,
            'severity' => $warning->severity,
            'description' => $warning->description,
            'source' => $warning->source,
            'isActive' => $warning->is_active,
            'expiresAt' => $warning->expires_at?->toISOString(),
            'isExpired' => $warning->isExpired(),
            'timestamp' => $warning->created_at->diffForHumans(),
            'createdAt' => $warning->created_at->toISOString(),
        ];
    }
}
