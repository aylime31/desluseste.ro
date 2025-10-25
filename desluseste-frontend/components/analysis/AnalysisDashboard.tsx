"use client";

import { useMemo, useState } from "react";
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
    <div className="min-h-screen bg-[#f9fafb] font-[Comfortaa] text-slate-800 flex flex-col">
      {/* HEADER */}
      <SiteHeader onReset={() => { setActiveIdx(null); onReset(); }} />

      {/* CONȚINUT */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* --- Secțiunea 1: Rezumat și heatmap --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white shadow-md rounded-2xl p-6 border border-slate-100">
            <ExecutiveSummary summary={result.rezumat_executiv} levels={levels} />
          </div>

          <div className="lg:col-span-2 bg-white shadow-md rounded-2xl p-6 border border-slate-100">
            <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wide">
              Distribuția riscurilor
            </h3>
            <RiskHeatmap probleme={result.probleme_identificate} />
          </div>
        </div>

        {/* --- Secțiunea 2: Probleme + Document --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow-md rounded-2xl p-6 border border-slate-100">
            <ProblemsPane
              count={result.probleme_identificate.length}
              problems={result.probleme_identificate}
              onSelect={(i) => setActiveIdx(i)}
            />
          </div>

          <div className="bg-white shadow-md rounded-2xl p-6 border border-slate-100">
            <DocumentPane
              rawText={result.text_original}
              problems={result.probleme_identificate}
              activeIndex={activeIdx}
            />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
