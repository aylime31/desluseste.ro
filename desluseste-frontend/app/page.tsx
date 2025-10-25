"use client";

import Image from "next/image";
import { useState } from "react";
import FileUpload from "@/components/ui/FileUpload";

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // TODO: conectează “Analizează” la fluxul tău real de analiză (analizeazaPdf + setIsLoading etc.)
  const handleAnalyze = async () => {
    if (!selectedFile || isLoading) return;
    // setIsLoading(true);
    // try { ... } finally { setIsLoading(false); }
  };

  return (
    <>
      {/* HEADER cu doar logo */}
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

      {/* CONȚINUT PRINCIPAL */}
      <main className="upload-wrap">
        <div className="dz2-card">
          {/* Ținem FileUpload activ pentru input & drag-drop, dar îl ascundem vizual.
              Butonul vizibil de mai jos (label) deschide dialogul prin htmlFor. */}
          <div style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
            <FileUpload
              onFileAccepted={setSelectedFile}
              accept="application/pdf"
              disabled={isLoading}
              inputId="file-input-hidden"
            />
          </div>

          <div className="dz2-left">
            <h1 className="dz2-h1">Încarcă PDF :) </h1>
            <p className="dz2-sub">Trage un fișier aici sau alege de pe dispozitiv.</p>

            <div className="dz2-actions">
              {/* Butonul vizibil care deschide input-ul ascuns din FileUpload */}
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

        {/* Afișează fișierul sub card, nu în dreapta */}
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
      </main>
    </>
  );
}
