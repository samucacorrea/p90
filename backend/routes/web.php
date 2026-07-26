<?php

use App\Http\Controllers\InstallController;
use Illuminate\Support\Facades\Route;

Route::get('/', [InstallController::class, 'redirect']);

Route::middleware('not_installed')->group(function () {
    Route::get('/install', [InstallController::class, 'requirements'])->name('install.requirements');
    Route::get('/install/config', [InstallController::class, 'config'])->name('install.config');
    Route::post('/install/run', [InstallController::class, 'run'])->name('install.run');
});

Route::get('/login', function () {
    return response('Login', 200);
})->name('login');
