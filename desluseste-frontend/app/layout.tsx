import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Deslușește.ro — Analiză Contracte",
  description: "Transformăm contracte complexe în limbaj simplu. Interfață 100% română, gândită pentru încredere.",
  metadataBase: new URL("https://desluseste.ro"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className="scroll-smooth">
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
