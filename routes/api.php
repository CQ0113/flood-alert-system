<?php

use App\Http\Controllers\Api\AiVerificationLogController;
use App\Http\Controllers\Api\AlertSubscriptionController;
use App\Http\Controllers\Api\DisasterAlertController;
use App\Http\Controllers\Api\N8nAiVerificationWebhookController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ResourceController;
use App\Http\Controllers\Api\WeatherWarningController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Reports
Route::get('/reports', [ReportController::class, 'index']);
Route::post('/reports', [ReportController::class, 'store']);
Route::get('/reports/nearby', [ReportController::class, 'nearby']);
Route::get('/reports/{report}', [ReportController::class, 'show']);
Route::put('/reports/{report}', [ReportController::class, 'update']);
Route::delete('/reports/{report}', [ReportController::class, 'destroy']);

// AI Verification Logs
Route::get('/ai-logs', [AiVerificationLogController::class, 'index']);
Route::get('/ai-logs/{aiVerificationLog}', [AiVerificationLogController::class, 'show']);

// n8n Webhooks
Route::post('/webhooks/n8n/ai-verification', [N8nAiVerificationWebhookController::class, 'store']);

// Resources
Route::get('/resources', [ResourceController::class, 'index']);
Route::post('/resources', [ResourceController::class, 'store']);
Route::get('/resources/{resource}', [ResourceController::class, 'show']);
Route::put('/resources/{resource}', [ResourceController::class, 'update']);
Route::delete('/resources/{resource}', [ResourceController::class, 'destroy']);

// Weather Warnings
Route::get('/weather-warnings', [WeatherWarningController::class, 'index']);
Route::post('/weather-warnings', [WeatherWarningController::class, 'store']);
Route::get('/weather-warnings/{weatherWarning}', [WeatherWarningController::class, 'show']);
Route::put('/weather-warnings/{weatherWarning}', [WeatherWarningController::class, 'update']);
Route::delete('/weather-warnings/{weatherWarning}', [WeatherWarningController::class, 'destroy']);

// Disaster Alerts
Route::get('/disaster-alerts', [DisasterAlertController::class, 'index']);
Route::post('/disaster-alerts', [DisasterAlertController::class, 'store']);
Route::get('/disaster-alerts/{disasterAlert}', [DisasterAlertController::class, 'show']);
Route::put('/disaster-alerts/{disasterAlert}', [DisasterAlertController::class, 'update']);
Route::delete('/disaster-alerts/{disasterAlert}', [DisasterAlertController::class, 'destroy']);

// Alert Subscriptions
Route::post('/subscriptions', [AlertSubscriptionController::class, 'store']);
Route::delete('/subscriptions/{alertSubscription}', [AlertSubscriptionController::class, 'destroy']);
