<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Note::query()->with(['student', 'teacher', 'schoolClass']);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->integer('student_id'));
        }

        if ($request->filled('teacher_id')) {
            $query->where('teacher_id', $request->integer('teacher_id'));
        }

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->integer('class_id'));
        }

        if ($request->filled('note_type')) {
            $query->where('note_type', $request->string('note_type')->toString());
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->string('date_from')->toString());
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->string('date_to')->toString());
        }

        $query->orderByDesc('created_at');

        $perPage = min(max($request->integer('per_page', 20), 1), 100);
        $notes = $query->paginate($perPage);

        return response()->json($notes);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'teacher_id' => ['nullable', 'integer', 'exists:users,id'],
            'class_id' => ['nullable', 'integer', 'exists:school_classes,id'],
            'note_type' => ['required', 'string', 'in:positive,negative'],
            'content' => ['required', 'string'],
        ]);

        $note = Note::create($data);

        return response()->json(['data' => $note->load(['student', 'teacher', 'schoolClass'])], 201);
    }

    public function show(string $id): JsonResponse
    {
        $note = Note::query()->with(['student', 'teacher', 'schoolClass'])->findOrFail($id);

        return response()->json(['data' => $note]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $note = Note::findOrFail($id);

        $data = $request->validate([
            'student_id' => ['sometimes', 'integer', 'exists:students,id'],
            'teacher_id' => ['nullable', 'integer', 'exists:users,id'],
            'class_id' => ['nullable', 'integer', 'exists:school_classes,id'],
            'note_type' => ['sometimes', 'string', 'in:positive,negative'],
            'content' => ['sometimes', 'string'],
        ]);

        $note->update($data);

        return response()->json(['data' => $note->load(['student', 'teacher', 'schoolClass'])]);
    }

    public function destroy(string $id): JsonResponse
    {
        $note = Note::findOrFail($id);
        $note->delete();

        return response()->json(['message' => 'Note removed.']);
    }
}
