import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Folosim Inter, fontul standard Next.js, pentru a elimina orice eroare de font
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Deslușește.ro",
  description: "Analiză inteligentă pentru documente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      {/* Aplicăm un fundal negru și text alb direct cu clase Tailwind de bază */}
      <body className={`${inter.className} bg-black text-white`}>
        {children}
      </body>
    </html>
  );
}