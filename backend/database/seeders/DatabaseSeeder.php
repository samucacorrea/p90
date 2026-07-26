<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\ClassSession;
use App\Models\Note;
use App\Models\Report;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $teacher = User::firstOrCreate(
            ['email' => 'admin@p90.local'],
            ['name' => 'Admin', 'password' => Hash::make('Admin@123'), 'role' => 'admin']
        );

        User::factory()->count(4)->create(['role' => 'teacher']);

        $students = Student::factory()->count(40)->create();

        $classes = SchoolClass::factory()->count(6)->create([
            'teacher_id' => $teacher->id,
        ]);

        foreach ($classes as $class) {
            $class->students()->sync($students->random(10)->pluck('id')->all());
        }

        $classes->each(function (SchoolClass $class): void {
            Schedule::factory()->count(3)->create(['class_id' => $class->id]);
        });

        $classes->each(function (SchoolClass $class): void {
            $schedules = Schedule::query()->where('class_id', $class->id)->get();

            ClassSession::factory()
                ->count(4)
                ->sequence(fn () => [
                    'class_id' => $class->id,
                    'schedule_id' => $schedules->random()->id,
                ])
                ->create();
        });

        $sessions = ClassSession::query()->with('schoolClass.students')->get();
        foreach ($sessions as $session) {
            $students = $session->schoolClass->students;
            if ($students->isEmpty()) {
                continue;
            }

            $students->random(min(8, $students->count()))->each(function (Student $student) use ($session): void {
                Attendance::firstOrCreate(
                    [
                        'class_session_id' => $session->id,
                        'student_id' => $student->id,
                    ],
                    [
                        'status' => collect(['present', 'absent', 'late', 'excused'])->random(),
                        'notes' => fake()->optional()->sentence(6),
                    ]
                );
            });
        }

        Note::factory()->count(30)->create();
        Report::factory()->count(20)->create();
    }
}
