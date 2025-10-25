"use client";

import { useState } from "react";
import { SiteHeader } from "../layout/SiteHeader";
import { SiteFooter } from "../layout/SiteFooter";
import { ProblemsPane } from "./ProblemsPane";
import { RiskHeatmap } from "./RiskHeatMap";
import { ExecutiveSummary } from "./ExecutiveSummary";

export function AnalysisDashboard({
  result,
  onReset,
}: {
  result: any;
  onReset: () => void;
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // funcție helper pentru highlight
  const highlightRisks = (text: string, problems: any[]) => {
    let highlighted = text;
    problems.forEach((p) => {
      if (!p.text) return;
      const safeText = p.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // escape regex
      const regex = new RegExp(safeText, "gi");
      highlighted = highlighted.replace(
        regex,
        `<mark class="bg-yellow-200 px-1 rounded-sm">${p.text}</mark>`
      );
    });
    return highlighted;
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] font-[Comfortaa] text-slate-800">
      <SiteHeader onReset={onReset} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* ============ PDF / TEXT + Highlight ============ */}
        <section className="bg-white shadow-md rounded-2xl border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">
            Text analizat
          </h2>
          <div
            className="text-[15px] leading-relaxed text-slate-800 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{
              __html: highlightRisks(result.text_original, result.probleme_identificate),
            }}
          />
        </section>

        {/* ============ Rezumat ============ */}
        <section className="bg-white shadow-md rounded-2xl border border-slate-100 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-700 mb-2">
              💬 Rezumat executiv
            </h2>
            <p className="text-[15px] text-slate-700 leading-relaxed">
              {result.rezumat_executiv}
            </p>
          </div>

          {/* Probleme identificate */}
          <div>
            <h2 className="text-lg font-semibold text-slate-700 mb-4">
              ⚠️ Probleme identificate ({result.probleme_identificate.length})
            </h2>
            <ProblemsPane
              count={result.probleme_identificate.length}
              problems={result.probleme_identificate}
              onSelect={(i) => setActiveIdx(i)}
            />
          </div>

          {/* Distribuția riscurilor */}
          <div>
            <h2 className="text-lg font-semibold text-slate-700 mb-3">
              📊 Distribuția riscurilor
            </h2>
            <RiskHeatmap probleme={result.probleme_identificate} />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
