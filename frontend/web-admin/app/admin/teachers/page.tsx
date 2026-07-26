"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";

interface Teacher {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ApiResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export default function TeachersPage() {
  const [query, setQuery] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [meta, setMeta] = useState<Omit<ApiResponse<Teacher>, "data"> | null>(null);
  const [loading, setLoading] = useState(false);
  const [classTotal, setClassTotal] = useState<number>(0);
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    birth_date: "",
    belt: "Preta",
    degree: "0",
    bio: "",
    assignedClasses: [] as string[],
    classQuery: "",
  });
  const availableClasses = ["Adulto - Avançado (Noite)", "Infantil A", "Competição Team", "Fundamentos"];

  const loadTeachers = useCallback(
    async (page = 1) => {
      setLoading(true);
      const [teachersResponse, classesResponse] = await Promise.all([
        api.get<ApiResponse<Teacher>>("/users", {
          params: { q: query || undefined, role: "teacher", page, per_page: 12 },
        }),
        api.get<ApiResponse<unknown>>("/classes", { params: { per_page: 1 } }),
      ]);
      setTeachers(teachersResponse.data.data);
      setMeta({
        current_page: teachersResponse.data.current_page,
        last_page: teachersResponse.data.last_page,
        per_page: teachersResponse.data.per_page,
        total: teachersResponse.data.total,
      });
      setClassTotal(classesResponse.data.total ?? 0);
      setLoading(false);
    },
    [query]
  );

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const stats = useMemo(() => {
    const total = meta?.total ?? teachers.length;
    return [
      { label: "Total de professores", value: total },
      { label: "Turmas ativas", value: classTotal },
      { label: "Instrutores principais", value: Math.max(Math.round(total / 4), 0) },
      { label: "Avaliação média", value: "4.9/5" },
    ];
  }, [classTotal, meta, teachers.length]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Diretório de Professores</h1>
          <p className="text-sm text-slate-500">Gerencie e monitore sua equipe de instrutores.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
            <span className="text-slate-400">Q</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar professores..."
              className="w-56 bg-transparent text-sm text-slate-700 outline-none"
            />
          </div>
          <button
            onClick={() => loadTeachers()}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
          >
            Buscar
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                name: "",
                email: "",
                password: "",
                phone: "",
                birth_date: "",
                belt: "Preta",
                degree: "0",
                bio: "",
                assignedClasses: [],
                classQuery: "",
              });
              setAvatarFile(null);
              setAvatarPreview(null);
              setFormError(null);
              setFormOpen(true);
            }}
            className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-600/30"
          >
            + Novo professor
          </button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold text-slate-400">{item.label}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Carregando...
        </div>
      )}

      {!loading && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-500">
                    {teacher.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{teacher.name}</div>
                    <div className="text-xs text-slate-400">{teacher.email}</div>
                  </div>
                </div>
                <button className="text-slate-300">...</button>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Black Belt
                </span>
                <span>3rd Degree</span>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-500">
                <div>Alunos atribuídos: {Math.max(teacher.id * 3, 12)}</div>
                <div>Turmas ativas: {Math.max(teacher.id % 4, 1)}</div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => {
                    setEditingId(teacher.id);
                    setFormData((prev) => ({
                      ...prev,
                      name: teacher.name,
                      email: teacher.email,
                      password: "",
                    }));
                    setAvatarFile(null);
                    setAvatarPreview(null);
                    setFormError(null);
                    setFormOpen(true);
                  }}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                >
                  Editar
                </button>
                <button
                  onClick={async () => {
                    if (!confirm("Excluir este professor?")) {
                      return;
                    }
                    await api.delete(`/users/${teacher.id}`);
                    loadTeachers(meta?.current_page ?? 1);
                  }}
                  className="flex-1 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => {
              setEditingId(null);
              setFormData({
                name: "",
                email: "",
                password: "",
                phone: "",
                birth_date: "",
                belt: "Preta",
                degree: "0",
                bio: "",
                assignedClasses: [],
                classQuery: "",
              });
              setAvatarFile(null);
              setAvatarPreview(null);
              setFormError(null);
              setFormOpen(true);
            }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-400"
          >
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 text-xl text-slate-400">
              +
            </span>
            Novo professor
          </button>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {editingId ? "Editar professor" : "Adicionar professor"}
                </h2>
                <p className="text-xs text-slate-500">Cadastre um novo instrutor no sistema da academia</p>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-xl border border-slate-200 px-3 py-1 text-xs text-slate-500"
              >
                X
              </button>
            </div>

            <div className="mt-6 flex flex-col items-center gap-3">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <span>👤</span>
                  )}
                </div>
                <label className="absolute -right-1 -bottom-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white shadow-lg">
                  +
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setAvatarFile(file);
                      setAvatarPreview(file ? URL.createObjectURL(file) : null);
                    }}
                  />
                </label>
              </div>
              <span className="text-xs font-semibold text-slate-400">FOTO DE PERFIL</span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Nome completo"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              />
              <input
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="Email acadêmico"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              />
              <input
                value={formData.phone}
                onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="Telefone"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              />
              <input
                value={formData.birth_date}
                onChange={(event) => setFormData((prev) => ({ ...prev, birth_date: event.target.value }))}
                placeholder="Data de nascimento"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              />
            </div>

            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50/40 p-4">
              <div className="text-sm font-semibold text-red-600">Graduação e Faixa</div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <select
                  value={formData.belt}
                  onChange={(event) => setFormData((prev) => ({ ...prev, belt: event.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                >
                  {["Branca", "Azul", "Roxa", "Marrom", "Preta"].map((belt) => (
                    <option key={belt} value={belt}>
                      {belt}
                    </option>
                  ))}
                </select>
                <input
                  value={formData.degree}
                  onChange={(event) => setFormData((prev) => ({ ...prev, degree: event.target.value }))}
                  placeholder="Graus"
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-semibold text-slate-600">Turmas designadas</div>
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                {formData.assignedClasses.map((item) => (
                  <span key={item} className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                    {item}
                  </span>
                ))}
                <input
                  value={formData.classQuery}
                  onChange={(event) => setFormData((prev) => ({ ...prev, classQuery: event.target.value }))}
                  placeholder="Buscar turma..."
                  className="flex-1 text-sm text-slate-600 outline-none"
                />
              </div>
              {formData.classQuery && (
                <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2 text-sm text-slate-600">
                  {availableClasses
                    .filter((item) => item.toLowerCase().includes(formData.classQuery.toLowerCase()))
                    .map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            assignedClasses: prev.assignedClasses.includes(item)
                              ? prev.assignedClasses
                              : [...prev.assignedClasses, item],
                            classQuery: "",
                          }))
                        }
                        className="block w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                      >
                        {item}
                      </button>
                    ))}
                </div>
              )}
              <p className="mt-2 text-xs text-slate-400">Vincule o professor às aulas que ele irá ministrar.</p>
            </div>

            <div className="mt-4">
              <div className="text-sm font-semibold text-slate-600">Bio e especialidades</div>
              <textarea
                value={formData.bio}
                onChange={(event) => setFormData((prev) => ({ ...prev, bio: event.target.value }))}
                placeholder="Conte um pouco sobre o professor..."
                rows={3}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setFormOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-500"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setFormLoading(true);
                  setFormError(null);
                  try {
                    const payload = new FormData();
                    payload.append("name", formData.name);
                    payload.append("email", formData.email);
                    if (formData.password) {
                      payload.append("password", formData.password);
                    }
                    if (formData.phone) payload.append("phone", formData.phone);
                    if (formData.birth_date) payload.append("birth_date", formData.birth_date);
                    if (formData.belt) payload.append("belt", formData.belt);
                    if (formData.degree) payload.append("degree", formData.degree);
                    if (formData.bio) payload.append("bio", formData.bio);
                    if (avatarFile) payload.append("avatar", avatarFile);

                    if (editingId) {
                      payload.append("_method", "PATCH");
                      await api.post(`/users/${editingId}`, payload, {
                        headers: { "Content-Type": "multipart/form-data" },
                      });
                    } else {
                      await api.post("/users", payload, {
                        headers: { "Content-Type": "multipart/form-data" },
                      });
                    }
                    setFormOpen(false);
                    loadTeachers(meta?.current_page ?? 1);
                  } catch {
                    setFormError("Falha ao salvar professor.");
                  } finally {
                    setFormLoading(false);
                  }
                }}
                disabled={formLoading || !formData.name || !formData.email}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {formLoading ? "Salvando..." : "Cadastrar professor"}
              </button>
              {formError && <span className="text-sm text-red-500">{formError}</span>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
