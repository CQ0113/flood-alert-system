<?php

namespace Database\Seeders;

use App\Models\WeatherWarning;
use Illuminate\Database\Seeder;

class WeatherWarningSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $warnings = [
            [
                'area' => 'Penang Island',
                'severity' => 'high',
                'description' => 'Flash flood warning',
                'source' => 'Malaysian Meteorological Department',
                'is_active' => true,
                'expires_at' => now()->addHours(12),
            ],
            [
                'area' => 'Seberang Perai',
                'severity' => 'medium',
                'description' => 'Heavy thunderstorms expected',
                'source' => 'Malaysian Meteorological Department',
                'is_active' => true,
                'expires_at' => now()->addHours(6),
            ],
        ];

        foreach ($warnings as $warning) {
            WeatherWarning::create($warning);
        }
    }
}
