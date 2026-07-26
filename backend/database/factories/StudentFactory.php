<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Student>
 */
class StudentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'student_number' => strtoupper($this->faker->bothify('S###??')),
            'birth_date' => $this->faker->dateTimeBetween('-18 years', '-10 years')->format('Y-m-d'),
            'belt_level' => $this->faker->randomElement(['Faixa Branca', 'Faixa Azul', 'Faixa Roxa', 'Faixa Marrom', 'Faixa Preta']),
            'student_type' => $this->faker->randomElement(['normal', 'competitivo']),
            'stripes_count' => $this->faker->numberBetween(0, 4),
            'notes' => $this->faker->sentence(8),
        ];
    }
}
