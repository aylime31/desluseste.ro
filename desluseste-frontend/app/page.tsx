"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { analizeazaPdf } from "@/lib/api";
import { normalizeAnalysis, type NormalizedAnalysisResponse } from "@/lib/schemas";
import FileUpload from "@/components/ui/FileUpload";

const AnalysisDashboard = dynamic(
  () => import("@/components/analysis/AnalysisDashboard").then((m) => m.AnalysisDashboard),
  { ssr: false }
);

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<NormalizedAnalysisResponse | null>(null);

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    try {
      const raw = await analizeazaPdf(selectedFile);
      setResult(normalizeAnalysis(raw));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "A apărut o eroare la analiză.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedFile]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setResult(null);
    try {
      if (window.location.hash) history.replaceState(null, "", window.location.pathname);
    } catch {}
  }, []);

  // După analiză -> dashboard
  if (result) {
    return <AnalysisDashboard result={result} onReset={handleReset} />;
  }

  // Landing minimal: header + card alb (clic & drag/drop)
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* header simplu, doar logo */}
      <header className="hero-blue">
  <div className="header-container">
    <div className="logo-wrapper">
      <img
        src="/logo.png"
        alt="Deslușește logo"
        className="site-logo"
      />
      <span className="site-title">DESLUȘEȘTE.RO</span>
    </div>
  </div>
</header>

     


      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="upload-wrap">
          {/* CARD alb: clic oriunde => alege fișier; suport drag&drop direct pe card */}
          <div
            className={`dz2-card ${dragging ? "is-hover" : ""}`}
            role="button"
            aria-label="Încarcă PDF"
            onClick={(e) => {
              // nu declanșa click dublu când lovești butonul
              const t = e.target as HTMLElement;
              if (t.closest(".btn-primary")) return;
              document.getElementById("file-input-hidden")?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) setSelectedFile(f);
            }}
          >
            {/* Stânga: text + buton */}
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

            {/* Dreapta: pictogramă */}
            <div className="dz2-right" aria-hidden>
              <svg viewBox="0 0 160 160" width="160" height="160" fill="none">
                <rect x="28" y="12" width="84" height="112" rx="8" fill="#E7F0FF" />
                <rect x="40" y="44" width="60" height="10" rx="5" fill="#2563EB" opacity=".8" />
                <rect x="40" y="62" width="60" height="10" rx="5" fill="#2563EB" opacity=".6" />
                <rect x="40" y="80" width="40" height="10" rx="5" fill="#2563EB" opacity=".4" />
                <path d="M112 124L144 92" stroke="#2563EB" strokeWidth="10" strokeLinecap="round" />
                <rect x="104" y="116" width="40" height="28" rx="8" fill="#DBEAFE" />
              </svg>
            </div>
          </div>

          {/* input-ul ascuns controlat de buton/card */}
          <FileUpload
            onFileAccepted={setSelectedFile}
            accept="application/pdf"
            disabled={isLoading}
            inputId="file-input-hidden"
          />

          {/* După selectare fișier: bară acțiuni */}
          {selectedFile && (
            <div className="file-bar">
              <div className="file-info">
                <span className="file-icon" aria-hidden>
                  📄
                </span>
                <div>
                  <div className="file-name">{selectedFile.name}</div>
                  <div className="file-size">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              <div className="file-actions">
                <button className="btn-primary" onClick={handleAnalyze} disabled={isLoading}>
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
