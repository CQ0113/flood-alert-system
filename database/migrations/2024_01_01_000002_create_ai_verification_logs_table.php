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
        Schema::create('ai_verification_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained()->onDelete('cascade');
            $table->enum('action', ['verified', 'rejected', 'pending_review']);
            $table->decimal('confidence', 5, 2);
            $table->text('details')->nullable();
            $table->string('model')->nullable();
            $table->json('analysis_data')->nullable();
            $table->timestamps();
            
            $table->index(['report_id', 'created_at']);
            $table->index('action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_verification_logs');
    }
};
