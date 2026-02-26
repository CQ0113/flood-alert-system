<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('resources', function (Blueprint $table) {
            $table->id();
            $table->enum('type', [
                'boat',
                'food',
                'clothing',
                'medical',
                'water',
                'shelter',
                'transport',
                'other'
            ]);
            $table->string('name');
            $table->integer('quantity')->default(0);
            $table->string('unit');
            $table->string('location');
            $table->string('coordinates')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->string('organization');
            $table->string('contact_name');
            $table->string('contact_phone')->nullable();
            $table->string('contact_email')->nullable();
            $table->enum('status', ['available', 'limited', 'depleted', 'reserved'])->default('available');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index(['type', 'status']);
            $table->index('status');
            $table->index('organization');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('resources');
    }
};
