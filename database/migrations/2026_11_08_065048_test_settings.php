<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('test_settings', function (Blueprint $table) {
            $table->id();
            // [{ "section_id": 1, "count": 2 }, ...]
            $table->json('distribution');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('test_settings');
    }
};
