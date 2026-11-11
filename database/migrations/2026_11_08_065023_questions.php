<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained('sections')->cascadeOnDelete();
            $table->foreignId('type_id')->constrained('question_types')->restrictOnDelete();
            $table->text('text');
            $table->string('image')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['section_id', 'type_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};
