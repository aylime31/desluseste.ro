'use client';

import { useState } from 'react';
import type { ChangeEvent } from 'react';
import type { AnalysisResponse, IssueItem } from '../types';
import { FileUpload } from '@/components/FileUpload'; // Asigură-te că importul este corect
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  // --- STATE MANAGEMENT (Neschimbat) ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- HANDLERS (Neschimbat) ---
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
      setError(err.message || 'A apărut o eroare la analiză. Încearcă din nou.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- FUNCȚII HELPER PENTRU STILIZARE (Neschimbat) ---
  const getAttentionColor = (level: string = 'Scăzut'): string => {
    switch (level) {
      case 'Ridicat': return 'bg-red-500';
      case 'Mediu': return 'bg-yellow-400';
      case 'Scăzut': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  const getCategoryBadgeVariant = (category: string = ''): "destructive" | "secondary" | "outline" | "default" => {
    if (category.includes('Financiare')) return 'destructive';
    if (category.includes('Date')) return 'secondary';
    if (category.includes('Costuri')) return 'outline';
    return 'default';
  };

  // --- JSX (INTERFAȚA VIZUALĂ - ACTUALIZATĂ CU NOUL DESIGN) ---
  return (
    <div className="bg-[#f8f9fb] text-[#333] flex flex-col items-center justify-start min-h-screen p-10 font-sans">
      
      <header className="text-center mb-10">
        <img src="/logo.png" alt="Desluseste.ro logo" className="w-[90px] h-auto mx-auto mb-2.5" />
        <h1 className="text-2xl text-[#1e4fa3] font-semibold">
          desluseste.ro
        </h1>
      </header>

      <main className="bg-white w-full max-w-2xl p-10 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] text-center">
        
        {/* Afișare condiționată: ori upload, ori eroare, ori rezultate */}

        {error && (
          <div className="animate-fade-in text-center">
            <Alert variant="destructive">
              <AlertTitle>Eroare</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => window.location.reload()} className="mt-4 bg-[#2563eb] hover:bg-[#1e40af]">
              Încearcă din nou
            </Button>
          </div>
        )}

        {analysisResult && (
          <div className="space-y-6 animate-fade-in text-left">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#1d4ed8]">Rezultatul Analizei</h2>
              <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
                Analizează alt document
              </Button>
            </div>
            <div className="p-4 bg-slate-50 border-l-4 border-[#2563eb] rounded-lg">
              <h3 className="font-bold text-lg text-[#2563eb] mb-2">Pe scurt</h3>
              <p className="text-slate-700">{analysisResult.rezumat_executiv}</p>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-[#2563eb]">Puncte de atenție</h3>
              {analysisResult.probleme_identificate?.length === 0 ? (
                <div className="p-4 rounded-lg bg-green-50 text-green-700">Nicio problemă semnificativă detectată!</div>
              ) : (
                analysisResult.probleme_identificate?.map((item, index) => (
                  <div key={index} className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between mb-2 gap-2">
                      <h4 className="font-semibold text-slate-800">{item.titlu_problema}</h4>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant={getCategoryBadgeVariant(item.categorie_problema)}>{item.categorie_problema}</Badge>
                        <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${getAttentionColor(item.nivel_atentie)}`}>{item.nivel_atentie}</span>
                      </div>
                    </div>
                    <blockquote className="border-l-2 border-slate-300 pl-3 italic text-slate-500 text-sm my-2">"{item.clauza_originala}"</blockquote>
                    <p className="text-slate-700 text-sm">{item.explicatie_simpla}</p>
                    <p className="text-blue-600 mt-2 font-medium text-sm">👉 Sugestie: {item.sugestie}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Secțiunea de Upload - afișată doar dacă nu avem rezultate sau erori */}
        {!analysisResult && !error && (
            <div className="animate-fade-in">
                <h2 className="text-[#2058c2] text-xl font-bold mb-2.5">
                    Transformăm contracte complexe în limbaj simplu.
                </h2>
                <p className="text-base text-[#555] mb-6">
                    Încarcă documentul tău legal în format PDF pentru o analiză clară a clauzelor, obligațiilor și riscurilor.
                </p>
                
                <FileUpload onFileAccepted={handleFileAccepted} disabled={isLoading} />
                
                {selectedFile && (
                    <p className="text-sm text-slate-500 mt-4">
                        Fișier selectat: <span className="font-medium text-slate-700">{selectedFile.name}</span>
                    </p>
                )}

                <Button
                    onClick={handleAnalyze}
                    disabled={!selectedFile || isLoading}
                    size="lg"
                    className="w-full text-lg mt-4 bg-[#2563eb] hover:bg-[#1e40af] text-white font-semibold disabled:bg-slate-300"
                >
                    {isLoading ? 'Se analizează...' : 'Analizează Documentul'}
                </Button>
            </div>
        )}

      </main>

      <footer className="mt-16 text-sm text-[#777]">
        &copy; 2025 desluseste.ro. Toate drepturile rezervate.
      </footer>
    </div>
  );
}