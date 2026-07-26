"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";

interface Student {
  id: number;
  name: string;
  email: string | null;
  student_number: string | null;
  belt_level?: string | null;
  student_type?: string | null;
  recent_attendance_count?: number | null;
  status?: string | null;
  classes?: { id: number; name: string }[];
  last_attendance_date?: string | null;
  last_attendance_time?: string | null;
  last_attendance_class?: string | null;
}

interface ApiResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const beltOptions = [
  { value: "All Belts", label: "Todas as faixas" },
  { value: "Branca", label: "Branca" },
  { value: "Cinza", label: "Cinza" },
  { value: "Amarela", label: "Amarela" },
  { value: "Laranja", label: "Laranja" },
  { value: "Verde", label: "Verde" },
  { value: "Azul", label: "Azul" },
  { value: "Roxa", label: "Roxa" },
  { value: "Marrom", label: "Marrom" },
  { value: "Preta", label: "Preta" },
];
const statusOptions = [
  { value: "All Status", label: "Todos os status" },
  { value: "Active", label: "Ativo" },
  { value: "Inactive", label: "Inativo" },
];

const formatLastAttendance = (
  dateValue?: string | null,
  timeValue?: string | null,
  className?: string | null
) => {
  if (!dateValue) return "-";
  const dayOnly = new Date(dateValue);
  if (Number.isNaN(dayOnly.getTime())) return "-";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thatDay = new Date(dayOnly.getFullYear(), dayOnly.getMonth(), dayOnly.getDate());
  const diffDays = Math.round((today.getTime() - thatDay.getTime()) / 86400000);
  const label = diffDays === 0 ? "Today" : diffDays === 1 ? "Yesterday" : dayOnly.toLocaleDateString("pt-BR");
  const timeLabel = timeValue ? timeValue.slice(0, 5) : "";
  const classLabel = className ? ` - ${className}` : "";
  return `${label}${timeLabel ? ` ${timeLabel}` : ""}${classLabel}`;
};

export default function StudentsPage() {
  const [query, setQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [meta, setMeta] = useState<Omit<ApiResponse<Student>, "data"> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [beltFilter, setBeltFilter] = useState(beltOptions[0].value);
  const [statusFilter, setStatusFilter] = useState(statusOptions[0].value);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    student_number: "",
    phone: "",
    birth_date: "",
    join_date: "",
    current_belt: "Branca",
    stripes: "0",
    emergency_contact: "",
    emergency_phone: "",
    medications: "",
    injuries: "",
    conditions: [] as string[],
  });

  const conditionOptions = ["Asma", "Diabetes", "Pressão alta", "Condições cardíacas"];
  const beltColors: Record<string, string> = {
    Branca: "from-white to-slate-200",
    Cinza: "from-slate-300 to-slate-500",
    Amarela: "from-yellow-300 to-yellow-500",
    Laranja: "from-orange-400 to-orange-600",
    Verde: "from-emerald-400 to-emerald-600",
    Azul: "from-blue-500 to-blue-700",
    Roxa: "from-purple-500 to-purple-700",
    Marrom: "from-amber-700 to-amber-900",
    Preta: "from-slate-900 to-black",
  };

  const loadStudents = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError(null);
        const beltLevel = beltFilter === "All Belts" ? undefined : beltFilter;
        const status = statusFilter === "All Status" ? undefined : statusFilter.toLowerCase();
        const response = await api.get<ApiResponse<Student>>("/students", {
          params: {
            q: query || undefined,
            page,
            per_page: 10,
            belt_level: beltLevel,
            status,
          },
        });
        setStudents(response.data.data);
        setMeta({
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          per_page: response.data.per_page,
          total: response.data.total,
        });
      } catch {
        setError("Falha ao carregar alunos.");
      } finally {
        setLoading(false);
      }
    },
    [beltFilter, query, statusFilter]
  );

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const displayedStudents = useMemo(() => {
    return students.map((student) => ({
      ...student,
    belt: student.belt_level ? `${student.belt_level}` : "Cinza",
      lastAttendance: formatLastAttendance(
        student.last_attendance_date,
        student.last_attendance_time,
        student.last_attendance_class
      ),
      group: student.classes?.[0]?.name ?? "Sem turma",
      status: (student.status ?? "").toLowerCase() === "inactive" ? "Inativo" : "Ativo",
    }));
  }, [students]);

  useEffect(() => {
    setSelectedIds([]);
  }, [students]);

  const toggleSelected = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    const ids = displayedStudents.map((student) => student.id);
    setSelectedIds((prev) => (prev.length === ids.length ? [] : ids));
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gestão de Alunos</h1>
          <p className="text-sm text-slate-500">Gerencie o cadastro e o progresso da academia.</p>
        </div>
        <div className="flex items-center gap-3 text-slate-500">
          <button className="h-10 w-10 rounded-xl border border-slate-200 bg-white">N</button>
          <button className="h-10 w-10 rounded-xl border border-slate-200 bg-white">M</button>
        </div>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 lg:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="text-slate-400">Q</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome, e-mail ou matrícula..."
              className="w-full bg-transparent text-sm text-slate-700 outline-none"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={beltFilter}
              onChange={(event) => setBeltFilter(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm"
            >
            {beltOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm"
            >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => loadStudents()}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600"
          >
            Buscar
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                name: "",
                email: "",
                student_number: "",
                phone: "",
                birth_date: "",
                join_date: "",
                current_belt: "Branca",
                stripes: "0",
                emergency_contact: "",
                emergency_phone: "",
                medications: "",
                injuries: "",
                conditions: [],
              });
              setFormError(null);
              setFormOpen(true);
            }}
            className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/30"
          >
            + Novo aluno
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {selectedIds.length > 0 && (
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4 text-sm md:flex-row md:items-center md:justify-between">
            <div className="text-slate-600">
              {selectedIds.length} aluno(s) selecionado(s)
            </div>
            <button
              onClick={async () => {
                if (!confirm("Excluir alunos selecionados?")) {
                  return;
                }
                setBulkLoading(true);
                try {
                  await Promise.all(selectedIds.map((id) => api.delete(`/students/${id}`)));
                  setSelectedIds([]);
                  loadStudents(meta?.current_page ?? 1);
                } finally {
                  setBulkLoading(false);
                }
              }}
              disabled={bulkLoading}
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {bulkLoading ? "Excluindo..." : "Excluir selecionados"}
            </button>
          </div>
        )}
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={selectedIds.length > 0 && selectedIds.length === displayedStudents.length}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-6 py-4">Aluno</th>
              <th className="px-6 py-4">Faixa atual</th>
              <th className="px-6 py-4">Última presença</th>
              <th className="px-6 py-4">Turma</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td className="px-6 py-6 text-slate-500" colSpan={7}>
                  Carregando...
                </td>
              </tr>
            ) : displayedStudents.length === 0 ? (
              <tr>
                <td className="px-6 py-6 text-slate-500" colSpan={7}>
                  Nenhum aluno encontrado.
                </td>
              </tr>
            ) : (
              displayedStudents.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(student.id)}
                      onChange={() => toggleSelected(student.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500">
                        {student.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{student.name}</div>
                        <div className="text-xs text-slate-400">{student.email ?? "sem e-mail"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {student.belt}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{student.lastAttendance}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {student.group}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-2 text-xs font-semibold ${
                        student.status === "Inativo" ? "text-slate-400" : "text-emerald-600"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          student.status === "Inativo" ? "bg-slate-300" : "bg-emerald-500"
                        }`}
                      />
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setEditingId(student.id);
                        setFormData((prev) => ({
                          ...prev,
                          name: student.name,
                          email: student.email ?? "",
                          student_number: student.student_number ?? "",
                        }));
                        setFormError(null);
                        setFormOpen(true);
                      }}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:border-slate-300"
                    >
                      Editar
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Excluir este aluno?")) {
                          return;
                        }
                        await api.delete(`/students/${student.id}`);
                        loadStudents(meta?.current_page ?? 1);
                      }}
                      className="ml-2 rounded-lg border border-red-200 px-3 py-1 text-xs text-red-500 hover:border-red-300"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && (
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-slate-500 lg:flex-row">
          <span>
            Mostrando {(meta.current_page - 1) * meta.per_page + 1} a{" "}
            {Math.min(meta.current_page * meta.per_page, meta.total)} de {meta.total} alunos
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadStudents(Math.max(meta.current_page - 1, 1))}
              disabled={meta.current_page === 1}
              className="h-9 w-9 rounded-xl border border-slate-200 text-slate-500 disabled:opacity-40"
            >
              {"<"}
            </button>
            <span className="h-9 w-9 rounded-xl bg-red-600 text-white flex items-center justify-center">
              {meta.current_page}
            </span>
            <button
              onClick={() => loadStudents(Math.min(meta.current_page + 1, meta.last_page))}
              disabled={meta.current_page === meta.last_page}
              className="h-9 w-9 rounded-xl border border-slate-200 text-slate-500 disabled:opacity-40"
            >
              {">"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <button
                  onClick={() => setFormOpen(false)}
                  className="text-xs font-semibold text-slate-500"
                >
                  &lt; Voltar para lista de alunos
                </button>
                <h2 className="mt-2 text-2xl font-semibold">
                  {editingId ? "Editar aluno" : "Novo aluno"}
                </h2>
                <p className="text-sm text-slate-500">
                  Cadastre o aluno e registre o perfil de saúde.
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                <span className="text-sm font-semibold">+</span>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
                    <span>Informações pessoais</span>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <label className="text-xs font-semibold text-slate-500">
                      Nome completo
                      <input
                        value={formData.name}
                        onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="John Doe"
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                      />
                    </label>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="text-xs font-semibold text-slate-500">
                        Data de nascimento
                        <input
                          value={formData.birth_date}
                          onChange={(event) => setFormData((prev) => ({ ...prev, birth_date: event.target.value }))}
                        placeholder="dd/mm/aaaa"
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-500">
                        Telefone
                        <input
                          value={formData.phone}
                          onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                        placeholder="(11) 99999-0000"
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                        />
                      </label>
                    </div>
                    <label className="text-xs font-semibold text-slate-500">
                      E-mail
                      <input
                        value={formData.email}
                        onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                        placeholder="joao@email.com"
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-500">
                      Matrícula
                      <input
                        value={formData.student_number}
                        onChange={(event) => setFormData((prev) => ({ ...prev, student_number: event.target.value }))}
                        placeholder="Matrícula"
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
                    <span>Detalhes da graduação</span>
                  </div>
                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="text-xs font-semibold text-slate-500">Faixa atual</div>
                      <div className="mt-3 grid grid-cols-5 gap-2">
                        {Object.keys(beltColors).map((belt) => (
                          <button
                            key={belt}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, current_belt: belt }))}
                            className={`h-10 rounded-xl border ${formData.current_belt === belt ? "border-red-500" : "border-slate-200"}`}
                          >
                            <div className={`h-full w-full rounded-lg bg-gradient-to-r ${beltColors[belt]}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="text-xs font-semibold text-slate-500">
                        Graus (listras)
                        <select
                          value={formData.stripes}
                          onChange={(event) => setFormData((prev) => ({ ...prev, stripes: event.target.value }))}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                        >
                          {["0", "1", "2", "3", "4"].map((stripe) => (
                            <option key={stripe} value={stripe}>
                              {stripe} listras
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-xs font-semibold text-slate-500">
                        Data de entrada
                        <input
                          value={formData.join_date}
                          onChange={(event) => setFormData((prev) => ({ ...prev, join_date: event.target.value }))}
                        placeholder="dd/mm/aaaa"
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-red-600">
                    <span>Anamnese e saúde</span>
                  </div>
                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="text-xs font-semibold text-slate-500">Condições conhecidas</div>
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {conditionOptions.map((condition) => {
                          const checked = formData.conditions.includes(condition);
                          return (
                            <label
                              key={condition}
                              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    conditions: checked
                                      ? prev.conditions.filter((item) => item !== condition)
                                      : [...prev.conditions, condition],
                                  }))
                                }
                              />
                              {condition}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="text-xs font-semibold text-slate-500">
                        Contato de emergência
                        <input
                          value={formData.emergency_contact}
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, emergency_contact: event.target.value }))
                          }
                          placeholder="Parentesco - Nome completo"
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-500">
                        Telefone de emergência
                        <input
                          value={formData.emergency_phone}
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, emergency_phone: event.target.value }))
                          }
                          placeholder="(11) 99999-0000"
                          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                        />
                      </label>
                    </div>

                    <label className="text-xs font-semibold text-slate-500">
                      Medicamentos atuais
                      <textarea
                        value={formData.medications}
                        onChange={(event) => setFormData((prev) => ({ ...prev, medications: event.target.value }))}
                        placeholder="Liste os medicamentos de uso contínuo..."
                        rows={3}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                      />
                    </label>

                    <label className="text-xs font-semibold text-slate-500">
                      Lesões ou cirurgias anteriores
                      <textarea
                        value={formData.injuries}
                        onChange={(event) => setFormData((prev) => ({ ...prev, injuries: event.target.value }))}
                        placeholder="Descreva limitações físicas ou lesões anteriores..."
                        rows={3}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                      />
                    </label>

                    <label className="flex items-start gap-2 text-xs text-slate-500">
                      <input type="checkbox" />
                      Declaro que as informações acima são verdadeiras.
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 md:flex-row md:items-center md:justify-between">
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
              >
                Cancelar
              </button>
              <div className="flex items-center gap-3">
                {formError && <span className="text-sm text-red-500">{formError}</span>}
                <button
                  onClick={async () => {
                    setFormLoading(true);
                    setFormError(null);
                    try {
                      const payload = {
                        name: formData.name,
                        email: formData.email,
                        student_number: formData.student_number,
                        belt_level: formData.current_belt,
                        stripes_count: Number(formData.stripes),
                        phone: formData.phone,
                        birth_date: formData.birth_date,
                        notes: formData.injuries || formData.medications ? `${formData.medications}\n${formData.injuries}`.trim() : undefined,
                      };
                      if (editingId) {
                        await api.patch(`/students/${editingId}`, payload);
                      } else {
                        await api.post("/students", payload);
                      }
                      setFormOpen(false);
                      loadStudents(meta?.current_page ?? 1);
                    } catch {
                      setFormError("Falha ao salvar aluno.");
                    } finally {
                      setFormLoading(false);
                    }
                  }}
                  disabled={formLoading || !formData.name}
                  className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {formLoading ? "Salvando..." : "Salvar perfil do aluno"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
