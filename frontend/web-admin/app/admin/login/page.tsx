"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import api from "@/lib/api";
import { setToken, setUser } from "@/lib/auth";
import { getAdminLoginSettings } from "@/lib/adminSettings";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState(() => getAdminLoginSettings());

  useEffect(() => {
    setSettings(getAdminLoginSettings());
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/auth/login", { email, password });
      const token = response.data?.token;
      const user = response.data?.user;

      if (token) {
        setToken(token);
        if (user) {
          setUser(user);
        }
      }

      router.push("/admin");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const message = err.response?.data?.message;
        setError(message ? `Erro (${status}): ${message}` : `Erro (${status ?? "rede"}).`);
      } else {
        setError("Credenciais invalidas.");
      }
    } finally {
      setLoading(false);
    }
  };

  const heroImage = settings.heroBackgroundUrl || process.env.NEXT_PUBLIC_ADMIN_BG_URL || "";

  return (
    <main className="grid min-h-screen grid-cols-1 bg-white text-slate-900 lg:grid-cols-2">
      <section
        className="relative hidden items-end justify-start lg:flex"
        style={{
          backgroundImage: heroImage
            ? `linear-gradient(180deg, rgba(7, 10, 14, 0.35), rgba(7, 10, 14, 0.9)), url(${heroImage})`
            : "linear-gradient(180deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.96))",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-xl p-12 pb-14">
          <span className="inline-flex items-center rounded-full bg-red-600/90 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-white">
            {settings.heroBadge}
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-white">
            {settings.heroTitle.split("\n").map((line, index, all) => (
              <span key={`${line}-${index}`}>
                {line}
                {index < all.length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p className="mt-4 text-sm text-slate-200">{settings.heroDescription}</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600 text-white shadow-lg shadow-red-600/30">
              <span className="text-xl font-semibold">OSS</span>
            </div>
            <div className="text-sm font-semibold tracking-[0.2em] text-slate-500">
              OSS <span className="text-red-600">ADMIN</span>
            </div>
          </div>

          <h2 className="mt-8 text-3xl font-semibold">Login do Admin</h2>
          <p className="mt-2 text-sm text-slate-500">{settings.heroSubtitle}</p>

          <div className="mt-8 space-y-5">
            <label className="text-sm font-semibold text-slate-700">
              E-mail
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <span className="text-slate-400">@</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="digite seu e-mail"
                  className="w-full bg-transparent text-sm text-slate-800 outline-none"
                />
              </div>
            </label>

            <label className="text-sm font-semibold text-slate-700">
              Senha
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <span className="text-slate-400">**</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="********"
                  className="w-full bg-transparent text-sm text-slate-800 outline-none"
                />
              </div>
            </label>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-500">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300" />
              Lembrar de mim
            </label>
            <button type="button" className="font-semibold text-red-600">
              Esqueceu a senha?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/30 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar no sistema"}
            <span aria-hidden>{">"}</span>
          </button>

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

          <div className="mt-8 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200">
              OK
            </span>
            ACESSO SEGURO PARA GESTAO ESCOLAR
          </div>

          <div className="mt-8 flex items-center justify-between text-xs text-slate-400">
            <span>© 2024 Martial Arts Pro</span>
            <div className="flex items-center gap-4">
              <button type="button">Suporte</button>
              <button type="button">Privacidade</button>
            </div>
          </div>
        </form>
      </section>
    </main>
  );
}
