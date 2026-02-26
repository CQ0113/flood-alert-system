<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiVerificationLog;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class N8nAiVerificationWebhookController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $secret = config('services.n8n.webhook_secret');
        $providedToken = (string) $request->header('X-N8N-Token', '');

        if (! empty($secret) && ! hash_equals($secret, $providedToken)) {
            return response()->json([
                'message' => 'Unauthorized webhook token.',
            ], 401);
        }

        $validated = $request->validate([
            'report_id' => 'required|exists:reports,id',
            'action' => 'required|in:verified,rejected,pending_review',
            'confidence' => 'required|numeric|min:0|max:100',
            'details' => 'nullable|string',
            'model' => 'nullable|string|max:255',
            'analysis_data' => 'nullable|array',
            'update_report_status' => 'sometimes|boolean',
        ]);

        $report = Report::findOrFail($validated['report_id']);

        $log = AiVerificationLog::create([
            'report_id' => $report->id,
            'action' => $validated['action'],
            'confidence' => $validated['confidence'],
            'details' => $validated['details'] ?? null,
            'model' => $validated['model'] ?? 'n8n',
            'analysis_data' => $validated['analysis_data'] ?? null,
        ]);

        $shouldUpdateStatus = (bool) ($validated['update_report_status'] ?? true);
        if ($shouldUpdateStatus) {
            $report->status = match ($validated['action']) {
                'verified' => 'verified',
                'rejected' => 'rejected',
                default => 'pending',
            };
            $report->save();
        }

        return response()->json([
            'message' => 'AI verification webhook processed.',
            'data' => [
                'log_id' => $log->id,
                'report_id' => $report->id,
                'action' => $log->action,
                'confidence' => (float) $log->confidence,
                'report_status' => $report->status,
            ],
        ], 201);
    }
}
