<?php

namespace Database\Seeders;

use App\Models\Resource;
use Illuminate\Database\Seeder;

class ResourceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $resources = [
            [
                'type' => 'boat',
                'name' => 'Rescue Boats',
                'quantity' => 5,
                'unit' => 'units',
                'location' => 'George Town Relief Center',
                'coordinates' => '5.4141° N, 100.3288° E',
                'latitude' => 5.4141,
                'longitude' => 100.3288,
                'organization' => 'Malaysian Red Crescent',
                'contact_name' => 'Ahmad Razak',
                'contact_phone' => '+60 12-345-6789',
                'contact_email' => 'ahmad@redcrescent.my',
                'status' => 'available',
                'notes' => '4-person capacity inflatable boats with oars',
            ],
            [
                'type' => 'food',
                'name' => 'Emergency Food Packs',
                'quantity' => 500,
                'unit' => 'packs',
                'location' => 'Bayan Lepas Community Hall',
                'coordinates' => '5.2945° N, 100.2610° E',
                'latitude' => 5.2945,
                'longitude' => 100.2610,
                'organization' => 'Food Bank Penang',
                'contact_name' => 'Siti Aminah',
                'contact_phone' => '+60 14-567-8901',
                'contact_email' => 'siti@foodbankpenang.org',
                'status' => 'available',
                'notes' => 'Ready-to-eat meals, 3-day supply per pack',
            ],
            [
                'type' => 'clothing',
                'name' => 'Dry Clothing Sets',
                'quantity' => 200,
                'unit' => 'sets',
                'location' => 'Air Itam Temple',
                'coordinates' => '5.3980° N, 100.2780° E',
                'latitude' => 5.3980,
                'longitude' => 100.2780,
                'organization' => 'Buddhist Tzu Chi Foundation',
                'contact_name' => 'Lee Mei Yee',
                'contact_phone' => '+60 16-789-0123',
                'contact_email' => 'mei.yee@tzuchi.org.my',
                'status' => 'limited',
                'notes' => 'Mixed sizes, includes underwear and towels',
            ],
            [
                'type' => 'medical',
                'name' => 'First Aid Kits',
                'quantity' => 50,
                'unit' => 'kits',
                'location' => 'Penang General Hospital',
                'coordinates' => '5.4200° N, 100.3150° E',
                'latitude' => 5.4200,
                'longitude' => 100.3150,
                'organization' => 'St. John Ambulance',
                'contact_name' => 'Dr. Raj Kumar',
                'contact_phone' => '+60 17-890-1234',
                'contact_email' => 'raj@stjohn.org.my',
                'status' => 'available',
                'notes' => 'Standard first aid supplies plus medications',
            ],
            [
                'type' => 'water',
                'name' => 'Drinking Water',
                'quantity' => 1000,
                'unit' => 'bottles',
                'location' => 'KOMTAR Distribution Point',
                'coordinates' => '5.4140° N, 100.3290° E',
                'latitude' => 5.4140,
                'longitude' => 100.3290,
                'organization' => 'Spritzer Malaysia',
                'contact_name' => 'Corporate Affairs',
                'contact_phone' => '+60 4-555-0123',
                'contact_email' => 'csr@spritzer.com.my',
                'status' => 'available',
                'notes' => '1.5L bottles, sponsored donation',
            ],
            [
                'type' => 'shelter',
                'name' => 'Emergency Tents',
                'quantity' => 25,
                'unit' => 'units',
                'location' => 'Youth Park Penang',
                'coordinates' => '5.4300° N, 100.3100° E',
                'latitude' => 5.4300,
                'longitude' => 100.3100,
                'organization' => 'Civil Defence Malaysia',
                'contact_name' => 'Encik Mohd Ali',
                'contact_phone' => '+60 18-901-2345',
                'contact_email' => 'ops@civildefence.gov.my',
                'status' => 'reserved',
                'notes' => '10-person capacity family tents',
            ],
            [
                'type' => 'transport',
                'name' => '4x4 Vehicles',
                'quantity' => 8,
                'unit' => 'vehicles',
                'location' => 'Penang City Council Depot',
                'coordinates' => '5.4100° N, 100.3200° E',
                'latitude' => 5.4100,
                'longitude' => 100.3200,
                'organization' => 'Penang Jeep Club',
                'contact_name' => 'James Tan',
                'contact_phone' => '+60 12-234-5678',
                'contact_email' => 'james@penangjeep.com',
                'status' => 'available',
                'notes' => 'Volunteer drivers available 24/7',
            ],
            [
                'type' => 'other',
                'name' => 'Power Generators',
                'quantity' => 10,
                'unit' => 'units',
                'location' => 'Jelutong Fire Station',
                'coordinates' => '5.3890° N, 100.3180° E',
                'latitude' => 5.3890,
                'longitude' => 100.3180,
                'organization' => 'TNB Emergency Response',
                'contact_name' => 'En. Azman',
                'contact_phone' => '+60 19-012-3456',
                'contact_email' => 'emergency@tnb.com.my',
                'status' => 'limited',
                'notes' => '5kW portable generators with fuel',
            ],
        ];

        foreach ($resources as $resource) {
            Resource::create($resource);
        }
    }
}
