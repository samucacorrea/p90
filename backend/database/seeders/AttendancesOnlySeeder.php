<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\ClassSession;
use App\Models\Student;
use Illuminate\Database\Seeder;

class AttendancesOnlySeeder extends Seeder
{
    public function run(): void
    {
        if (ClassSession::query()->count() === 0) {
            $this->call(SessionsOnlySeeder::class);
        }

        $sessions = ClassSession::query()
            ->with('schoolClass.students')
            ->limit(8)
            ->get();

        foreach ($sessions as $session) {
            $students = $session->schoolClass?->students;
            if (! $students || $students->isEmpty()) {
                $students = Student::query()->inRandomOrder()->limit(8)->get();
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
    }
}
