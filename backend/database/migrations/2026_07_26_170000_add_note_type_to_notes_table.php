<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notes', function (Blueprint $table): void {
            $table->string('note_type', 20)->default('positive')->after('class_id');
            $table->index(['student_id', 'note_type', 'created_at'], 'notes_student_type_created_idx');
        });

        DB::table('notes')
            ->whereNull('note_type')
            ->update(['note_type' => 'positive']);
    }

    public function down(): void
    {
        Schema::table('notes', function (Blueprint $table): void {
            $table->dropIndex('notes_student_type_created_idx');
            $table->dropColumn('note_type');
        });
    }
};
