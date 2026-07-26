<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Attendance::query()->with(['student', 'session']);

        if ($request->filled('class_session_id')) {
            $query->where('class_session_id', $request->integer('class_session_id'));
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->integer('student_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $perPage = min(max($request->integer('per_page', 20), 1), 100);
        $attendances = $query->paginate($perPage);

        return response()->json($attendances);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'class_session_id' => ['required', 'integer', 'exists:class_sessions,id'],
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'status' => ['required', 'in:present,absent,late,excused'],
            'notes' => ['nullable', 'string'],
        ]);

        $attendance = Attendance::create($data);

        return response()->json(['data' => $attendance->load(['student', 'session'])], 201);
    }

    public function show(string $id): JsonResponse
    {
        $attendance = Attendance::query()->with(['student', 'session'])->findOrFail($id);

        return response()->json(['data' => $attendance]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $attendance = Attendance::findOrFail($id);

        $data = $request->validate([
            'class_session_id' => ['sometimes', 'integer', 'exists:class_sessions,id'],
            'student_id' => ['sometimes', 'integer', 'exists:students,id'],
            'status' => ['sometimes', 'in:present,absent,late,excused'],
            'notes' => ['nullable', 'string'],
        ]);

        $attendance->update($data);

        return response()->json(['data' => $attendance->load(['student', 'session'])]);
    }

    public function destroy(string $id): JsonResponse
    {
        $attendance = Attendance::findOrFail($id);
        $attendance->delete();

        return response()->json(['message' => 'Attendance removed.']);
    }
}
