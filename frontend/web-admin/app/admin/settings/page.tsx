"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { getUser, setUser } from "@/lib/auth";
import {
  getAdminLoginSettings,
  resetAdminLoginSettings,
  setAdminLoginSettings,
  type AdminLoginSettings,
} from "@/lib/adminSettings";

type AdminUser = {
  id?: number;
  name?: string;
  email?: string;
  phone?: string | null;
  birth_date?: string | null;
  belt?: string | null;
  degree?: string | null;
  bio?: string | null;
  avatar_path?: string | null;
};

const beltOptions = ["Branca", "Azul", "Roxa", "Marrom", "Preta"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"system" | "profile">("system");
  const [systemForm, setSystemForm] = useState<AdminLoginSettings>(() => getAdminLoginSettings());
  const [systemSaved, setSystemSaved] = useState(false);

  const [profile, setProfile] = useState<AdminUser | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    birth_date: "",
    belt: "Preta",
    degree: "0",
    bio: "",
    password: "",
    passwordConfirm: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<AdminUser[]>([]);
  const [promoteId, setPromoteId] = useState<string>("");
  const [promotePassword, setPromotePassword] = useState("");
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [promoteMessage, setPromoteMessage] = useState<string | null>(null);

  useEffect(() => {
    setSystemForm(getAdminLoginSettings());
  }, []);

  useEffect(() => {
    const user = getUser<AdminUser>();
    setProfile(user);
    if (user) {
      setProfileForm({
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        birth_date: user.birth_date ?? "",
        belt: user.belt ?? "Preta",
        degree: user.degree ?? "0",
        bio: user.bio ?? "",
        password: "",
        passwordConfirm: "",
      });
    }
  }, []);

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const response = await api.get("/users", { params: { role: "teacher", per_page: 100 } });
        setTeachers(response.data.data ?? []);
      } catch {
        setTeachers([]);
      }
    };
    loadTeachers();
  }, []);

  const updateSystemField = (key: keyof AdminLoginSettings, value: string) => {
    setSystemForm((prev) => ({ ...prev, [key]: value }));
    setSystemSaved(false);
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-sm text-slate-500">Gerencie preferências do sistema e do seu perfil.</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setActiveTab("system")}
          className={`rounded-full px-4 py-2 text-xs font-semibold ${
            activeTab === "system"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-500 border border-slate-200"
          }`}
        >
          Configurações do sistema
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`rounded-full px-4 py-2 text-xs font-semibold ${
            activeTab === "profile"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-500 border border-slate-200"
          }`}
        >
          Configuração pessoal
        </button>
      </div>

      {activeTab === "system" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500">URL do fundo</label>
            <input
              value={systemForm.heroBackgroundUrl}
              onChange={(event) => updateSystemField("heroBackgroundUrl", event.target.value)}
              placeholder="https://seusite.com/imagem.jpg"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">Selo</label>
            <input
              value={systemForm.heroBadge}
              onChange={(event) => updateSystemField("heroBadge", event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">Título (use quebra de linha)</label>
            <textarea
              value={systemForm.heroTitle}
              onChange={(event) => updateSystemField("heroTitle", event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">Subtítulo (lado direito)</label>
            <textarea
              value={systemForm.heroSubtitle}
              onChange={(event) => updateSystemField("heroSubtitle", event.target.value)}
              rows={2}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">Descrição</label>
            <textarea
              value={systemForm.heroDescription}
              onChange={(event) => updateSystemField("heroDescription", event.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setAdminLoginSettings(systemForm);
                setSystemSaved(true);
              }}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Salvar alterações
            </button>
            <button
              onClick={() => {
                resetAdminLoginSettings();
                setSystemForm(getAdminLoginSettings());
                setSystemSaved(false);
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
            >
              Restaurar padrão
            </button>
            {systemSaved && <span className="text-sm text-emerald-600">Salvo.</span>}
          </div>
        </div>
      )}

      {activeTab === "profile" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="h-20 w-20 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center text-slate-400">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg">👤</span>
              )}
            </div>
            <label className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 cursor-pointer">
              Trocar foto
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

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-xs font-semibold text-slate-500">
              Nome completo
              <input
                value={profileForm.name}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              E-mail profissional
              <input
                value={profileForm.email}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, email: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Telefone
              <input
                value={profileForm.phone}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Data de nascimento
              <input
                value={profileForm.birth_date}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, birth_date: event.target.value }))}
                placeholder="dd/mm/aaaa"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Nova senha
              <input
                value={profileForm.password}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, password: event.target.value }))}
                type="password"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Confirmar senha
              <input
                value={profileForm.passwordConfirm}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, passwordConfirm: event.target.value }))}
                type="password"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-xs font-semibold text-slate-500">
              Faixa
              <select
                value={profileForm.belt}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, belt: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              >
                {beltOptions.map((belt) => (
                  <option key={belt} value={belt}>
                    {belt}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-slate-500">
              Grau
              <input
                value={profileForm.degree}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, degree: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              />
            </label>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500">
              Biografia
              <textarea
                value={profileForm.bio}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, bio: event.target.value }))}
                rows={4}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
              />
            </label>
          </div>

          {profileError && <div className="text-sm text-red-500">{profileError}</div>}

          <div className="flex items-center justify-end gap-3">
            {profileSaved && <span className="text-sm text-emerald-600">Salvo.</span>}
            <button
              onClick={async () => {
                if (!profile?.id) {
                  setProfileError("Usuário não encontrado.");
                  return;
                }
                if (profileForm.password && profileForm.password !== profileForm.passwordConfirm) {
                  setProfileError("As senhas não conferem.");
                  return;
                }
                setProfileLoading(true);
                setProfileError(null);
                try {
                  const payload = new FormData();
                  payload.append("name", profileForm.name);
                  payload.append("email", profileForm.email);
                  if (profileForm.phone) payload.append("phone", profileForm.phone);
                  if (profileForm.birth_date) payload.append("birth_date", profileForm.birth_date);
                  if (profileForm.belt) payload.append("belt", profileForm.belt);
                  if (profileForm.degree) payload.append("degree", profileForm.degree);
                  if (profileForm.bio) payload.append("bio", profileForm.bio);
                  if (profileForm.password) payload.append("password", profileForm.password);
                  if (avatarFile) payload.append("avatar", avatarFile);
                  payload.append("_method", "PATCH");

                  const response = await api.post(`/users/${profile.id}`, payload, {
                    headers: { "Content-Type": "multipart/form-data" },
                  });
                  const updated = response.data?.data;
                  if (updated) {
                    setUser(updated);
                    setProfile(updated);
                  }
                  setProfileSaved(true);
                } catch {
                  setProfileError("Falha ao salvar o perfil.");
                } finally {
                  setProfileLoading(false);
                }
              }}
              disabled={profileLoading || !profileForm.name || !profileForm.email}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {profileLoading ? "Salvando..." : "Salvar perfil"}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">Acesso ao painel (professores)</h2>
        <p className="text-sm text-slate-500">
          Defina uma senha inicial para permitir o acesso ao painel sem mudar o papel de professor.
        </p>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <select
            value={promoteId}
            onChange={(event) => setPromoteId(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
          >
            <option value="">Selecione um professor</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name} ({teacher.email})
              </option>
            ))}
          </select>
          <input
            value={promotePassword}
            onChange={(event) => setPromotePassword(event.target.value)}
            type="password"
            placeholder="Senha inicial"
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
          />
          <button
            onClick={async () => {
              if (!promoteId || !promotePassword) return;
              setPromoteLoading(true);
              setPromoteMessage(null);
              try {
                await api.patch(`/users/${promoteId}`, { password: promotePassword });
                setPromoteMessage("Senha definida. O professor já pode acessar o painel.");
                setPromoteId("");
                setPromotePassword("");
              } catch {
                setPromoteMessage("Falha ao definir senha.");
              } finally {
                setPromoteLoading(false);
              }
            }}
            disabled={promoteLoading || !promoteId || !promotePassword}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {promoteLoading ? "Salvando..." : "Ativar acesso"}
          </button>
        </div>
        {promoteMessage && <div className="text-sm text-slate-600">{promoteMessage}</div>}
      </div>
    </section>
  );
}
