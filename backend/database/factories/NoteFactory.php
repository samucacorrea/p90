<?php

namespace Database\Factories;

use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Note>
 */
class NoteFactory extends Factory
{
    public function definition(): array
    {
        return [
            'student_id' => Student::query()->inRandomOrder()->value('id'),
            'teacher_id' => User::query()->inRandomOrder()->value('id'),
            'class_id' => SchoolClass::query()->inRandomOrder()->value('id'),
            'content' => $this->faker->sentence(12),
        ];
    }
}
