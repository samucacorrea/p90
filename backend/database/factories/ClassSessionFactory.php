<?php

namespace Database\Factories;

use App\Models\Schedule;
use App\Models\SchoolClass;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ClassSession>
 */
class ClassSessionFactory extends Factory
{
    public function definition(): array
    {
        $scheduleId = Schedule::query()->inRandomOrder()->value('id');
        $classId = null;

        if ($scheduleId) {
            $classId = Schedule::query()->whereKey($scheduleId)->value('class_id');
        }

        return [
            'class_id' => $classId ?? SchoolClass::query()->inRandomOrder()->value('id'),
            'schedule_id' => $scheduleId,
            'session_date' => $this->faker->dateTimeBetween('-2 weeks', 'now')->format('Y-m-d'),
            'started_at' => $this->faker->time('H:i:s'),
            'ended_at' => $this->faker->time('H:i:s'),
        ];
    }
}
