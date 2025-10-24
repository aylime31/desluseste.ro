'use client';

import { useState } from 'react';
import type { ChangeEvent } from 'react';
import Image from 'next/image'; // Importăm componenta optimizată pentru imagini
import type { AnalysisResponse } from '../types';
import { FileUpload } from '@/components/ui/FileUpload';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  // --- STATE & HANDLERS (Rămân neschimbate) ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileAccepted = (file: File) => {
    setSelectedFile(file);
    setAnalysisResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const response = await fetch('https://desluseste-ro.onrender.com/analizeaza-pdf/', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Eroare de server (${response.status}): ${text.slice(0, 150)}`);
      }
      const data: AnalysisResponse = await response.json();
      setAnalysisResult(data);
    } catch (err: any) {
      setError(err.message || 'A apărut o eroare la analiză.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAttentionColor = (level: string = 'Scăzut'): string => {
    switch (level) {
      case 'Ridicat': return 'bg-red-600';
      case 'Mediu': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };
  const getCategoryBadgeVariant = (category: string = ''): "destructive" | "secondary" | "outline" | "default" => {
    if (category.includes('Severe') || category.includes('Financiare')) return 'destructive';
    if (category.includes('Date')) return 'secondary';
    return 'default';
  };

  // --- JSX (NOUA INTERFAȚĂ VIZUALĂ) ---
  return (
    <div className="bg-slate-900 text-slate-100 min-h-screen flex flex-col">
      {/* ===== HEADER NOU ===== */}
      <header className="w-full max-w-6xl mx-auto p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Desluseste.ro Logo" width={40} height={40} />
          <span className="font-semibold text-xl">Deslușește.ro</span>
        </div>
        <div className="flex items-center gap-2 border border-slate-700 rounded-full p-1">
            <Button variant="secondary" size="sm" className="rounded-full bg-slate-700">Romanian</Button>
            <Button variant="ghost" size="sm" className="rounded-full">English</Button>
        </div>
      </header>

      {/* ===== CONȚINUT PRINCIPAL ===== */}
      <main className="flex-grow flex flex-col items-center justify-center p-4 text-center">
        <div className="w-full max-w-3xl space-y-8">

          {/* Afișare condiționată: ori upload, ori eroare, ori rezultate */}
          
          {error && (
            <div className="animate-fade-in text-center">
              <Alert variant="destructive">{/* ... codul pentru eroare ... */}</Alert>
              <Button onClick={() => window.location.reload()} className="mt-4">Încearcă din nou</Button>
            </div>
          )}

          {analysisResult && (
            <div className="animate-fade-in space-y-6 text-left">{/* ... codul pentru afișarea rezultatelor (neschimbat) ... */}</div>
          )}

          {/* Secțiunea de Upload - afișată doar la început */}
          {!analysisResult && !error && (
            <div className="text-center space-y-6 animate-fade-in">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
                Transformăm <span className="text-yellow-400">contracte complexe</span><br /> în limbaj simplu.
              </h1>
              <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
                Încarcă documentul tău legal pentru a obține o analiză clară a clauzelor, a obligațiilor și a potențialelor riscuri.
              </p>
              <div className="w-full max-w-lg mx-auto pt-4 space-y-4">
                <FileUpload onFileAccepted={handleFileAccepted} disabled={isLoading} />
                {selectedFile && !isLoading && (
                  <p className="text-sm text-slate-400">Fișier selectat: <span className="font-medium text-slate-200">{selectedFile.name}</span></p>
                )}
                <Button onClick={handleAnalyze} disabled={!selectedFile || isLoading} size="lg" className="w-full text-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                  {isLoading ? 'Se analizează...' : 'Analizează Documentul'}
                </Button>
              </div>
            </div>
          )}

        </div>
      </main>

       {/* ===== FOOTER NOU ===== */}
      <footer className="w-full text-center p-4 text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} Desluseste.ro. Construit cu pasiune.</p>
      </footer>
    </div>
  );
}