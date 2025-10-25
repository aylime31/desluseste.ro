"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

/**
 * Cardul care gestionează uploadul, afișarea fișierului și butoanele de analiză.
 * Primește un render-prop `Upload` care creează efectiv zona de încărcare.
 */
export function UploadCard({
  selectedFile,
  isLoading,
  onAnalyze,
  onClear,
  Upload,
}: {
  selectedFile: File | null;
  isLoading: boolean;
  onAnalyze: () => void;
  onClear: () => void;
  Upload: (props: { disabled: boolean }) => React.ReactNode;
}) {
  const titleId = useId();

  return (
   <section aria-labelledby={titleId} className="rounded-3xl">
  <h2 id={titleId} className="sr-only">Încarcă document</h2>

  {/* dropzone */}
  <Upload disabled={isLoading} />

      {/* fișier selectat */}
      {selectedFile && (
        <div className="mt-6 p-4 bg-slate-800/50 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate text-slate-200">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-400">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              onClick={onAnalyze}
              disabled={isLoading}
              className="btn-gradient px-6 focus-ring"
            >
              {isLoading ? "Se procesează…" : "Analizează"}
            </Button>
            <Button
              onClick={onClear}
              variant="ghost"
              className="text-slate-300 hover:bg-slate-800 focus-ring"
            >
              Anulează
            </Button>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-muted">
        Sfat: poți <kbd className="px-1 bg-slate-800/60 rounded">Ctrl+V</kbd>{" "}
        un PDF din clipboard sau trage fișierul în zonă.
      </p>
    </section>
  );
}
