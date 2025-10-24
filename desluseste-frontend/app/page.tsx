// app/page.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileUpload } from "@/components/ui/FileUpload";
import { Alert } from "@/components/ui/alert";
import { analizeazaPdf } from "@/lib/api";
import { normalizeAnalysis, type NormalizedAnalysisResponse } from "@/lib/schemas";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LandingHero } from "@/components/landing/LandingHero";
import { UploadCard } from "@/components/landing/UploadCard";
import { SkeletonCard, SkeletonText} from "@/components/analysis/Skeletons";



// ————————————————————————————————————————————————
// Page (landing → upload → analyze → dashboard)
// ————————————————————————————————————————————————
export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<NormalizedAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // pentru focus management/a11y
  const liveRef = useRef<HTMLDivElement | null>(null);

  // acceptă fișier
  const handleFileAccepted = useCallback((file: File) => {
    setSelectedFile(file);
    setResult(null);
    setError(null);
    // focus pe zona “live”
    requestAnimationFrame(() => liveRef.current?.focus());
  }, []);

  // pornește analiza
  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const raw = await analizeazaPdf(selectedFile);
      const normalized = normalizeAnalysis(raw);
      setResult(normalized);
      // focus pe rezultate
      requestAnimationFrame(() => liveRef.current?.focus());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "A apărut o eroare la analiză.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile]);

  // reset flow
  const handleReset = useCallback(() => {
    setResult(null);
    setSelectedFile(null);
    setError(null);
    // curățăm hash-ul dacă era setat
    try {
      if (window.location.hash) history.replaceState(null, "", window.location.pathname);
    } catch {}
  }, []);

  // deep-link: dacă există #ancoră la intrarea pe pagină și avem deja rezultate (ex: refresh pe dashboard),
  // AnalysisDashboard va face scroll. Aici doar păstrăm hash-ul neatins.

  if (result) {
    const AnalysisDashboard = require("./components/analysis/AnalysisDashboard").AnalysisDashboard;
    return <AnalysisDashboard result={result} onReset={handleReset} />;
  }

  return (
    <div className="min-h-screen bg-app">
      <SiteHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LandingHero />

        {/* zonă pentru focus-management / anunțare rezultate */}
        <div
          ref={liveRef as any}
          tabIndex={-1}
          aria-live="polite"
          className="outline-none"
        />

        <UploadCard
          selectedFile={selectedFile}
          isLoading={isLoading}
          onAnalyze={handleAnalyze}
          onClear={handleReset}
          Upload={({ disabled }) => (
            <FileUpload onFileAccepted={handleFileAccepted} disabled={!!disabled} />
          )}
        />

        {error && (
          <Alert variant="destructive" className="mt-6 bg-red-900/20 border-red-800/50 text-red-200">
            {error}
          </Alert>
        )}

        {/* beneficii scurte */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-tight text-center">
            <h3 className="text-lg font-semibold mb-1">Rapid</h3>
            <p className="text-sm text-muted">Rezultate în câteva secunde cu AI.</p>
          </div>
          <div className="card-tight text-center">
            <h3 className="text-lg font-semibold mb-1">Limbaj simplu</h3>
            <p className="text-sm text-muted">Clauze explicate fără jargon.</p>
          </div>
          <div className="card-tight text-center">
            <h3 className="text-lg font-semibold mb-1">Confidențial</h3>
            <p className="text-sm text-muted">Procesare sigură, în română.</p>
          </div>
        </section>

        {/* skeletons vizibile doar în starea de încărcare */}
        {isLoading && (
          <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <div className="lg:col-span-2 card-tight">
              <div className="h-4 w-40 bg-slate-700/50 rounded mb-4" />
              <SkeletonText lines={8} />
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
