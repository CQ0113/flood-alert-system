<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ReportController extends Controller
{
    /**
     * Display a listing of reports.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Report::with('latestVerification')
            ->orderBy('created_at', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $reports = $query->get()->map(function ($report) {
            return $this->formatReport($report);
        });

        return response()->json($reports);
    }

    /**
     * Store a newly created report.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'location' => 'required|string|max:255',
            'coordinates' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'type' => 'required|in:water-rising,low-visibility,blocked-road,structural-damage,other',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:10240',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('reports', 'public');
            $validated['image_path'] = $path;
            $validated['image_url'] = Storage::url($path);
        }

        $validated['status'] = 'pending';
        $validated['submitted_by'] = $request->user()?->name ?? 'Anonymous';

        $report = Report::create($validated);

        return response()->json($this->formatReport($report), 201);
    }

    /**
     * Display the specified report.
     */
    public function show(Report $report): JsonResponse
    {
        $report->load('aiVerificationLogs');
        return response()->json($this->formatReport($report));
    }

    /**
     * Update the specified report.
     */
    public function update(Request $request, Report $report): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:pending,verified,rejected',
            'type' => 'sometimes|in:water-rising,low-visibility,blocked-road,structural-damage,other',
            'description' => 'sometimes|nullable|string',
        ]);

        $report->update($validated);

        return response()->json($this->formatReport($report));
    }

    /**
     * Remove the specified report.
     */
    public function destroy(Report $report): JsonResponse
    {
        if ($report->image_path) {
            Storage::disk('public')->delete($report->image_path);
        }

        $report->delete();

        return response()->json(null, 204);
    }

    /**
     * Get nearby reports based on coordinates.
     */
    public function nearby(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'radius_km' => 'nullable|numeric|min:0.1|max:100',
        ]);

        $lat = $validated['latitude'];
        $lng = $validated['longitude'];
        $radius = $validated['radius_km'] ?? 10;

        // Haversine formula for distance calculation
        $reports = Report::selectRaw("
            *,
            (6371 * acos(cos(radians(?)) 
            * cos(radians(latitude)) 
            * cos(radians(longitude) - radians(?)) 
            + sin(radians(?)) 
            * sin(radians(latitude)))) AS distance
        ", [$lat, $lng, $lat])
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->having('distance', '<=', $radius)
            ->orderBy('distance')
            ->get()
            ->map(function ($report) {
                $formatted = $this->formatReport($report);
                $formatted['distance'] = round($report->distance, 2) . ' km';
                return $formatted;
            });

        return response()->json($reports);
    }

    /**
     * Format report for API response.
     */
    private function formatReport(Report $report): array
    {
        $typeLabels = [
            'water-rising' => 'Water Level Rising',
            'low-visibility' => 'Low Visibility',
            'blocked-road' => 'Blocked Road',
            'structural-damage' => 'Structural Damage',
            'other' => 'Other Hazard',
        ];

        return [
            'id' => $report->id,
            'location' => $report->location,
            'coordinates' => $report->coordinates,
            'latitude' => $report->latitude,
            'longitude' => $report->longitude,
            'type' => $report->type,
            'typeLabel' => $typeLabels[$report->type] ?? $report->type,
            'status' => $report->status,
            'description' => $report->description,
            'submittedBy' => $report->submitted_by,
            'imageUrl' => $report->image_url,
            'timestamp' => $report->created_at->diffForHumans(),
            'createdAt' => $report->created_at->toISOString(),
        ];
    }
}
