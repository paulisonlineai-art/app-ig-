import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moka — Analytics de Instagram",
  description: "Tu sistema de análisis de contenido con IA",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
