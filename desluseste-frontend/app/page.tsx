'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { AnalysisResponse } from '../types';
import { FileUpload } from '@/components/ui/FileUpload'; // Importăm noua componentă de upload

export default function HomePage() {
  // --- STATE MANAGEMENT ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- HANDLERS ---
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
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.detail || 'A apărut o eroare la server.');
        } catch {
          throw new Error(`Eroare de server (${response.status}): ${errorText.slice(0, 100)}`);
        }
      }
      const data: AnalysisResponse = await response.json();
      setAnalysisResult(data);
    } catch (err: any) {
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setError('Eroare de rețea sau CORS. Asigură-te că serverul backend este activ și configurat corect.');
      } else {
        setError(err.message || 'Nu s-a putut conecta la serverul de analiză.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- FUNCȚII HELPER PENTRU STILIZARE ---
  const getAttentionColor = (level: string = 'Scăzut'): string => {
    switch (level) {
      case 'Ridicat': return 'bg-red-600';
      case 'Mediu': return 'bg-yellow-500';
      case 'Scăzut': return 'bg-green-600';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryBadgeVariant = (category: string = ''): "destructive" | "secondary" | "outline" | "default" => {
    if (category.includes('Severe') || category.includes('Financiare')) return 'destructive';
    if (category.includes('Date') || category.includes('Datelor')) return 'secondary';
    if (category.includes('Costuri')) return 'outline';
    return 'default';
  };
  
  // --- JSX (INTERFAȚA VIZUALĂ) ---
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-slate-100 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-3xl space-y-8">
        {/* --- NOUA SECȚIUNE DE UPLOAD --- */}
        {!analysisResult && !error && (
          <div className="text-center space-y-6 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Transformăm <span className="text-yellow-400">contracte complexe</span> în limbaj simplu.
            </h1>
            <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
              Încarcă documentul tău legal în format PDF pentru a obține o analiză clară și concisă a clauzelor importante, a obligațiilor și a potențialelor riscuri.
            </p>
            <div className="w-full max-w-lg mx-auto pt-4 space-y-4">
              <FileUpload onFileAccepted={handleFileAccepted} disabled={isLoading} />
              {selectedFile && !isLoading && (
                <div className="text-center text-slate-400">
                  Fișier selectat: <span className="font-medium text-slate-200">{selectedFile.name}</span>
                </div>
              )}
              <Button onClick={handleAnalyze} disabled={!selectedFile || isLoading} size="lg" className="w-full text-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:bg-slate-700 disabled:text-slate-400">
                {isLoading ? 'Se analizează...' : 'Analizează Documentul'}
              </Button>
            </div>
          </div>
        )}

        {/* --- SECȚIUNEA DE REZULTATE (afișată după analiză) --- */}
        {error && (
          <div className="animate-fade-in text-center">
            <Alert variant="destructive">
              <AlertTitle>Eroare</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => window.location.reload()} className="mt-4">Încearcă din nou</Button>
          </div>
        )}

        {analysisResult && (
          <div className="animate-fade-in space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold">Rezultatul Analizei</h2>
                <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 text-slate-300 border-slate-600 hover:bg-slate-800 hover:text-white">Analizează alt document</Button>
            </div>
            {/* Rezumatul Executiv */}
            <div className="p-4 bg-slate-800 border-l-4 border-blue-500 rounded-r-lg">
              <h3 className="font-bold text-lg mb-2 text-white">Pe Scurt</h3>
              <p className="text-slate-300">{analysisResult.rezumat_executiv}</p>
            </div>

            {/* Problemele Identificate */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-white">Puncte de Atenție</h3>
              {analysisResult.probleme_identificate?.length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-800 text-slate-300">Felicitări! Nu am identificat puncte de atenție semnificative.</div>
              ) : (
                analysisResult.probleme_identificate?.map((item, index) => {
                  if (!item || typeof item.categorie_problema === 'undefined') return null;
                  return (
                    <div key={index} className="border border-slate-700 p-4 rounded-lg bg-slate-800 shadow-md">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-2">
                        <h4 className="font-semibold text-base sm:text-lg text-white">{item.titlu_problema}</h4>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                           <Badge variant={getCategoryBadgeVariant(item.categorie_problema)}>{item.categorie_problema}</Badge>
                           <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${getAttentionColor(item.nivel_atentie)}`}>{item.nivel_atentie}</span>
                        </div>
                      </div>
                      <blockquote className="border-l-2 border-slate-600 pl-3 my-2 text-xs text-slate-400 italic">
                        "{item.clauza_originala}"
                      </blockquote>
                      <p className="text-sm text-slate-300 mt-2">{item.explicatie_simpla}</p>
                      <p className="text-sm text-blue-400 mt-3 font-medium">👉 Sugestie: {item.sugestie}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="absolute bottom-4 text-center text-slate-500 text-sm">
        <p>© 2025 Desluseste.ro</p>
      </footer>
    </main>
  );
}