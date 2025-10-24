"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";

import { FileUpload } from "@/components/ui/FileUpload";
import { Alert } from "@/components/ui/alert";
import { analizeazaPdf } from "@/lib/api";
import { normalizeAnalysis, type NormalizedAnalysisResponse } from "@/lib/schemas";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LandingHero } from "@/components/landing/LandingHero";
import { UploadCard } from "@/components/landing/UploadCard";
import { SkeletonCard, SkeletonText } from "@/components/analysis/Skeletons";

// Lazy-load dashboard-ul (client-only)
const AnalysisDashboard = dynamic(
  () => import("@/components/analysis/AnalysisDashboard").then((m) => m.AnalysisDashboard),
  { ssr: false }
);

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<NormalizedAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const liveRef = useRef<HTMLDivElement | null>(null); // pentru focus management/a11y

  const handleFileAccepted = useCallback((file: File) => {
    setSelectedFile(file);
    setResult(null);
    setError(null);
    requestAnimationFrame(() => liveRef.current?.focus());
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const raw = await analizeazaPdf(selectedFile);
      const normalized = normalizeAnalysis(raw);
      setResult(normalized);
      requestAnimationFrame(() => liveRef.current?.focus());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "A apărut o eroare la analiză.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile]);

  const handleReset = useCallback(() => {
    setResult(null);
    setSelectedFile(null);
    setError(null);
    try {
      if (window.location.hash) history.replaceState(null, "", window.location.pathname);
    } catch {}
  }, []);

  // dashboard după analiză
  if (result) {
    return <AnalysisDashboard result={result} onReset={handleReset} />;
  }

  // landing + upload
  return (
    <div className="min-h-screen bg-app">
      <SiteHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HERO + UPLOAD side-by-side */}
        <section className="mt-6 lg:mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Stânga: Hero + Beneficii */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <LandingHero />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="card-tight text-left">
                <h3 className="text-base font-semibold mb-1">Rapid</h3>
                <p className="text-sm text-muted">Rezultate în câteva secunde cu AI.</p>
              </div>
              <div className="card-tight text-left">
                <h3 className="text-base font-semibold mb-1">Limbaj simplu</h3>
                <p className="text-sm text-muted">Clauze explicate fără jargon.</p>
              </div>
              <div className="card-tight text-left sm:col-span-2">
                <h3 className="text-base font-semibold mb-1">Confidențial</h3>
                <p className="text-sm text-muted">Procesare sigură, în română.</p>
              </div>
            </div>
          </div>

          {/* Dreapta: Upload + Erori + Skeleton */}
          <div className="lg:col-span-7">
            {/* Zonă pentru focus-management / anunțare rezultate */}
            <div ref={liveRef} tabIndex={-1} aria-live="polite" className="outline-none" />

            <UploadCard
              selectedFile={selectedFile}
              isLoading={isLoading}
              onAnalyze={handleAnalyze}
              onClear={handleReset}
              Upload={({ disabled }) => (
                <FileUpload onFileAccepted={handleFileAccepted} disabled={disabled} />
              )}
            />

            {error && (
              <Alert
                variant="destructive"
                className="mt-6 bg-red-900/20 border-red-800/50 text-red-200"
              >
                {error}
              </Alert>
            )}

            {isLoading && (
              <section className="mt-6 grid grid-cols-1 gap-6">
                <SkeletonCard />
                <div className="card-tight">
                  <div className="h-4 w-40 bg-slate-700/50 rounded mb-4" />
                  <SkeletonText lines={8} />
                </div>
              </section>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
