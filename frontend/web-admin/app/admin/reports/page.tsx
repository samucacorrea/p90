"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";

interface OptionItem {
  id: number;
  name: string;
}

interface Report {
  id: number;
  period_start: string | null;
  period_end: string | null;
  content?: string | null;
  student?: { id: number; name: string } | null;
  schoolClass?: { id: number; name: string } | null;
}

interface ApiResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const heatmapDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const heatmapTimes = ["07:00", "12:00", "16:00", "18:00", "20:00"];

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [meta, setMeta] = useState<Omit<ApiResponse<Report>, "data"> | null>(null);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<OptionItem[]>([]);
  const [classes, setClasses] = useState<OptionItem[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [classFilter, setClassFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("last30");
  const [formData, setFormData] = useState({
    student_id: "",
    class_id: "",
    period_start: "",
    period_end: "",
    content: "",
  });

  const loadReports = useCallback(async (page = 1) => {
    setLoading(true);
    const now = new Date();
    const start =
      periodFilter === "last30"
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)
        : null;
    const formatDate = (value: Date) => value.toISOString().slice(0, 10);
    const response = await api.get<ApiResponse<Report>>("/reports", {
      params: {
        page,
        per_page: 8,
        class_id: classFilter ? Number(classFilter) : undefined,
        period_start: start ? formatDate(start) : undefined,
        period_end: start ? formatDate(now) : undefined,
      },
    });
    setReports(response.data.data);
    setMeta({
      current_page: response.data.current_page,
      last_page: response.data.last_page,
      per_page: response.data.per_page,
      total: response.data.total,
    });
    setLoading(false);
  }, [classFilter, periodFilter]);

  const loadOptions = useCallback(async () => {
    const [studentsResponse, classesResponse] = await Promise.all([
      api.get<ApiResponse<OptionItem>>("/students", { params: { per_page: 100 } }),
      api.get<ApiResponse<OptionItem>>("/classes", { params: { per_page: 100 } }),
    ]);
    setStudents(studentsResponse.data.data);
    setClasses(classesResponse.data.data);
  }, []);

  useEffect(() => {
    loadReports();
    loadOptions();
  }, [loadReports, loadOptions]);

  const summaryCards = useMemo(() => {
    return [
      { label: "Total de presenças", value: meta?.total ?? reports.length, delta: "+8,4% vs mês passado" },
      { label: "Média por turma", value: "18,5", delta: "Alunos por aula" },
      { label: "Graduações de faixa", value: "12", delta: "Previsto para o próximo mês" },
    ];
  }, [meta, reports.length]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Relatórios de Presença e Desempenho</h1>
          <p className="text-sm text-slate-500">Análises detalhadas do progresso da academia</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600">
            PDF
          </button>
          <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600">
            CSV
          </button>
          <button className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-red-600/30">
            Filtros
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={periodFilter}
          onChange={(event) => setPeriodFilter(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
        >
          <option value="last30">Últimos 30 dias</option>
          <option value="all">Todo o período</option>
        </select>
        <select
          value={classFilter}
          onChange={(event) => setClassFilter(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
        >
          <option value="">Todas as turmas</option>
          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-600">
          +12% vs ano anterior
        </div>
        <div className="text-xs text-slate-400">Atualizado: Hoje</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Mapa de calor de presença</h2>
              <p className="text-xs text-slate-400">Horários de pico e dias mais populares</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              Menos
              <span className="h-2 w-8 rounded-full bg-slate-100" />
              Mais
            </div>
          </div>

          <div className="mt-6 grid grid-cols-[auto_repeat(7,1fr)] gap-2 text-xs text-slate-400">
            <div />
            {heatmapDays.map((day) => (
              <div key={day} className="text-center">
                {day}
              </div>
            ))}
            {heatmapTimes.map((time, rowIndex) => (
              <div key={time} className="contents">
                <div className="pr-2 text-right text-[10px] text-slate-400">{time}</div>
                {heatmapDays.map((day, colIndex) => {
                  const intensity = (rowIndex + colIndex) % 5;
                  const shades = [
                    "bg-red-50",
                    "bg-red-100",
                    "bg-red-200",
                    "bg-red-300",
                    "bg-red-400",
                  ];
                  return (
                    <div key={`${day}-${time}`} className={`h-7 rounded-lg ${shades[intensity]}`} />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-xs text-slate-400">{card.label}</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</div>
              <div className="mt-1 text-xs text-slate-400">{card.delta}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Ranking de desempenho</h2>
            <button className="text-xs font-semibold text-red-500">Ver todos os alunos</button>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400">
                <tr>
                  <th className="px-4 py-3">Aluno</th>
                  <th className="px-4 py-3">Presença</th>
                  <th className="px-4 py-3">Faixa atual</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.slice(0, 3).map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-slate-700">{item.student?.name ?? "Aluno"}</td>
                    <td className="px-4 py-3 text-slate-500">{Math.max(item.id % 100, 80)}%</td>
                    <td className="px-4 py-3 text-slate-500">Faixa azul</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">
                        Em dia
                      </span>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && !loading && (
                  <tr>
                    <td className="px-4 py-3 text-slate-400" colSpan={4}>
                      Nenhum dado disponível.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Atualizações recentes</h2>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ student_id: "", class_id: "", period_start: "", period_end: "", content: "" });
                setFormError(null);
                setFormOpen(true);
              }}
              className="text-xs font-semibold text-red-500"
            >
              Novo relatório
            </button>
          </div>
          <div className="mt-4 space-y-4 text-sm">
            {loading && <div className="text-xs text-slate-400">Carregando...</div>}
            {!loading && reports.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-400">
                Nenhum relatorio cadastrado.
              </div>
            )}
            {reports.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-100 p-4">
                <div className="text-xs font-semibold text-slate-400">
                  {item.student?.name ?? "Aluno"} · {item.schoolClass?.name ?? "Turma"}
                </div>
                <div className="mt-2 text-sm text-slate-700">{item.content ?? "Relatorio atualizado."}</div>
                <div className="mt-2 text-[10px] text-slate-400">
                  {item.period_start ?? "-"} · {item.period_end ?? "-"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingId ? "Editar relatorio" : "Novo relatorio"}</h2>
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-xl border border-slate-200 px-3 py-1 text-xs text-slate-500"
              >
                Fechar
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <select
                value={formData.student_id}
                onChange={(event) => setFormData((prev) => ({ ...prev, student_id: event.target.value }))}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              >
                <option value="">Aluno</option>
                {students.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select
                value={formData.class_id}
                onChange={(event) => setFormData((prev) => ({ ...prev, class_id: event.target.value }))}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              >
                <option value="">Turma (opcional)</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <input
                value={formData.period_start}
                onChange={(event) => setFormData((prev) => ({ ...prev, period_start: event.target.value }))}
                placeholder="Inicio (YYYY-MM-DD)"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              />
              <input
                value={formData.period_end}
                onChange={(event) => setFormData((prev) => ({ ...prev, period_end: event.target.value }))}
                placeholder="Fim (YYYY-MM-DD)"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              />
              <textarea
                value={formData.content}
                onChange={(event) => setFormData((prev) => ({ ...prev, content: event.target.value }))}
                placeholder="Conteudo"
                className="md:col-span-2 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                rows={3}
              />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={async () => {
                  setFormLoading(true);
                  setFormError(null);
                  try {
                    const payload = {
                      student_id: Number(formData.student_id),
                      class_id: formData.class_id ? Number(formData.class_id) : null,
                      period_start: formData.period_start || null,
                      period_end: formData.period_end || null,
                      content: formData.content,
                    };
                    if (editingId) {
                      await api.patch(`/reports/${editingId}`, payload);
                    } else {
                      await api.post("/reports", payload);
                    }
                    setFormOpen(false);
                    loadReports(meta?.current_page ?? 1);
                  } catch {
                    setFormError("Falha ao salvar relatorio.");
                  } finally {
                    setFormLoading(false);
                  }
                }}
                disabled={formLoading || !formData.student_id || !formData.content}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {formLoading ? "Salvando..." : "Salvar"}
              </button>
              {formError && <span className="text-sm text-red-500">{formError}</span>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
