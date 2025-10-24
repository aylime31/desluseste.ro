import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
      <body className={`${inter.className} bg-[#f7f9fc] text-slate-800`}>
        <header className="w-full py-6 flex justify-center border-b border-slate-200 bg-white shadow-sm">
          <div className="flex items-center space-x-3">
            <img
              src="/logo.png"
              alt="Deslușește.ro logo"
              className="h-14 w-auto"
            />
          </div>
        </header>
        <main className="flex justify-center items-center min-h-[80vh] p-4">
          {children}
        </main>
        <footer className="text-center py-6 text-sm text-slate-500 border-t border-slate-200 bg-white">
          © 2025 deslușește.ro — Analizăm clar și pe înțelesul tău
        </footer>
      </body>
    </html>
  );
}
