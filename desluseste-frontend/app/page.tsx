'use client';

import { useState, ChangeEvent } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { AnalysisResponse } from '../types';

export default function HomePage() {
  // --- STATE MANAGEMENT ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- HANDLERS ---
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setAnalysisResult(null);
      setError(null);
    }
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

      // Verificăm dacă răspunsul este OK. Dacă nu, încercăm să parsăm eroarea.
      if (!response.ok) {
        // Încercăm să citim răspunsul ca text mai întâi, pentru a evita erori de parsare JSON pe erori HTML
        const errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.detail || 'A apărut o eroare la server.');
        } catch {
          // Dacă răspunsul nu e JSON, afișăm eroarea ca text
          throw new Error(`Eroare de server (${response.status}): ${errorText.slice(0, 100)}`);
        }
      }

      const data: AnalysisResponse = await response.json();
      setAnalysisResult(data);
    } catch (err: any) {
      // Afișăm un mesaj de eroare mai specific pentru CORS sau probleme de rețea
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
    <main className="flex min-h-screen flex-col items-center bg-gray-50 p-4 md:p-8">
      <div className="w-full max-w-3xl space-y-6">
        {/* Cardul de Upload */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold tracking-tight">Desluseste.ro</CardTitle>
            <CardDescription>Încarcă un contract sau document PDF și află ce se ascunde în spatele limbajului complicat.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-2">
              <Input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileChange} />
              <p className="text-xs text-gray-500">Fișierul tău este procesat în siguranță și nu este stocat pe serverele noastre.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAnalyze} disabled={!selectedFile || isLoading} size="lg" className="w-full text-lg">
              {isLoading ? 'Se analizează...' : 'Analizează Documentul'}
            </Button>
          </CardFooter>
        </Card>

        {/* Secțiunea de Rezultate (afișată condiționat) */}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Eroare</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {analysisResult && (
          <Card className="shadow-lg animate-fade-in">
            <CardHeader>
              <CardTitle>Rezultatul Analizei</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Rezumatul Executiv */}
              <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                <h3 className="font-bold text-lg mb-2">Pe Scurt</h3>
                <p className="text-gray-700">{analysisResult.rezumat_executiv}</p>
              </div>

              {/* Problemele Identificate */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Puncte de Atenție</h3>
                {analysisResult.probleme_identificate?.length === 0 ? (
                  <p className="text-gray-600">Felicitări! Nu am identificat puncte de atenție semnificative în acest document.</p>
                ) : (
                  analysisResult.probleme_identificate?.map((item, index) => {
                    // --- VERIFICARE DE SIGURANȚĂ PENTRU A PREVENI ERORILE DE RANDARE ---
                    if (!item || typeof item.categorie_problema === 'undefined') {
                      return null;
                    }
                    return (
                      <div key={index} className="border p-4 rounded-lg shadow-sm bg-white">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-2">
                          <h4 className="font-semibold text-base sm:text-lg">{item.titlu_problema}</h4>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                             <Badge variant={getCategoryBadgeVariant(item.categorie_problema)}>{item.categorie_problema}</Badge>
                             <span className={`px-2 py-1 text-xs font-bold text-white rounded-full ${getAttentionColor(item.nivel_atentie)}`}>{item.nivel_atentie}</span>
                          </div>
                        </div>
                        <blockquote className="border-l-2 pl-3 my-2 text-xs text-gray-500 italic">
                          "{item.clauza_originala}"
                        </blockquote>
                        <p className="text-sm text-gray-800 mt-2">{item.explicatie_simpla}</p>
                        <p className="text-sm text-blue-700 mt-3 font-medium">👉 Sugestie: {item.sugestie}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}