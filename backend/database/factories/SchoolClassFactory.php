<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SchoolClass>
 */
class SchoolClassFactory extends Factory
{
    public function definition(): array
    {
        $startsAt = $this->faker->dateTimeBetween('-1 month', '+1 month');
        $endsAt = (clone $startsAt)->modify('+4 months');
        $ageMin = $this->faker->numberBetween(4, 14);
        $ageMax = $this->faker->numberBetween($ageMin, 40);
        $studentType = $this->faker->randomElement(['normal', 'competitivo']);
        $beltLevel = $this->faker->randomElement(['Faixa Branca', 'Faixa Azul', 'Faixa Roxa', 'Faixa Marrom', 'Faixa Preta']);
        $category = $this->faker->randomElement(['Gi', 'No-Gi', 'Competicao']);

        return [
            'name' => $this->faker->unique()->words(2, true),
            'description' => $this->faker->sentence(10),
            'teacher_id' => User::query()->inRandomOrder()->value('id'),
            'starts_at' => $startsAt->format('Y-m-d'),
            'ends_at' => $endsAt->format('Y-m-d'),
            'age_min' => $ageMin,
            'age_max' => $ageMax,
            'student_type' => $studentType,
            'belt_level' => $beltLevel,
            'category' => $category,
        ];
    }
}
