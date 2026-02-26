<?php

namespace Database\Seeders;

use App\Models\Report;
use Illuminate\Database\Seeder;

class ReportSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $reports = [
            [
                'location' => 'George Town',
                'coordinates' => '5.4141° N, 100.3288° E',
                'latitude' => 5.4141,
                'longitude' => 100.3288,
                'type' => 'water-rising',
                'status' => 'verified',
                'submitted_by' => 'Ahmad bin Hassan',
                'description' => 'Flash Flood in George Town area',
            ],
            [
                'location' => 'Bayan Lepas',
                'coordinates' => '5.2945° N, 100.2610° E',
                'latitude' => 5.2945,
                'longitude' => 100.2610,
                'type' => 'other',
                'status' => 'pending',
                'submitted_by' => 'Siti Nurhaliza',
                'description' => 'Heavy Rain in Bayan Lepas',
            ],
            [
                'location' => 'Jalan Macalister',
                'coordinates' => '5.4180° N, 100.3250° E',
                'latitude' => 5.4180,
                'longitude' => 100.3250,
                'type' => 'blocked-road',
                'status' => 'verified',
                'submitted_by' => 'Lee Wei Ming',
                'description' => 'Road Blockage on Jalan Macalister',
            ],
            [
                'location' => 'Air Itam',
                'coordinates' => '5.3980° N, 100.2780° E',
                'latitude' => 5.3980,
                'longitude' => 100.2780,
                'type' => 'structural-damage',
                'status' => 'pending',
                'submitted_by' => 'Raj Kumar',
                'description' => 'Landslide Risk in Air Itam',
            ],
            [
                'location' => 'Gurney Drive',
                'coordinates' => '5.4380° N, 100.3100° E',
                'latitude' => 5.4380,
                'longitude' => 100.3100,
                'type' => 'water-rising',
                'status' => 'rejected',
                'submitted_by' => 'Anonymous',
                'description' => 'Water Level Rising at Gurney Drive',
            ],
            [
                'location' => 'Tanjung Tokong',
                'coordinates' => '5.4520° N, 100.3050° E',
                'latitude' => 5.4520,
                'longitude' => 100.3050,
                'type' => 'low-visibility',
                'status' => 'verified',
                'submitted_by' => 'Chen Mei Ling',
                'description' => 'Low Visibility at Tanjung Tokong',
            ],
            [
                'location' => 'Jelutong',
                'coordinates' => '5.3890° N, 100.3180° E',
                'latitude' => 5.3890,
                'longitude' => 100.3180,
                'type' => 'water-rising',
                'status' => 'pending',
                'submitted_by' => 'Muhammad Faiz',
                'description' => 'Flash Flood in Jelutong',
            ],
            [
                'location' => 'Pulau Tikus',
                'coordinates' => '5.4350° N, 100.3150° E',
                'latitude' => 5.4350,
                'longitude' => 100.3150,
                'type' => 'other',
                'status' => 'verified',
                'submitted_by' => 'Tan Ah Kow',
                'description' => 'Heavy Rain in Pulau Tikus',
            ],
            [
                'location' => 'Jalan Penang',
                'coordinates' => '5.4160° N, 100.3310° E',
                'latitude' => 5.4160,
                'longitude' => 100.3310,
                'type' => 'water-rising',
                'status' => 'verified',
                'submitted_by' => 'Ali Hassan',
                'description' => 'Water Level Rising at Jalan Penang',
            ],
            [
                'location' => 'Lebuh Chulia',
                'coordinates' => '5.4145° N, 100.3395° E',
                'latitude' => 5.4145,
                'longitude' => 100.3395,
                'type' => 'blocked-road',
                'status' => 'pending',
                'submitted_by' => 'David Wong',
                'description' => 'Blocked Road at Lebuh Chulia',
            ],
        ];

        foreach ($reports as $report) {
            Report::create($report);
        }
    }
}
