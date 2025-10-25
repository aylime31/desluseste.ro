"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { analizeazaPdf } from "@/lib/api";
import { normalizeAnalysis, type NormalizedAnalysisResponse } from "@/lib/schemas";
import FileUpload from "@/components/ui/FileUpload";

const AnalysisDashboard = dynamic(
  () => import("@/components/analysis/AnalysisDashboard").then(m => m.AnalysisDashboard),
  { ssr: false }
);

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<NormalizedAnalysisResponse | null>(null);
  const liveRef = useRef<HTMLDivElement | null>(null);

  const handleFileAccepted = useCallback((file: File) => {
    setSelectedFile(file);
    requestAnimationFrame(() => liveRef.current?.focus());
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    try {
      const raw = await analizeazaPdf(selectedFile);
      setResult(normalizeAnalysis(raw));
      requestAnimationFrame(() => liveRef.current?.focus());
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "A apărut o eroare la analiză.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile]);

  const handleReset = useCallback(() => {
    setResult(null);
    setSelectedFile(null);
    try {
      if (window.location.hash) history.replaceState(null, "", window.location.pathname);
    } catch {}
  }, []);

  // După analiză → dashboard
  if (result) {
    return <AnalysisDashboard result={result} onReset={handleReset} />;
  }

  // Landing ultra-simplu (logo + dropzone)
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Hero bar albastru + logo centrat */}
      <header className="hero-blue">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 font-extrabold tracking-wide">
            <span className="logo-dot" />
            DESLUȘEȘTE.RO
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Dropzone central ca Adobe */}
        <section className="upload-wrap">
          <div ref={liveRef} tabIndex={-1} aria-live="polite" className="sr-only" />
          <div className="dz2-card">
            <div className="dz2-left">
              <div className="brand-title">
                <span className="brand-badge" aria-hidden />
                <span>Deslușește</span>
              </div>
              <h1 className="dz2-h1">Încarcă PDF</h1>
              <p className="dz2-sub">Trage un fișier aici sau alege de pe dispozitiv.</p>

              <div className="dz2-actions">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => document.getElementById("file-input-hidden")?.click()}
                  disabled={isLoading}
                >
                  Selectează un fișier
                </button>
              </div>
            </div>

            <div className="dz2-right" aria-hidden>
              {/* icon document mare */}
              <svg viewBox="0 0 160 160" width="160" height="160" fill="none">
                <rect x="28" y="12" width="84" height="112" rx="8" fill="#E7F0FF" />
                <rect x="40" y="44" width="60" height="10" rx="5" fill="#2563EB" opacity=".8" />
                <rect x="40" y="62" width="60" height="10" rx="5" fill="#2563EB" opacity=".6" />
                <rect x="40" y="80" width="40" height="10" rx="5" fill="#2563EB" opacity=".4" />
                <path d="M112 124L144 92" stroke="#3a589aff" strokeWidth="10" strokeLinecap="round"/>
                <rect x="104" y="116" width="40" height="28" rx="8" fill="#DBEAFE" />
              </svg>
            </div>

            {/* zona de drop (overlay) */}
            <FileUpload
              onFileAccepted={setSelectedFile}
              accept="application/pdf"
              disabled={isLoading}
              variant="light-overlay"  /* folosește overlay-ul cardului alb */
              inputId="file-input-hidden"
            />
          </div>

          {/* Dacă s-a ales un fișier, afișează bara de acțiuni ca Adobe */}
          {selectedFile && (
            <div className="file-bar">
              <div className="file-info">
                <span className="file-icon" aria-hidden>📄</span>
                <div>
                  <div className="file-name">{selectedFile.name}</div>
                  <div className="file-size">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              <div className="file-actions">
                <button
                  className="btn-primary"
                  onClick={handleAnalyze}
                  disabled={isLoading}
                >
                  {isLoading ? "Se procesează…" : "Analizează"}
                </button>
                <button className="btn-ghost" onClick={handleReset} disabled={isLoading}>
                  Anulează
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
