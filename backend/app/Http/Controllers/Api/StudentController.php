<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class StudentController extends Controller
{
    public function attendanceSummary(Request $request, string $studentId): JsonResponse
    {
        $monthParam = $request->string('month')->toString();
        $month = $monthParam !== ''
            ? Carbon::createFromFormat('Y-m', $monthParam)->startOfMonth()
            : now()->startOfMonth();

        $start = $month->copy()->startOfMonth()->toDateString();
        $end = $month->copy()->endOfMonth()->toDateString();

        $summary = DB::table('attendances')
            ->join('class_sessions', 'class_sessions.id', '=', 'attendances.class_session_id')
            ->where('attendances.student_id', $studentId)
            ->whereBetween('class_sessions.session_date', [$start, $end])
            ->selectRaw('SUM(CASE WHEN attendances.status IN ("present","late") THEN 1 ELSE 0 END) AS present_count')
            ->selectRaw('SUM(CASE WHEN attendances.status IN ("absent","excused") THEN 1 ELSE 0 END) AS absent_count')
            ->selectRaw('COUNT(*) AS total_count')
            ->first();

        $total = (int) ($summary->total_count ?? 0);
        $present = (int) ($summary->present_count ?? 0);
        $absent = (int) ($summary->absent_count ?? 0);
        $percent = $total > 0 ? (int) round(($present / $total) * 100) : 0;

        return response()->json([
            'period' => [
                'month' => $month->format('Y-m'),
                'start' => $start,
                'end' => $end,
            ],
            'summary' => [
                'present' => $present,
                'absent' => $absent,
                'total' => $total,
                'percent' => $percent,
            ],
        ]);
    }

    public function recentTrainings(Request $request, string $studentId): JsonResponse
    {
        $limit = min(max($request->integer('limit', 3), 1), 10);

        $items = DB::table('attendances')
            ->join('class_sessions', 'class_sessions.id', '=', 'attendances.class_session_id')
            ->where('attendances.student_id', $studentId)
            ->whereIn('attendances.status', ['present', 'late'])
            ->orderByDesc('class_sessions.session_date')
            ->orderByDesc('class_sessions.started_at')
            ->limit($limit)
            ->get([
                'attendances.id',
                'attendances.status',
                'class_sessions.title',
                'class_sessions.session_date',
                'class_sessions.started_at',
            ]);

        return response()->json([
            'data' => $items,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Student::query()->with(['classes']);
        $recentCutoff = Carbon::now()->subDays(30)->toDateString();

        if ($request->filled('q')) {
            $term = '%' . $request->string('q')->toString() . '%';
            $query->where(function ($builder) use ($term): void {
                $builder
                    ->where('name', 'like', $term)
                    ->orWhere('email', 'like', $term)
                    ->orWhere('student_number', 'like', $term);
            });
        }

        if ($request->filled('class_id')) {
            $classId = $request->integer('class_id');
            $query->whereHas('classes', function ($builder) use ($classId): void {
                $builder->where('school_classes.id', $classId);
            });
        }

        if ($request->filled('belt_level')) {
            $query->where('belt_level', $request->string('belt_level')->toString());
        }

        if ($request->filled('student_type')) {
            $query->where('student_type', $request->string('student_type')->toString());
        }

        if ($request->filled('status')) {
            $status = strtolower($request->string('status')->toString());
            $attendanceFilter = function ($builder) use ($recentCutoff): void {
                $builder
                    ->join('class_sessions', 'class_sessions.id', '=', 'attendances.class_session_id')
                    ->whereDate('class_sessions.session_date', '>=', $recentCutoff)
                    ->whereIn('attendances.status', ['present', 'late']);
            };

            if ($status === 'active') {
                $query->whereHas('attendances', $attendanceFilter);
            }

            if ($status === 'inactive') {
                $query->whereDoesntHave('attendances', $attendanceFilter);
            }
        }

        if ($request->filled('age_min')) {
            $ageMin = $request->integer('age_min');
            $maxBirthDate = Carbon::now()->subYears($ageMin)->endOfDay();
            $query->whereDate('birth_date', '<=', $maxBirthDate);
        }

        if ($request->filled('age_max')) {
            $ageMax = $request->integer('age_max');
            $minBirthDate = Carbon::now()->subYears($ageMax)->startOfDay();
            $query->whereDate('birth_date', '>=', $minBirthDate);
        }

        $attendanceBase = DB::table('attendances')
            ->join('class_sessions', 'class_sessions.id', '=', 'attendances.class_session_id')
            ->leftJoin('school_classes', 'school_classes.id', '=', 'class_sessions.class_id')
            ->whereColumn('attendances.student_id', 'students.id')
            ->whereIn('attendances.status', ['present', 'late'])
            ->orderByDesc('class_sessions.session_date')
            ->orderByDesc('class_sessions.started_at');

        $query->select('students.*')
            ->selectSub(
                (clone $attendanceBase)->select('class_sessions.session_date')->limit(1),
                'last_attendance_date'
            )
            ->selectSub(
                (clone $attendanceBase)->select('class_sessions.started_at')->limit(1),
                'last_attendance_time'
            )
            ->selectSub(
                (clone $attendanceBase)->select('school_classes.name')->limit(1),
                'last_attendance_class'
            );

        $query->withCount([
            'attendances as recent_attendance_count' => function ($builder) use ($recentCutoff): void {
                $builder
                    ->join('class_sessions', 'class_sessions.id', '=', 'attendances.class_session_id')
                    ->whereDate('class_sessions.session_date', '>=', $recentCutoff)
                    ->whereIn('attendances.status', ['present', 'late']);
            },
        ]);

        $perPage = min(max($request->integer('per_page', 20), 1), 100);
        $students = $query->paginate($perPage);

        $students->getCollection()->transform(function ($student) {
            $student->status = ($student->recent_attendance_count ?? 0) > 0 ? 'active' : 'inactive';
            return $student;
        });

        return response()->json($students);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'unique:students,email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'student_number' => ['nullable', 'string', 'max:50', 'unique:students,student_number'],
            'birth_date' => ['nullable', 'date'],
            'belt_level' => ['nullable', 'string', 'max:50', 'in:Branca,Cinza,Amarela,Laranja,Verde,Azul,Roxa,Marrom,Preta'],
            'student_type' => ['nullable', 'string', 'max:30'],
            'stripes_count' => ['nullable', 'integer', 'min:0', 'max:4'],
            'notes' => ['nullable', 'string'],
            'class_ids' => ['array'],
            'class_ids.*' => ['integer', 'exists:school_classes,id'],
        ]);

        $classIds = $data['class_ids'] ?? [];
        unset($data['class_ids']);

        $student = Student::create($data);

        if (! empty($classIds)) {
            $student->classes()->sync($classIds);
        }

        return response()->json(['data' => $student->load('classes')], 201);
    }

    public function show(string $id): JsonResponse
    {
        $student = Student::query()
            ->with(['classes'])
            ->findOrFail($id);

        return response()->json(['data' => $student]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $student = Student::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255', 'unique:students,email,' . $student->id],
            'phone' => ['nullable', 'string', 'max:50'],
            'student_number' => ['nullable', 'string', 'max:50', 'unique:students,student_number,' . $student->id],
            'birth_date' => ['nullable', 'date'],
            'belt_level' => ['nullable', 'string', 'max:50', 'in:Cinza,Amarela,Laranja,Verde,Azul,Roxa,Marrom,Preta'],
            'student_type' => ['nullable', 'string', 'max:30'],
            'stripes_count' => ['nullable', 'integer', 'min:0', 'max:4'],
            'notes' => ['nullable', 'string'],
            'class_ids' => ['array'],
            'class_ids.*' => ['integer', 'exists:school_classes,id'],
        ]);

        $classIds = $data['class_ids'] ?? null;
        unset($data['class_ids']);

        $student->update($data);

        if (is_array($classIds)) {
            $student->classes()->sync($classIds);
        }

        return response()->json(['data' => $student->load('classes')]);
    }

    public function destroy(string $id): JsonResponse
    {
        $student = Student::findOrFail($id);
        $student->delete();

        return response()->json(['message' => 'Student removed.']);
    }
}
