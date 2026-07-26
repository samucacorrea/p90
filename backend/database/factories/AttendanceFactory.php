<?php

namespace Database\Factories;

use App\Models\ClassSession;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Attendance>
 */
class AttendanceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'class_session_id' => ClassSession::query()->inRandomOrder()->value('id'),
            'student_id' => Student::query()->inRandomOrder()->value('id'),
            'status' => $this->faker->randomElement(['present', 'absent', 'late', 'excused']),
            'notes' => $this->faker->optional()->sentence(6),
        ];
    }
}
