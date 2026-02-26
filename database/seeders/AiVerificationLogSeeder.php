<?php

namespace Database\Seeders;

use App\Models\AiVerificationLog;
use Illuminate\Database\Seeder;

class AiVerificationLogSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $logs = [
            [
                'report_id' => 1,
                'action' => 'verified',
                'confidence' => 98.5,
                'details' => 'Image analysis confirmed flooding. Water level estimated at 45cm.',
                'model' => 'FloodVision-v3',
            ],
            [
                'report_id' => 3,
                'action' => 'verified',
                'confidence' => 94.2,
                'details' => 'Road obstruction detected. Multiple vehicles visible in image.',
                'model' => 'HazardDetect-v2',
            ],
            [
                'report_id' => 5,
                'action' => 'rejected',
                'confidence' => 23.1,
                'details' => 'Image quality too low. No hazard patterns detected.',
                'model' => 'FloodVision-v3',
            ],
            [
                'report_id' => 6,
                'action' => 'verified',
                'confidence' => 89.7,
                'details' => 'Haze/fog detected. Visibility estimated below 100m.',
                'model' => 'VisibilityAI-v1',
            ],
            [
                'report_id' => 2,
                'action' => 'pending_review',
                'confidence' => 67.3,
                'details' => 'Uncertain classification. Requires human review.',
                'model' => 'FloodVision-v3',
            ],
            [
                'report_id' => 4,
                'action' => 'pending_review',
                'confidence' => 72.8,
                'details' => 'Potential landslide indicators detected. Confidence moderate.',
                'model' => 'GeoHazard-v1',
            ],
            [
                'report_id' => 8,
                'action' => 'verified',
                'confidence' => 91.4,
                'details' => 'Heavy precipitation confirmed via weather station correlation.',
                'model' => 'WeatherSync-v2',
            ],
            [
                'report_id' => 7,
                'action' => 'pending_review',
                'confidence' => 58.9,
                'details' => 'Image partially obscured. Flood indicators inconclusive.',
                'model' => 'FloodVision-v3',
            ],
        ];

        foreach ($logs as $log) {
            AiVerificationLog::create($log);
        }
    }
}
