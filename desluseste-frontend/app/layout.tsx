import type { Metadata } from "next";
// --- CORECȚIE IMPORT FONT ---
// Pachetul corect pentru fonturile Geist este 'geist/font'.
// Va trebui să-l instalăm.
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

// --- METADATE ACTUALIZATE ---
export const metadata: Metadata = {
  title: "Deslușește.ro | Analiză inteligentă pentru documente",
  description: "Transformăm contracte complexe în limbaj simplu cu ajutorul inteligenței artificiale.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Am setat limba corectă
    <html lang="ro">
      {/* 
        AICI SUNT MODIFICĂRILE CHEIE:
        1. Am adăugat clasele 'bg-background' și 'text-foreground' pentru a seta tema dark.
        2. Am adăugat clasa 'dark' pentru compatibilitate cu componentele Shadcn/UI.
        3. Am folosit numele corecte ale variabilelor de font din importurile noi.
      */}
      <body 
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased bg-background text-foreground dark`}
      >
        {children}
      </body>
    </html>
  );
}
