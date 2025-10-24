"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { RiskHeatmap } from "./RiskHeatMap";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { ProblemsPane } from "./ProblemsPane";
import { DocumentPane } from "./DocumentPane";
import { SiteHeader } from "../layout/SiteHeader";
import { SiteFooter } from "../layout/SiteFooter";

export function AnalysisDashboard({
  result,
  onReset,
}: {
  result: any;
  onReset: () => void;
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const levels = useMemo(
    () => result?.probleme_identificate.map((p: any) => p.nivel_atentie) ?? [],
    [result]
  );

  return (
    <div className="min-h-screen bg-app">
      <SiteHeader onReset={() => { setActiveIdx(null); onReset(); }} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" aria-live="polite">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <ExecutiveSummary summary={result.rezumat_executiv} levels={levels} />
          <div className="lg:col-span-2 card-tight">
            <h3 className="text-sm font-medium text-muted mb-4">Distribuția riscurilor</h3>
            <RiskHeatmap probleme={result.probleme_identificate} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProblemsPane
            count={result.probleme_identificate.length}
            problems={result.probleme_identificate}
            onSelect={(i) => setActiveIdx(i)}
          />
          <DocumentPane
            rawText={result.text_original}
            problems={result.probleme_identificate}
            activeIndex={activeIdx}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
