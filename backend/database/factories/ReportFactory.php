<?php

namespace Database\Factories;

use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Report>
 */
class ReportFactory extends Factory
{
    public function definition(): array
    {
        $start = $this->faker->dateTimeBetween('-2 months', '-1 month');
        $end = (clone $start)->modify('+30 days');

        return [
            'student_id' => Student::query()->inRandomOrder()->value('id'),
            'class_id' => SchoolClass::query()->inRandomOrder()->value('id'),
            'period_start' => $start->format('Y-m-d'),
            'period_end' => $end->format('Y-m-d'),
            'content' => $this->faker->paragraph(3),
        ];
    }
}
