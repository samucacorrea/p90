<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Schedule::query()->with(['schoolClass']);

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->integer('class_id'));
        }

        if ($request->filled('day_of_week')) {
            $query->where('day_of_week', $request->integer('day_of_week'));
        }

        $perPage = min(max($request->integer('per_page', 20), 1), 100);
        $schedules = $query->paginate($perPage);

        return response()->json($schedules);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'class_id' => ['required', 'integer', 'exists:school_classes,id'],
            'day_of_week' => ['required', 'integer', 'between:0,6'],
            'start_time' => ['required', 'date_format:H:i:s'],
            'end_time' => ['required', 'date_format:H:i:s'],
        ]);

        $schedule = Schedule::create($data);

        return response()->json(['data' => $schedule->load('schoolClass')], 201);
    }

    public function show(string $id): JsonResponse
    {
        $schedule = Schedule::query()->with(['schoolClass', 'sessions'])->findOrFail($id);

        return response()->json(['data' => $schedule]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $schedule = Schedule::findOrFail($id);

        $data = $request->validate([
            'class_id' => ['sometimes', 'integer', 'exists:school_classes,id'],
            'day_of_week' => ['sometimes', 'integer', 'between:0,6'],
            'start_time' => ['sometimes', 'date_format:H:i:s'],
            'end_time' => ['sometimes', 'date_format:H:i:s'],
        ]);

        $schedule->update($data);

        return response()->json(['data' => $schedule->load('schoolClass')]);
    }

    public function destroy(string $id): JsonResponse
    {
        $schedule = Schedule::findOrFail($id);
        $schedule->delete();

        return response()->json(['message' => 'Schedule removed.']);
    }
}
