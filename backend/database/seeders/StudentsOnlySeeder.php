<?php

namespace Database\Seeders;

use App\Models\Student;
use Illuminate\Database\Seeder;

class StudentsOnlySeeder extends Seeder
{
    public function run(): void
    {
        Student::factory()->count(30)->create();
    }
}
