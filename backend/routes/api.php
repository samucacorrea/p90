<?php

use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ClassController;
use App\Http\Controllers\Api\ClassSessionController;
use App\Http\Controllers\Api\NoteController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->post('logout', [AuthController::class, 'logout']);
});

Route::middleware('auth:sanctum')->group(function (): void {
    Route::middleware('role:admin')->group(function (): void {
        Route::apiResource('users', UserController::class);
    });

    Route::apiResource('students', StudentController::class);
    Route::apiResource('classes', ClassController::class);
    Route::apiResource('schedules', ScheduleController::class);
    Route::apiResource('class_sessions', ClassSessionController::class);
    Route::post('class_sessions/{id}/finish', [ClassSessionController::class, 'finish']);
    Route::post('class_sessions/{id}/start', [ClassSessionController::class, 'start']);
    Route::apiResource('attendance', AttendanceController::class);
    Route::get('students/{student}/attendance-summary', [StudentController::class, 'attendanceSummary']);
    Route::get('students/{student}/recent-trainings', [StudentController::class, 'recentTrainings']);
    Route::get('admin/dashboard', [AdminDashboardController::class, 'show']);
    Route::apiResource('notes', NoteController::class);
    Route::get('reports/attendance', [ReportController::class, 'attendanceSummary']);
    Route::get('reports/ranking', [ReportController::class, 'attendanceRanking']);
    Route::get('reports/months', [ReportController::class, 'availableMonths']);
    Route::apiResource('reports', ReportController::class);
});
