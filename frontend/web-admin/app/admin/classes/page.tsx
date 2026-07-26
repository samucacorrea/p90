"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";

interface TeacherOption {
  id: number;
  name: string;
}

interface StudentOption {
  id: number;
  name: string;
  belt_level?: string | null;
}

interface SchoolClass {
  id: number;
  name: string;
  description: string | null;
  teacher?: { id: number; name: string } | null;
  students?: StudentOption[];
}

interface ApiResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const groupTabs = [
  { value: "All Groups", label: "Todos os grupos" },
  { value: "Adults", label: "Adultos" },
  { value: "Kids", label: "Kids" },
  { value: "Competition", label: "Competição" },
  { value: "Fundamentals", label: "Fundamentos" },
];
const viewTabs = ["Turmas", "Gerenciar Turmas"];

export default function ClassesPage() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [meta, setMeta] = useState<Omit<ApiResponse<SchoolClass>, "data"> | null>(null);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(groupTabs[0].value);
  const [viewTab, setViewTab] = useState(viewTabs[0]);
  const [query, setQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [studentQuery, setStudentQuery] = useState("");
  const [assignedStudentIds, setAssignedStudentIds] = useState<number[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    teacher_id: "",
    time: "",
  });

  const loadClasses = useCallback(async (page = 1) => {
    setLoading(true);
    const category = activeTab === "All Groups" ? undefined : activeTab;
    const response = await api.get<ApiResponse<SchoolClass>>("/classes", {
      params: {
        page,
        per_page: 8,
        category,
        q: query || undefined,
      },
    });
    setClasses(response.data.data);
    setMeta({
      current_page: response.data.current_page,
      last_page: response.data.last_page,
      per_page: response.data.per_page,
      total: response.data.total,
    });
    setLoading(false);
  }, [activeTab, query]);

  const loadTeachers = useCallback(async () => {
    const response = await api.get<ApiResponse<TeacherOption>>("/users", {
      params: { role: "teacher", per_page: 100 },
    });
    setTeachers(response.data.data);
  }, []);

  const loadStudents = useCallback(async () => {
    const response = await api.get<ApiResponse<StudentOption>>("/students", {
      params: { per_page: 200 },
    });
    setStudents(response.data.data);
  }, []);

  useEffect(() => {
    loadClasses();
    loadTeachers();
    loadStudents();
  }, [loadClasses, loadTeachers, loadStudents]);

  useEffect(() => {
    setSelectedIds([]);
  }, [classes]);

  const openEditor = useCallback(
    async (classItem?: SchoolClass) => {
      setFormError(null);
      if (classItem) {
        setEditingId(classItem.id);
        setFormData({
          name: classItem.name,
          description: classItem.description ?? "",
          teacher_id: classItem.teacher?.id ? String(classItem.teacher.id) : "",
          time: "",
        });
        setAssignedStudentIds(classItem.students?.map((student) => student.id) ?? []);
        try {
          const response = await api.get<{ data: SchoolClass }>(`/classes/${classItem.id}`);
          const loaded = response.data.data;
          setAssignedStudentIds(loaded.students?.map((student) => student.id) ?? []);
        } catch {
          setAssignedStudentIds(classItem.students?.map((student) => student.id) ?? []);
        }
      } else {
        setEditingId(null);
        setFormData({ name: "", description: "", teacher_id: "", time: "" });
        setAssignedStudentIds([]);
      }
      setStudentQuery("");
      setEditorOpen(true);
    },
    []
  );

  const filteredStudents = useMemo(() => {
    if (!studentQuery) return students;
    const term = studentQuery.toLowerCase();
    return students.filter((student) => student.name.toLowerCase().includes(term));
  }, [studentQuery, students]);

  const activeStudents = useMemo(
    () => filteredStudents.filter((student) => !assignedStudentIds.includes(student.id)),
    [assignedStudentIds, filteredStudents]
  );

  const assignedStudents = useMemo(
    () => students.filter((student) => assignedStudentIds.includes(student.id)),
    [assignedStudentIds, students]
  );

  const displayedClasses = useMemo(() => {
    return classes.map((item, index) => ({
      ...item,
      time: index % 2 === 0 ? "19:00 - 20:30" : "09:00 - 10:00",
      studentsCount: 12 + index * 3,
      tag: index % 2 === 0 ? "AGORA" : "AMANHÃ",
    }));
  }, [classes]);

  const toggleSelected = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    const ids = classes.map((item) => item.id);
    setSelectedIds((prev) => (prev.length === ids.length ? [] : ids));
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gestão de Turmas</h1>
          <p className="text-sm text-slate-500">Gerencie as turmas e seus grupos de alunos.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
            Editar cronograma
          </button>
          <button
            onClick={() => {
              openEditor();
            }}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-600/30"
          >
            + Nova turma
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        {viewTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setViewTab(tab)}
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              viewTab === tab
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-500 border border-slate-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {viewTab === "Turmas" && (
        <>
      <div className="flex flex-wrap items-center gap-3">
        {groupTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              activeTab === tab.value ? "bg-slate-900 text-white" : "bg-white text-slate-500 border border-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500">
          <span>Q</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar grupos..."
            className="w-48 bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Carregando...
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {displayedClasses.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                  <div className="text-xs text-slate-400">{item.description ?? "Gi • Advanced Level"}</div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
                  {item.tag}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-slate-500">
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-[10px] uppercase text-slate-400">Horário</div>
                  <div className="mt-1 font-semibold text-slate-700">{item.time}</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-3">
                  <div className="text-[10px] uppercase text-slate-400">Alunos</div>
                  <div className="mt-1 font-semibold text-slate-700">{item.studentsCount} ativos</div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white">
                  Iniciar aula
                </button>
                <button
                  onClick={() => openEditor(item)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Ver alunos
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900">Elegibilidade para promoção</div>
            <div className="text-xs text-slate-400">Novas promoções de faixa elegíveis</div>
          </div>
          <button className="text-xs font-semibold text-red-500">Ver tudo</button>
        </div>
        <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-4 text-xs text-slate-500">
          Marcus Aurelius completou 50 aulas. Pronto para avaliação da faixa azul.
        </div>
      </div>
        </>
      )}

      {viewTab === "Gerenciar Turmas" && (
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {selectedIds.length > 0 && (
              <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4 text-sm md:flex-row md:items-center md:justify-between">
                <div className="text-slate-600">
                  {selectedIds.length} turma(s) selecionada(s)
                </div>
                <button
                  onClick={async () => {
                    if (!confirm("Excluir turmas selecionadas?")) {
                      return;
                    }
                    setBulkLoading(true);
                    try {
                      await Promise.all(selectedIds.map((id) => api.delete(`/classes/${id}`)));
                      setSelectedIds([]);
                      loadClasses(meta?.current_page ?? 1);
                    } finally {
                      setBulkLoading(false);
                    }
                  }}
                  disabled={bulkLoading}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {bulkLoading ? "Excluindo..." : "Excluir selecionadas"}
                </button>
              </div>
            )}
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === classes.length}
                      onChange={toggleAll}
                    />
                  </th>
                  <th className="px-6 py-4">Turma</th>
                  <th className="px-6 py-4">Professor</th>
                  <th className="px-6 py-4">Descricao</th>
                  <th className="px-6 py-4 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td className="px-6 py-6 text-slate-500" colSpan={5}>
                      Carregando...
                    </td>
                  </tr>
                ) : classes.length === 0 ? (
                  <tr>
                    <td className="px-6 py-6 text-slate-500" colSpan={5}>
                      Nenhuma turma encontrada.
                    </td>
                  </tr>
                ) : (
                  classes.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelected(item.id)}
                        />
                      </td>
                      <td className="px-6 py-4 text-slate-800">{item.name}</td>
                      <td className="px-6 py-4 text-slate-500">{item.teacher?.name ?? "-"}</td>
                      <td className="px-6 py-4 text-slate-500">{item.description ?? "-"}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            openEditor(item);
                          }}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:border-slate-300"
                        >
                          Editar
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm("Excluir esta turma?")) {
                              return;
                            }
                            await api.delete(`/classes/${item.id}`);
                            loadClasses(meta?.current_page ?? 1);
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
        </div>
      )}

      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{editingId ? "Editar Turma" : "Nova Turma"}</h2>
                <p className="text-xs text-slate-400">Gerencie detalhes, instrutores e alunos matriculados.</p>
              </div>
              <button
                onClick={() => setEditorOpen(false)}
                className="rounded-xl border border-slate-200 px-3 py-1 text-xs text-slate-500"
              >
                x
              </button>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <input
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Nome"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              />
              <select
                value={formData.teacher_id}
                onChange={(event) => setFormData((prev) => ({ ...prev, teacher_id: event.target.value }))}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              >
                <option value="">Professor (opcional)</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
              <input
                value={formData.time}
                onChange={(event) => setFormData((prev) => ({ ...prev, time: event.target.value }))}
                placeholder="Horario"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              />
              <input
                value={formData.description}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Descricao"
                className="md:col-span-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              />
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Gerenciar Alunos</h3>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
                  <span>Q</span>
                  <input
                    value={studentQuery}
                    onChange={(event) => setStudentQuery(event.target.value)}
                    placeholder="Buscar aluno..."
                    className="w-44 bg-transparent text-xs outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-xs font-semibold text-slate-400">
                    <span>ALUNOS ATIVOS</span>
                    <span>{activeStudents.length} Total</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto p-3">
                    {activeStudents.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-400">
                        Nenhum aluno disponível.
                      </div>
                    )}
                    {activeStudents.map((student) => (
                      <button
                        key={student.id}
                        onClick={() =>
                          setAssignedStudentIds((prev) => [...prev, student.id])
                        }
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="h-8 w-8 rounded-full bg-slate-100 text-xs font-semibold text-slate-500 flex items-center justify-center">
                            {student.name.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-slate-700">{student.name}</div>
                            <div className="text-xs text-slate-400">
                              {student.belt_level ?? "Faixa nao definida"}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-red-500">+</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-red-200 bg-red-50/40">
                  <div className="flex items-center justify-between border-b border-red-200 px-4 py-3 text-xs font-semibold text-red-500">
                    <span>MATRICULADOS NESTA TURMA</span>
                    <span>{assignedStudents.length}</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto p-3">
                    {assignedStudents.length === 0 && (
                      <div className="rounded-xl border border-dashed border-red-200 p-3 text-xs text-red-300">
                        Nenhum aluno matriculado.
                      </div>
                    )}
                    {assignedStudents.map((student) => (
                      <button
                        key={student.id}
                        onClick={() =>
                          setAssignedStudentIds((prev) =>
                            prev.filter((id) => id !== student.id)
                          )
                        }
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-600 hover:bg-white"
                      >
                        <div className="flex items-center gap-3">
                          <span className="h-8 w-8 rounded-full bg-white text-xs font-semibold text-slate-500 flex items-center justify-center">
                            {student.name.slice(0, 2).toUpperCase()}
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-slate-700">{student.name}</div>
                            <div className="text-xs text-slate-400">
                              {student.belt_level ?? "Faixa nao definida"}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400">x</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setEditorOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-500"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setFormLoading(true);
                  setFormError(null);
                  try {
                    const payload = {
                      name: formData.name,
                      description: formData.description || null,
                      teacher_id: formData.teacher_id ? Number(formData.teacher_id) : null,
                      student_ids: assignedStudentIds,
                    };
                    if (editingId) {
                      await api.patch(`/classes/${editingId}`, payload);
                    } else {
                      const response = await api.post("/classes", payload);
                      const createdId = response.data?.data?.id;
                      if (createdId) {
                        setEditingId(createdId);
                      }
                    }
                    setEditorOpen(false);
                    loadClasses(meta?.current_page ?? 1);
                  } catch {
                    setFormError("Falha ao salvar turma.");
                  } finally {
                    setFormLoading(false);
                  }
                }}
                disabled={formLoading || !formData.name}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {formLoading ? "Salvando..." : "Salvar Turma"}
              </button>
            </div>
            {formError && <div className="mt-3 text-sm text-red-500">{formError}</div>}
          </div>
        </div>
      )}
    </section>
  );
}
