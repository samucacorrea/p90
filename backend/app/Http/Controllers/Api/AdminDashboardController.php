<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AdminDashboardController extends Controller
{
    public function show(): JsonResponse
    {
        $today = Carbon::today();
        $startOfMonth = $today->copy()->startOfMonth()->toDateString();
        $endOfMonth = $today->copy()->endOfMonth()->toDateString();

        $activeStudents = (int) DB::table('students')->count();

        $attendanceSummary = DB::table('attendances')
            ->join('class_sessions', 'class_sessions.id', '=', 'attendances.class_session_id')
            ->whereBetween('class_sessions.session_date', [$startOfMonth, $endOfMonth])
            ->selectRaw('SUM(CASE WHEN attendances.status IN ("present","late") THEN 1 ELSE 0 END) AS present_count')
            ->selectRaw('COUNT(*) AS total_count')
            ->first();

        $presentCount = (int) ($attendanceSummary->present_count ?? 0);
        $totalCount = (int) ($attendanceSummary->total_count ?? 0);
        $avgAttendance = $totalCount > 0 ? round(($presentCount / $totalCount) * 100, 1) : 0.0;

        $beltPromotions = 0;
        $revenueGrowth = 0;

        $trendStart = $today->copy()->subDays(6);
        $trendDays = collect(range(0, 6))->map(function (int $offset) use ($trendStart) {
            $date = $trendStart->copy()->addDays($offset)->toDateString();
            return [
                'date' => $date,
                'label' => Carbon::parse($date)->format('D'),
                'count' => 0,
            ];
        });

        $trendCounts = DB::table('attendances')
            ->join('class_sessions', 'class_sessions.id', '=', 'attendances.class_session_id')
            ->whereBetween('class_sessions.session_date', [$trendStart->toDateString(), $today->toDateString()])
            ->whereIn('attendances.status', ['present', 'late'])
            ->selectRaw('class_sessions.session_date as date, COUNT(*) as count')
            ->groupBy('class_sessions.session_date')
            ->pluck('count', 'date');

        $trend = $trendDays->map(function (array $item) use ($trendCounts) {
            $item['count'] = (int) ($trendCounts[$item['date']] ?? 0);
            return $item;
        })->values();

        $recentActivity = DB::table('notes')
            ->leftJoin('students', 'students.id', '=', 'notes.student_id')
            ->orderByDesc('notes.created_at')
            ->limit(4)
            ->get([
                'notes.id',
                'notes.content',
                'notes.created_at',
                'students.name as student_name',
            ])
            ->map(function ($note) {
                return [
                    'id' => (int) $note->id,
                    'title' => $note->student_name ?: 'Atualizacao',
                    'highlight' => str($note->content)->limit(40)->toString(),
                    'time' => Carbon::parse($note->created_at)->diffForHumans(),
                ];
            });

        $upcomingClasses = DB::table('class_sessions')
            ->leftJoin('school_classes', 'school_classes.id', '=', 'class_sessions.class_id')
            ->whereDate('class_sessions.session_date', '>=', $today->toDateString())
            ->orderBy('class_sessions.session_date')
            ->orderBy('class_sessions.started_at')
            ->limit(3)
            ->get([
                'class_sessions.id',
                'class_sessions.title',
                'class_sessions.session_date',
                'class_sessions.started_at',
                'school_classes.name as class_name',
            ])
            ->map(function ($session) {
                return [
                    'id' => (int) $session->id,
                    'title' => $session->title ?: ($session->class_name ?: 'Aula'),
                    'time' => $session->started_at ? substr($session->started_at, 0, 5) : '',
                    'date' => $session->session_date,
                ];
            });

        return response()->json([
            'stats' => [
                'active_students' => $activeStudents,
                'avg_attendance' => $avgAttendance,
                'belt_promotions' => $beltPromotions,
                'revenue_growth' => $revenueGrowth,
            ],
            'trend' => $trend,
            'recent_activity' => $recentActivity,
            'upcoming_classes' => $upcomingClasses,
        ]);
    }
}
