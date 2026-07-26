<?php

namespace Database\Seeders;

use App\Models\ClassSession;
use App\Models\Schedule;
use App\Models\SchoolClass;
use Illuminate\Database\Seeder;

class SessionsOnlySeeder extends Seeder
{
    public function run(): void
    {
        if (SchoolClass::query()->count() === 0) {
            $this->call(ClassesOnlySeeder::class);
        }

        if (Schedule::query()->count() === 0) {
            Schedule::factory()->count(6)->create();
        }

        ClassSession::factory()->count(12)->create();
    }
}
