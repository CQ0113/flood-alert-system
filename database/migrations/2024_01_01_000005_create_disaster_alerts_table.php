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
        Schema::create('disaster_alerts', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['flood', 'storm', 'landslide', 'haze', 'heatwave']);
            $table->enum('severity', ['critical', 'high', 'medium', 'low']);
            $table->string('title');
            $table->text('description');
            $table->string('location');
            $table->string('coordinates')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->timestamp('issued_at');
            $table->timestamp('valid_until')->nullable();
            $table->json('instructions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index(['is_active', 'severity']);
            $table->index(['type', 'is_active']);
            $table->index('location');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('disaster_alerts');
    }
};
