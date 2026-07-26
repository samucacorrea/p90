<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\ClassSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ClassSessionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ClassSession::query()->with(['schoolClass.teacher', 'schedule'])->withCount('attendances');

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->integer('class_id'));
        }

        if ($request->filled('schedule_id')) {
            $query->where('schedule_id', $request->integer('schedule_id'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('session_date', '>=', $request->date('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('session_date', '<=', $request->date('date_to'));
        }

        if ($request->filled('category')) {
            $category = $request->string('category')->toString();
            $query->whereHas('schoolClass', fn ($sub) => $sub->where('category', $category));
        }

        if ($request->filled('student_type')) {
            $studentType = $request->string('student_type')->toString();
            $query->whereHas('schoolClass', fn ($sub) => $sub->where('student_type', $studentType));
        }

        if ($request->filled('belt_level')) {
            $beltLevel = $request->string('belt_level')->toString();
            $query->whereHas('schoolClass', fn ($sub) => $sub->where('belt_level', $beltLevel));
        }

        if ($request->filled('age')) {
            $age = $request->integer('age');
            $query->whereHas('schoolClass', function ($sub) use ($age): void {
                $sub->where(function ($range) use ($age): void {
                    $range->whereNull('age_min')->orWhere('age_min', '<=', $age);
                })->where(function ($range) use ($age): void {
                    $range->whereNull('age_max')->orWhere('age_max', '>=', $age);
                });
            });
        }

        if ($request->boolean('latest')) {
            $query->orderByDesc('session_date')->orderByDesc('id');
        }

        $perPage = min(max($request->integer('per_page', 20), 1), 100);
        $sessions = $query->paginate($perPage);

        return response()->json($sessions);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'class_id' => ['required', 'integer', 'exists:school_classes,id'],
            'title' => ['nullable', 'string', 'max:120'],
            'schedule_id' => ['nullable', 'integer', 'exists:schedules,id'],
            'session_date' => ['required', 'date'],
            'started_at' => ['nullable', 'date_format:H:i:s'],
            'ended_at' => ['nullable', 'date_format:H:i:s'],
            'mat' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
            'repeat_days' => ['nullable', 'array'],
            'repeat_days.*' => ['string', 'max:10'],
        ]);

        $session = ClassSession::create($data);

        $session->load('schoolClass.students');
        $students = $session->schoolClass?->students;
        if ($students && $students->isNotEmpty()) {
            foreach ($students as $student) {
                Attendance::firstOrCreate(
                    [
                        'class_session_id' => $session->id,
                        'student_id' => $student->id,
                    ],
                    [
                        'status' => 'absent',
                    ]
                );
            }
        }

        return response()->json(['data' => $session->load(['schoolClass', 'schedule'])], 201);
    }

    public function show(string $id): JsonResponse
    {
        $session = ClassSession::query()->with(['schoolClass', 'schedule', 'attendances.student'])->findOrFail($id);

        return response()->json(['data' => $session]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $session = ClassSession::findOrFail($id);

        $data = $request->validate([
            'class_id' => ['sometimes', 'integer', 'exists:school_classes,id'],
            'title' => ['nullable', 'string', 'max:120'],
            'schedule_id' => ['nullable', 'integer', 'exists:schedules,id'],
            'session_date' => ['sometimes', 'date'],
            'started_at' => ['nullable', 'date_format:H:i:s'],
            'ended_at' => ['nullable', 'date_format:H:i:s'],
            'mat' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string'],
            'repeat_days' => ['nullable', 'array'],
            'repeat_days.*' => ['string', 'max:10'],
        ]);

        $session->update($data);

        return response()->json(['data' => $session->load(['schoolClass', 'schedule'])]);
    }

    public function destroy(string $id): JsonResponse
    {
        $session = ClassSession::findOrFail($id);
        $session->delete();

        return response()->json(['message' => 'Class session removed.']);
    }

    public function finish(string $id): JsonResponse
    {
        $session = ClassSession::findOrFail($id);
        $now = Carbon::now()->format('H:i:s');

        $session->update([
            'started_at' => $session->started_at ?? $now,
            'ended_at' => $now,
        ]);

        return response()->json(['data' => $session->load(['schoolClass', 'schedule'])]);
    }

    public function start(string $id): JsonResponse
    {
        $session = ClassSession::query()->with('schoolClass.students')->findOrFail($id);
        $now = Carbon::now()->format('H:i:s');

        $session->update([
            'started_at' => $now,
        ]);

        $students = $session->schoolClass?->students;
        if ($students && $students->isNotEmpty()) {
            foreach ($students as $student) {
                Attendance::firstOrCreate(
                    [
                        'class_session_id' => $session->id,
                        'student_id' => $student->id,
                    ],
                    [
                        'status' => 'absent',
                    ]
                );
            }
        }

        return response()->json(['data' => $session->load(['schoolClass', 'schedule'])]);
    }
}
