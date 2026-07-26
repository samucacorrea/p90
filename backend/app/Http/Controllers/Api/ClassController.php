<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SchoolClass::query()->with(['teacher', 'students'])->withCount('students');

        if ($request->filled('q')) {
            $term = '%' . $request->string('q')->toString() . '%';
            $query->where('name', 'like', $term);
        }

        if ($request->filled('teacher_id')) {
            $query->where('teacher_id', $request->integer('teacher_id'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->string('category')->toString());
        }

        if ($request->filled('student_type')) {
            $query->where('student_type', $request->string('student_type')->toString());
        }

        if ($request->filled('belt_level')) {
            $query->where('belt_level', $request->string('belt_level')->toString());
        }

        if ($request->filled('age')) {
            $age = $request->integer('age');
            $query->where(function ($sub) use ($age): void {
                $sub->whereNull('age_min')->orWhere('age_min', '<=', $age);
            })->where(function ($sub) use ($age): void {
                $sub->whereNull('age_max')->orWhere('age_max', '>=', $age);
            });
        }

        if ($request->filled('age_min')) {
            $query->where(function ($sub) use ($request): void {
                $sub->whereNull('age_min')->orWhere('age_min', '<=', $request->integer('age_min'));
            });
        }

        if ($request->filled('age_max')) {
            $query->where(function ($sub) use ($request): void {
                $sub->whereNull('age_max')->orWhere('age_max', '>=', $request->integer('age_max'));
            });
        }

        $perPage = min(max($request->integer('per_page', 20), 1), 100);
        $classes = $query->paginate($perPage);

        return response()->json($classes);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'teacher_id' => ['nullable', 'integer', 'exists:users,id'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
            'age_min' => ['nullable', 'integer', 'min:0'],
            'age_max' => ['nullable', 'integer', 'min:0'],
            'student_type' => ['nullable', 'string', 'max:30'],
            'belt_level' => ['nullable', 'string', 'max:50'],
            'category' => ['nullable', 'string', 'max:50'],
            'student_ids' => ['array'],
            'student_ids.*' => ['integer', 'exists:students,id'],
        ]);

        $studentIds = $data['student_ids'] ?? [];
        unset($data['student_ids']);

        $class = SchoolClass::create($data);

        if (! empty($studentIds)) {
            $class->students()->sync($studentIds);
        }

        return response()->json(['data' => $class->load(['teacher', 'students'])], 201);
    }

    public function show(string $id): JsonResponse
    {
        $class = SchoolClass::query()
            ->with(['teacher', 'students', 'schedules', 'sessions'])
            ->findOrFail($id);

        return response()->json(['data' => $class]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $class = SchoolClass::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'teacher_id' => ['nullable', 'integer', 'exists:users,id'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
            'age_min' => ['nullable', 'integer', 'min:0'],
            'age_max' => ['nullable', 'integer', 'min:0'],
            'student_type' => ['nullable', 'string', 'max:30'],
            'belt_level' => ['nullable', 'string', 'max:50'],
            'category' => ['nullable', 'string', 'max:50'],
            'student_ids' => ['array'],
            'student_ids.*' => ['integer', 'exists:students,id'],
        ]);

        $studentIds = $data['student_ids'] ?? null;
        unset($data['student_ids']);

        $class->update($data);

        if (is_array($studentIds)) {
            $class->students()->sync($studentIds);
        }

        return response()->json(['data' => $class->load(['teacher', 'students'])]);
    }

    public function destroy(string $id): JsonResponse
    {
        $class = SchoolClass::findOrFail($id);
        $class->delete();

        return response()->json(['message' => 'Class removed.']);
    }
}
