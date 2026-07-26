"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";

type DashboardTrend = {
  date: string;
  label: string;
  count: number;
};

type DashboardActivity = {
  id: number;
  title: string;
  highlight: string;
  time: string;
};

type DashboardUpcoming = {
  id: number;
  title: string;
  time: string;
  date: string;
};

type DashboardStats = {
  active_students: number;
  avg_attendance: number;
  belt_promotions: number;
  revenue_growth: number;
};

type DashboardResponse = {
  stats: DashboardStats;
  trend: DashboardTrend[];
  recent_activity: DashboardActivity[];
  upcoming_classes: DashboardUpcoming[];
};

const emptyDashboard: DashboardResponse = {
  stats: {
    active_students: 0,
    avg_attendance: 0,
    belt_promotions: 0,
    revenue_growth: 0,
  },
  trend: [],
  recent_activity: [],
  upcoming_classes: [],
};

const formatPercent = (value: number) => `${value.toFixed(1)}%`;
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatShortDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardResponse>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    api
      .get<DashboardResponse>("/admin/dashboard")
      .then((response) => {
        if (!active) return;
        setData(response.data ?? emptyDashboard);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.data?.message ?? "Nao foi possivel carregar o dashboard.");
        setData(emptyDashboard);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const statsData = data.stats;
    return [
      {
        title: "Alunos ativos",
        value: statsData.active_students.toString(),
        delta: "Total",
        tone: statsData.active_students > 0 ? "text-emerald-600" : "text-slate-400",
        badge: "AS",
      },
      {
        title: "Média de presença",
        value: formatPercent(statsData.avg_attendance),
        delta: "Mes atual",
        tone: statsData.avg_attendance > 0 ? "text-emerald-600" : "text-slate-400",
        badge: "AT",
      },
      {
        title: "Promoções de faixa",
        value: statsData.belt_promotions.toString(),
        delta: "Mes atual",
        tone: statsData.belt_promotions > 0 ? "text-emerald-600" : "text-slate-400",
        badge: "BP",
      }
    ];
  }, [data.stats]);

  const trend = data.trend.length
    ? data.trend
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => ({
        date: label,
        label,
        count: 0,
      }));

  const chartPoints = useMemo(() => {
    const max = Math.max(...trend.map((item) => item.count), 1);
    const padding = 6;
    const width = 100;
    const height = 40;
    const plotHeight = height - padding * 2;
    const plotWidth = width - padding * 2;
    return trend
      .map((item, index) => {
        const x = trend.length === 1 ? width / 2 : padding + (index / (trend.length - 1)) * plotWidth;
        const y = padding + (1 - item.count / max) * plotHeight;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [trend]);

  return (
    <div className="space-y-6">
          <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Visão geral</h1>
              <p className="text-sm text-slate-500">Bem-vindo de volta, Professor. Veja o que acontece hoje.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="h-10 w-10 rounded-xl border border-slate-200 bg-white">M</button>
              <button className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-600/30">
                + New Class
              </button>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-600">
                    {stat.badge}
                  </span>
                  <span className={`text-xs font-semibold ${stat.tone}`}>{stat.delta}</span>
                </div>
                <div className="mt-4 text-sm text-slate-500">{stat.title}</div>
                <div className="mt-1 text-2xl font-semibold">{stat.value}</div>
              </div>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Tendência de presença</h2>
                  <p className="text-xs text-slate-500">Participação dos alunos nos últimos 7 dias</p>
                </div>
                <button className="rounded-xl border border-slate-200 px-3 py-1 text-xs text-slate-500">
                  Last 7 days
                </button>
              </div>
              <div className="mt-6 h-56 rounded-2xl bg-gradient-to-b from-red-50 to-white flex items-center justify-center">
                <svg viewBox="0 0 100 40" className="h-40 w-full max-w-2xl">
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#dc2626" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polyline
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="2"
                    points={chartPoints}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polygon
                    fill="url(#trendFill)"
                    points={`${chartPoints} 94,40 6,40`}
                  />
                </svg>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-2 text-xs text-slate-400">
                {trend.map((day) => (
                  <div key={day.date} className="text-center">
                    <div className="text-slate-500">{day.count}</div>
                    <div>{day.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Atividade recente</h2>
                <button className="text-xs font-semibold text-red-500">Ver tudo</button>
              </div>
              <div className="mt-5 space-y-4 text-sm">
                {data.recent_activity.length === 0 && !loading && (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-400">
                    Nenhuma atividade recente encontrada.
                  </div>
                )}
                {data.recent_activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100" />
                    <div>
                      <div className="font-semibold">
                        {item.title} <span className="text-red-500">{item.highlight}</span>
                      </div>
                      <div className="text-xs text-slate-500">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Próximas aulas de hoje</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.upcoming_classes.length === 0 && !loading && (
                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-xs text-slate-400">
                  Nenhuma aula encontrada para hoje.
                </div>
              )}
              {data.upcoming_classes.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-xs font-semibold text-slate-400">AULA</div>
                  <div className="mt-2 text-base font-semibold">{item.title}</div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                    <span>{item.time || "Horario a definir"}</span>
                    <span>{formatShortDate(item.date)}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white">
                      Gerenciar
                    </button>
                    <button className="h-10 w-10 rounded-xl border border-slate-200">+</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-600">
              {error}
            </div>
          )}
    </div>
  );
}
