<?php

namespace Database\Factories;

use App\Models\SchoolClass;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Schedule>
 */
class ScheduleFactory extends Factory
{
    public function definition(): array
    {
        $startHour = $this->faker->numberBetween(7, 17);
        $start = sprintf('%02d:00:00', $startHour);
        $end = sprintf('%02d:30:00', min($startHour + 1, 22));

        return [
            'class_id' => SchoolClass::query()->inRandomOrder()->value('id'),
            'day_of_week' => $this->faker->numberBetween(0, 6),
            'start_time' => $start,
            'end_time' => $end,
        ];
    }
}
