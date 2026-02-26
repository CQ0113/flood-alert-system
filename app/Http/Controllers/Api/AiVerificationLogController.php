<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiVerificationLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiVerificationLogController extends Controller
{
    /**
     * Display a listing of AI verification logs.
     */
    public function index(Request $request): JsonResponse
    {
        $query = AiVerificationLog::with('report')
            ->orderBy('created_at', 'desc');

        if ($request->has('action')) {
            $query->where('action', $request->action);
        }

        if ($request->has('report_id')) {
            $query->where('report_id', $request->report_id);
        }

        $logs = $query->get()->map(function ($log) {
            return $this->formatLog($log);
        });

        return response()->json($logs);
    }

    /**
     * Display the specified AI verification log.
     */
    public function show(AiVerificationLog $aiVerificationLog): JsonResponse
    {
        $aiVerificationLog->load('report');
        return response()->json($this->formatLog($aiVerificationLog));
    }

    /**
     * Format log for API response.
     */
    private function formatLog(AiVerificationLog $log): array
    {
        return [
            'id' => $log->id,
            'reportId' => $log->report_id,
            'action' => $log->action,
            'confidence' => (float) $log->confidence,
            'details' => $log->details,
            'model' => $log->model,
            'analysisData' => $log->analysis_data,
            'timestamp' => $log->created_at->diffForHumans(),
            'createdAt' => $log->created_at->toISOString(),
        ];
    }
}
