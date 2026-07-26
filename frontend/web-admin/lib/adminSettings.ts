export type AdminLoginSettings = {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroBackgroundUrl: string;
};

const SETTINGS_KEY = "admin_login_settings";

const DEFAULT_SETTINGS: AdminLoginSettings = {
  heroBadge: "GESTAO PREMIUM",
  heroTitle: "Precisao em cada\ndetalhe da sua escola.",
  heroSubtitle: "Bem-vindo de volta, Professor. Acesse o painel.",
  heroDescription:
    "Ajudamos os mestres a focar na arte enquanto cuidamos da administracao. Acompanhe o progresso, gerencie turmas e cresca sua academia.",
  heroBackgroundUrl: "",
};

export function getAdminLoginSettings(): AdminLoginSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    return DEFAULT_SETTINGS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AdminLoginSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function setAdminLoginSettings(next: AdminLoginSettings) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
}

export function resetAdminLoginSettings() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(SETTINGS_KEY);
}
