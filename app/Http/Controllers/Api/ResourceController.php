<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Resource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResourceController extends Controller
{
    /**
     * Display a listing of resources.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Resource::orderBy('updated_at', 'desc');

        if ($request->has('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('organization')) {
            $query->where('organization', 'like', '%' . $request->input('organization') . '%');
        }

        $resources = $query->get()->map(function (Resource $resource) {
            return $this->formatResource($resource);
        });

        return response()->json($resources);
    }

    /**
     * Store a newly created resource.
     */
    public function store(Request $request): JsonResponse
    {
        $request->merge([
            'contact_name' => $request->input('contact_name', $request->input('contactName')),
            'contact_phone' => $request->input('contact_phone', $request->input('contactPhone')),
            'contact_email' => $request->input('contact_email', $request->input('contactEmail')),
        ]);

        $validated = $request->validate([
            'type' => 'required|in:boat,food,clothing,medical,water,shelter,transport,other',
            'name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'location' => 'required|string|max:255',
            'coordinates' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'organization' => 'required|string|max:255',
            'contact_name' => 'required|string|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'contact_email' => 'nullable|email|max:255',
            'status' => 'sometimes|in:available,limited,depleted,reserved',
            'notes' => 'nullable|string',
        ]);

        $validated['status'] = $validated['status'] ?? 'available';

        $resource = Resource::create($validated);

        return response()->json($this->formatResource($resource), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Resource $resource): JsonResponse
    {
        return response()->json($this->formatResource($resource));
    }

    /**
     * Update the specified resource.
     */
    public function update(Request $request, Resource $resource): JsonResponse
    {
        $request->merge([
            'contact_name' => $request->input('contact_name', $request->input('contactName')),
            'contact_phone' => $request->input('contact_phone', $request->input('contactPhone')),
            'contact_email' => $request->input('contact_email', $request->input('contactEmail')),
        ]);

        $validated = $request->validate([
            'type' => 'sometimes|in:boat,food,clothing,medical,water,shelter,transport,other',
            'name' => 'sometimes|string|max:255',
            'quantity' => 'sometimes|integer|min:0',
            'unit' => 'sometimes|string|max:50',
            'location' => 'sometimes|string|max:255',
            'coordinates' => 'nullable|string',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'organization' => 'sometimes|string|max:255',
            'contact_name' => 'sometimes|string|max:255',
            'contact_phone' => 'nullable|string|max:50',
            'contact_email' => 'nullable|email|max:255',
            'status' => 'sometimes|in:available,limited,depleted,reserved',
            'notes' => 'nullable|string',
        ]);

        $resource->update($validated);

        return response()->json($this->formatResource($resource));
    }

    /**
     * Remove the specified resource.
     */
    public function destroy(Resource $resource): JsonResponse
    {
        $resource->delete();
        return response()->json(null, 204);
    }

    /**
     * Format resource for API response.
     */
    private function formatResource(Resource $resource): array
    {
        return [
            'id' => $resource->id,
            'type' => $resource->type,
            'name' => $resource->name,
            'quantity' => $resource->quantity,
            'unit' => $resource->unit,
            'location' => $resource->location,
            'coordinates' => $resource->coordinates,
            'latitude' => $resource->latitude,
            'longitude' => $resource->longitude,
            'organization' => $resource->organization,
            'contactName' => $resource->contact_name,
            'contactPhone' => $resource->contact_phone,
            'contactEmail' => $resource->contact_email,
            'status' => $resource->status,
            'notes' => $resource->notes,
            'timestamp' => $resource->updated_at->diffForHumans(),
            'createdAt' => $resource->created_at->toISOString(),
            'updatedAt' => $resource->updated_at->toISOString(),
        ];
    }
}
