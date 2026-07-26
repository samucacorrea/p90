<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('school_classes', function (Blueprint $table): void {
            $table->unsignedSmallInteger('age_min')->nullable()->after('ends_at');
            $table->unsignedSmallInteger('age_max')->nullable()->after('age_min');
            $table->string('student_type', 30)->nullable()->after('age_max');
            $table->string('belt_level', 50)->nullable()->after('student_type');
            $table->string('category', 50)->nullable()->after('belt_level');
        });
    }

    public function down(): void
    {
        Schema::table('school_classes', function (Blueprint $table): void {
            $table->dropColumn(['age_min', 'age_max', 'student_type', 'belt_level', 'category']);
        });
    }
};
