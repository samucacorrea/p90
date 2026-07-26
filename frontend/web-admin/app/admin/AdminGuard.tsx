"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const normalizedPath = pathname?.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
    const isLogin = normalizedPath === "/admin/login";
    const isReady = isLogin || Boolean(getToken());
    setReady(isReady);
    setMounted(true);
    if (!isReady) {
      router.replace("/admin/login");
    }
  }, [pathname, router]);

  if (!mounted) {
    return null;
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  return <>{children}</>;
}
