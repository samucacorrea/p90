"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import AdminGuard from "./AdminGuard";
import { clearToken, getUser } from "@/lib/auth";
import api from "@/lib/api";

type AdminUser = {
  id?: number;
  name?: string;
  email?: string;
};

const links = [
  { href: "/admin", label: "Painel" },
  { href: "/admin/classes", label: "Turmas & Grupos" },
  { href: "/admin/students", label: "Alunos" },
  { href: "/admin/teachers", label: "Professores" },
  { href: "/admin/reports", label: "Relatórios" },
  { href: "/admin/settings", label: "Configurações" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const normalizedPath = pathname?.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  const hideNav = normalizedPath === "/admin/login";
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    setAdminUser(getUser<AdminUser>());
  }, []);

  const initials = useMemo(() => {
    const base = adminUser?.name ?? "Admin";
    return base.slice(0, 2).toUpperCase();
  }, [adminUser]);

  if (hideNav) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-white text-slate-900">{children}</div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="flex min-h-screen">
          <aside className="hidden w-72 border-r border-slate-200 bg-white px-6 py-6 lg:flex lg:flex-col">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/30">
                OSS
              </div>
              <div className="text-sm font-semibold">P90 Admin</div>
            </div>

            <nav className="mt-8 space-y-2 text-sm">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 font-semibold ${
                      isActive ? "bg-red-50 text-red-600" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${isActive ? "bg-red-500" : "bg-slate-300"}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-slate-200 pt-6 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                  {initials}
                </div>
                <div>
                  <div className="font-semibold text-slate-700">{adminUser?.name ?? "Prof. Silva"}</div>
                  <div>{adminUser?.email ?? "admin@p90.com"}</div>
                </div>
              </div>
              <button
                onClick={async () => {
                  try {
                    await api.post("/auth/logout");
                  } catch {
                  } finally {
                    clearToken();
                    window.location.href = "/admin/login";
                  }
                }}
                className="mt-4 flex w-full items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Sair
              </button>
            </div>
          </aside>

          <main className="flex-1 px-6 py-6">{children}</main>
        </div>
      </div>
    </AdminGuard>
  );
}
