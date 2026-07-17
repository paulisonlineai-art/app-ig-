import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Klar — Inteligencia para tu contenido de Instagram",
  description: "Detectá por qué tus reels no funcionan. Predecí viralidad. Atribuí ventas.",
};

const themeScript = `(function(){try{var m=localStorage.getItem('klar_theme')||'auto';var t=m;if(m==='auto'){var h=new Date().getHours();t=h>=6&&h<18?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`h-full ${dmSans.className}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-full">{children}</body>
    </html>
  );
}
