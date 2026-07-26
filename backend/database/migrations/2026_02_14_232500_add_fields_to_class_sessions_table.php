<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('class_sessions', function (Blueprint $table): void {
            $table->string('mat', 50)->nullable()->after('ended_at');
            $table->text('notes')->nullable()->after('mat');
            $table->json('repeat_days')->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('class_sessions', function (Blueprint $table): void {
            $table->dropColumn(['mat', 'notes', 'repeat_days']);
        });
    }
};
