"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";

import FileUpload from "@/components/ui/FileUpload";
import { analizeazaPdf } from "@/lib/api";
import { normalizeAnalysis, type NormalizedAnalysisResponse } from "@/lib/schemas";

// Dashboard-ul se încarcă doar după analiză
const AnalysisDashboard = dynamic(
  () => import("@/components/analysis/AnalysisDashboard").then(m => m.AnalysisDashboard),
  { ssr: false }
);

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<NormalizedAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const liveRef = useRef<HTMLDivElement | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile || isLoading) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const raw = await analizeazaPdf(selectedFile);
      const normalized = normalizeAnalysis(raw);
      setResult(normalized);

      // focus a11y când apare rezultatul
      requestAnimationFrame(() => liveRef.current?.focus());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "A apărut o eroare la analiză.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile, isLoading]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
  }, []);

  // După ce avem rezultat → afișăm dashboard-ul
  if (result) {
    return <AnalysisDashboard result={result} onReset={handleReset} />;
  }

  return (
    <>
      {/* HEADER cu logo */}
      <header className="hero-blue">
        <div className="header-container">
          <Image
            src="/logo.png"
            alt="Deslușește.ro"
            width={160}
            height={40}
            className="site-logo"
            priority
          />
        </div>
      </header>

      {/* CONȚINUT */}
      <main className="upload-wrap">
        {/* zonă live pentru a11y */}
        <div ref={liveRef} tabIndex={-1} aria-live="polite" className="sr-only" />

        <div className="dz2-card">
          {/* input real ascuns; label-ul de mai jos îl declanșează */}
          <div style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
            <FileUpload
              onFileAccepted={setSelectedFile}
              accept="application/pdf"
              disabled={isLoading}
              inputId="file-input-hidden"
            />
          </div>

          <div className="dz2-left">
            <h1 className="dz2-h1">Încarcă un PDF :)</h1>
            <p className="dz2-sub">Trage un fișier aici sau alege de pe dispozitiv.</p>

            <div className="dz2-actions">
              <label htmlFor="file-input-hidden" className="btn-primary" style={{ cursor: "pointer" }}>
                Selectează un fișier
              </label>
            </div>
          </div>

          <div className="dz2-right" aria-hidden>
            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" fill="none" viewBox="0 0 120 120">
              <rect x="30" y="30" width="60" height="70" rx="6" fill="#e8efff" />
              <rect x="40" y="50" width="40" height="6" rx="3" fill="#2563eb" />
              <rect x="40" y="62" width="40" height="6" rx="3" fill="#2563eb" />
              <rect x="40" y="74" width="24" height="6" rx="3" fill="#2563eb" />
              <path d="M80 95l8-8" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Bară fișier sub card */}
        {selectedFile && (
          <div className="file-bar-container" style={{ maxWidth: 860, width: "100%" }}>
            <div className="file-bar">
              <div className="file-info">
                <span className="file-icon" aria-hidden>📄</span>
                <div>
                  <div className="file-name">{selectedFile.name}</div>
                  <div className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>

              <div className="file-actions">
                <button className="btn-primary" onClick={handleAnalyze} disabled={isLoading}>
                  {isLoading ? "Se procesează…" : "Analizează"}
                </button>
                <button className="btn-ghost" onClick={() => setSelectedFile(null)} disabled={isLoading}>
                  Anulează
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Eroare vizibilă */}
        {error && (
          <div className="file-bar-container" aria-live="assertive" style={{ maxWidth: 860, width: "100%" }}>
            <div className="file-bar" style={{ borderColor: "#ef4444" }}>
              <div className="file-name" style={{ color: "#b91c1c" }}>{error}</div>
              <button className="btn-ghost" onClick={() => setError(null)}>Închide</button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
