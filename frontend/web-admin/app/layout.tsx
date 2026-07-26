import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "P90 Admin",
  description: "Painel administrativo do sistema P90.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
