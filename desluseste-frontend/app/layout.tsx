import type { Metadata } from "next";
import { Comfortaa } from "next/font/google";
import "./globals.css";

const comfortaa = Comfortaa({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Deslușește.ro — Analiză Contracte",
  description:
    "Transformăm contracte complexe în limbaj simplu. Interfață 100% română, gândită pentru încredere.",
  metadataBase: new URL("https://desluseste.ro"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro" className="h-full scroll-smooth">
      <body className={`${comfortaa.className} min-h-screen bg-app`}>
        {children}
      </body>
    </html>
  );
}
