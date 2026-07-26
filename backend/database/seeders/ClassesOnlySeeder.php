<?php

namespace Database\Seeders;

use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;

class ClassesOnlySeeder extends Seeder
{
    public function run(): void
    {
        $teacher = User::query()->where('role', 'teacher')->first();

        if (! $teacher) {
            $teacher = User::factory()->create([
                'role' => 'teacher',
            ]);
        }

        if (Student::query()->count() < 10) {
            Student::factory()->count(20)->create();
        }

        $students = Student::query()->inRandomOrder()->get();

        $classes = SchoolClass::factory()
            ->count(6)
            ->create([
                'teacher_id' => $teacher->id,
            ]);

        foreach ($classes as $class) {
            $class->students()->sync($students->random(min(10, $students->count()))->pluck('id')->all());
            Schedule::factory()->count(3)->create(['class_id' => $class->id]);
        }
    }
}
