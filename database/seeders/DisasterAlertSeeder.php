<?php

namespace Database\Seeders;

use App\Models\DisasterAlert;
use Illuminate\Database\Seeder;

class DisasterAlertSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $alerts = [
            [
                'type' => 'flood',
                'severity' => 'critical',
                'title' => 'Flash Flood Warning - George Town',
                'description' => 'Heavy rainfall has caused flash flooding in low-lying areas of George Town. Water levels are rising rapidly in several neighborhoods.',
                'location' => 'George Town, Penang Island',
                'coordinates' => '5.4141° N, 100.3288° E',
                'latitude' => 5.4141,
                'longitude' => 100.3288,
                'issued_at' => now()->subHours(2),
                'valid_until' => now()->addHours(10),
                'instructions' => [
                    'Move to higher ground immediately if in affected areas',
                    'Avoid walking or driving through flood waters',
                    'Keep emergency supplies ready',
                    'Monitor official channels for updates',
                    'Call 999 for emergencies',
                ],
                'is_active' => true,
            ],
            [
                'type' => 'storm',
                'severity' => 'high',
                'title' => 'Severe Thunderstorm Alert',
                'description' => 'A severe thunderstorm system is approaching Penang from the northeast. Expect heavy rain, strong winds, and possible lightning.',
                'location' => 'Penang State',
                'coordinates' => '5.4000° N, 100.3000° E',
                'latitude' => 5.4000,
                'longitude' => 100.3000,
                'issued_at' => now()->subHours(4),
                'valid_until' => now()->addHours(20),
                'instructions' => [
                    'Stay indoors during the storm',
                    'Secure loose outdoor items',
                    'Unplug electrical devices',
                    'Stay away from windows and doors',
                    'Have flashlights and batteries ready',
                ],
                'is_active' => true,
            ],
            [
                'type' => 'landslide',
                'severity' => 'medium',
                'title' => 'Landslide Risk Advisory - Air Itam',
                'description' => 'Due to saturated soil conditions from recent rainfall, landslide risk is elevated in hilly areas of Air Itam and surrounding regions.',
                'location' => 'Air Itam, Penang Hill vicinity',
                'coordinates' => '5.3980° N, 100.2780° E',
                'latitude' => 5.3980,
                'longitude' => 100.2780,
                'issued_at' => now()->subHours(6),
                'valid_until' => null,
                'instructions' => [
                    'Avoid hillside areas during heavy rain',
                    'Watch for signs of ground movement',
                    'Report any cracks or unusual terrain changes',
                    'Have evacuation plan ready',
                ],
                'is_active' => true,
            ],
            [
                'type' => 'haze',
                'severity' => 'low',
                'title' => 'Air Quality Advisory',
                'description' => 'Air quality has deteriorated slightly due to regional haze. API reading is currently at 85 (Moderate).',
                'location' => 'Northern Peninsular Malaysia',
                'coordinates' => '5.4000° N, 100.3000° E',
                'latitude' => 5.4000,
                'longitude' => 100.3000,
                'issued_at' => now()->subHours(12),
                'valid_until' => null,
                'instructions' => [
                    'Sensitive groups should limit outdoor activities',
                    'Keep windows closed when API is high',
                    'Use air purifiers if available',
                    'Wear N95 mask outdoors if sensitive',
                ],
                'is_active' => true,
            ],
        ];

        foreach ($alerts as $alert) {
            DisasterAlert::create($alert);
        }
    }
}
