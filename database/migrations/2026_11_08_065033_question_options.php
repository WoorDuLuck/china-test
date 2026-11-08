<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained('questions')->cascadeOnDelete();
            $table->text('text')->nullable();
            $table->string('image')->nullable();
            // ordering: эталонная позиция; gap_fill: номер пропуска (1..3)
            $table->unsignedInteger('order_position')->nullable();
            $table->boolean('is_correct')->default(false);
            $table->timestamps();

            $table->index(['question_id', 'order_position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_options');
    }
};
