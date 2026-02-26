<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AlertSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AlertSubscriptionController extends Controller
{
    /**
     * Store a newly created subscription.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required_without:telegram_id|nullable|email|max:255',
            'telegram_id' => 'required_without:email|nullable|string|max:255',
            'method' => 'required|in:email,telegram,both',
            'location' => 'nullable|string|max:255',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric',
            'radius_km' => 'nullable|numeric|min:1|max:100',
            'alert_types' => 'nullable|array',
            'alert_types.*' => 'string|in:flood,storm,landslide,haze,heatwave',
        ]);

        $validated['user_id'] = $request->user()?->id;
        $validated['is_active'] = true;

        $subscription = AlertSubscription::create($validated);

        return response()->json([
            'id' => $subscription->id,
            'email' => $subscription->email,
            'telegramId' => $subscription->telegram_id,
            'method' => $subscription->method,
            'location' => $subscription->location,
            'isActive' => $subscription->is_active,
            'message' => 'Subscription created successfully',
        ], 201);
    }

    /**
     * Remove the specified subscription.
     */
    public function destroy(AlertSubscription $alertSubscription): JsonResponse
    {
        $alertSubscription->delete();
        return response()->json(['message' => 'Subscription removed successfully']);
    }
}
