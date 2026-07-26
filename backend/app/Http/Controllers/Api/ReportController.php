<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Support\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    private function resolveMonth(Request $request): Carbon
    {
        $monthParam = $request->string('month')->toString();
        if ($monthParam !== '') {
            return Carbon::createFromFormat('Y-m', $monthParam)->startOfMonth();
        }

        return now()->startOfMonth();
    }

    public function attendanceSummary(Request $request): JsonResponse
    {
        $month = $this->resolveMonth($request);
        $start = $month->copy()->startOfMonth()->toDateString();
        $end = $month->copy()->endOfMonth()->toDateString();

        $classId = $request->integer('class_id') ?: null;
        $beltLevel = $request->string('belt_level')->toString();
        if ($beltLevel === '') {
            $beltLevel = null;
        }

        $baseQuery = DB::table('attendances')
            ->join('class_sessions', 'class_sessions.id', '=', 'attendances.class_session_id')
            ->join('students', 'students.id', '=', 'attendances.student_id')
            ->leftJoin('school_classes', 'school_classes.id', '=', 'class_sessions.class_id')
            ->whereBetween('class_sessions.session_date', [$start, $end]);

        if ($classId) {
            $baseQuery->where('class_sessions.class_id', $classId);
        }

        if ($beltLevel) {
            $baseQuery->where('students.belt_level', $beltLevel);
        }

        $totals = (clone $baseQuery)
            ->selectRaw('SUM(CASE WHEN attendances.status IN ("present","late") THEN 1 ELSE 0 END) AS present_count')
            ->selectRaw('COUNT(*) AS total_count')
            ->first();

        $totalPresent = (int) ($totals->present_count ?? 0);
        $totalCount = (int) ($totals->total_count ?? 0);
        $averagePercent = $totalCount > 0 ? (int) round(($totalPresent / $totalCount) * 100) : 0;

        $totalClasses = (clone $baseQuery)
            ->selectRaw('COUNT(DISTINCT class_sessions.id) AS total_classes')
            ->value('total_classes');

        $students = (clone $baseQuery)
            ->select([
                'students.id',
                'students.name',
                'students.belt_level',
                DB::raw('MIN(school_classes.name) AS class_name'),
            ])
            ->selectRaw('SUM(CASE WHEN attendances.status IN ("present","late") THEN 1 ELSE 0 END) AS present_count')
            ->selectRaw('SUM(CASE WHEN attendances.status IN ("absent","excused") THEN 1 ELSE 0 END) AS absent_count')
            ->selectRaw('COUNT(*) AS total_count')
            ->groupBy('students.id', 'students.name', 'students.belt_level')
            ->orderByDesc(DB::raw('present_count / NULLIF(total_count, 0)'))
            ->get()
            ->map(function ($item) {
                $total = (int) $item->total_count;
                $percent = $total > 0 ? (int) round(((int) $item->present_count / $total) * 100) : 0;

                return [
                    'id' => (int) $item->id,
                    'name' => $item->name,
                    'belt_level' => $item->belt_level,
                    'class_name' => $item->class_name,
                    'present' => (int) $item->present_count,
                    'absent' => (int) $item->absent_count,
                    'percent' => $percent,
                ];
            });

        return response()->json([
            'period' => [
                'month' => $month->format('Y-m'),
                'start' => $start,
                'end' => $end,
            ],
            'summary' => [
                'average_percent' => $averagePercent,
                'total_classes' => (int) ($totalClasses ?? 0),
                'total_students' => $students->count(),
            ],
            'students' => $students,
        ]);
    }

    public function attendanceRanking(Request $request): JsonResponse
    {
        $month = $this->resolveMonth($request);
        $start = $month->copy()->startOfMonth()->toDateString();
        $end = $month->copy()->endOfMonth()->toDateString();

        $classId = $request->integer('class_id') ?: null;
        $beltLevel = $request->string('belt_level')->toString();
        if ($beltLevel === '') {
            $beltLevel = null;
        }

        $limit = min(max($request->integer('limit', 5), 1), 50);

        $baseQuery = DB::table('attendances')
            ->join('class_sessions', 'class_sessions.id', '=', 'attendances.class_session_id')
            ->join('students', 'students.id', '=', 'attendances.student_id')
            ->leftJoin('school_classes', 'school_classes.id', '=', 'class_sessions.class_id')
            ->whereBetween('class_sessions.session_date', [$start, $end]);

        if ($classId) {
            $baseQuery->where('class_sessions.class_id', $classId);
        }

        if ($beltLevel) {
            $baseQuery->where('students.belt_level', $beltLevel);
        }

        $ranking = (clone $baseQuery)
            ->select([
                'students.id',
                'students.name',
                'students.belt_level',
                DB::raw('MIN(school_classes.name) AS class_name'),
            ])
            ->selectRaw('SUM(CASE WHEN attendances.status IN ("present","late") THEN 1 ELSE 0 END) AS present_count')
            ->selectRaw('COUNT(*) AS total_count')
            ->groupBy('students.id', 'students.name', 'students.belt_level')
            ->orderByDesc(DB::raw('present_count / NULLIF(total_count, 0)'))
            ->limit($limit)
            ->get()
            ->map(function ($item, $index) {
                $total = (int) $item->total_count;
                $percent = $total > 0 ? (int) round(((int) $item->present_count / $total) * 100) : 0;

                return [
                    'id' => (int) $item->id,
                    'name' => $item->name,
                    'belt_level' => $item->belt_level,
                    'class_name' => $item->class_name,
                    'percent' => $percent,
                    'rank' => $index + 1,
                ];
            });

        return response()->json([
            'period' => [
                'month' => $month->format('Y-m'),
                'start' => $start,
                'end' => $end,
            ],
            'ranking' => $ranking,
        ]);
    }

    public function availableMonths(Request $request): JsonResponse
    {
        $classId = $request->integer('class_id') ?: null;

        $query = DB::table('class_sessions');
        if ($classId) {
            $query->where('class_id', $classId);
        }

        $months = $query
            ->selectRaw('DATE_FORMAT(session_date, "%Y-%m") AS month')
            ->distinct()
            ->orderByDesc('month')
            ->pluck('month')
            ->values();

        return response()->json([
            'months' => $months,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Report::query()->with(['student', 'schoolClass']);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->integer('student_id'));
        }

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->integer('class_id'));
        }

        if ($request->filled('period_start')) {
            $query->whereDate('period_start', '>=', $request->date('period_start'));
        }

        if ($request->filled('period_end')) {
            $query->whereDate('period_end', '<=', $request->date('period_end'));
        }

        $perPage = min(max($request->integer('per_page', 20), 1), 100);
        $reports = $query->paginate($perPage);

        return response()->json($reports);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'student_id' => ['required', 'integer', 'exists:students,id'],
            'class_id' => ['nullable', 'integer', 'exists:school_classes,id'],
            'period_start' => ['nullable', 'date'],
            'period_end' => ['nullable', 'date'],
            'content' => ['required', 'string'],
        ]);

        $report = Report::create($data);

        return response()->json(['data' => $report->load(['student', 'schoolClass'])], 201);
    }

    public function show(string $id): JsonResponse
    {
        $report = Report::query()->with(['student', 'schoolClass'])->findOrFail($id);

        return response()->json(['data' => $report]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $report = Report::findOrFail($id);

        $data = $request->validate([
            'student_id' => ['sometimes', 'integer', 'exists:students,id'],
            'class_id' => ['nullable', 'integer', 'exists:school_classes,id'],
            'period_start' => ['nullable', 'date'],
            'period_end' => ['nullable', 'date'],
            'content' => ['sometimes', 'string'],
        ]);

        $report->update($data);

        return response()->json(['data' => $report->load(['student', 'schoolClass'])]);
    }

    public function destroy(string $id): JsonResponse
    {
        $report = Report::findOrFail($id);
        $report->delete();

        return response()->json(['message' => 'Report removed.']);
    }
}
