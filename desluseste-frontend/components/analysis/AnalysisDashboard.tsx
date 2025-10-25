"use client";

import { useMemo, useState } from "react";
import { SiteHeader } from "../layout/SiteHeader";
import { SiteFooter } from "../layout/SiteFooter";
import { HighlightedText } from "./HighlightedText";
import { ProblemsList } from "./ProblemList";

type Nivel = "Scăzut" | "Mediu" | "Ridicat";

type Problem = {
  titlu?: string;
  categorie?: string;
  clauza_originala?: string;
  excerpt?: string;
  fragment?: string;
  nivel_atentie?: Nivel;
  recomandare?: string;
};

export function AnalysisDashboard({
  result,
  onReset,
}: {
  result: {
    text_original: string;
    rezumat_executiv?: string;
    probleme_identificate: Problem[];
  };
  onReset: () => void;
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const problems: Problem[] = useMemo(
    () => result?.probleme_identificate ?? [],
    [result]
  );

  const summary = useMemo(() => {
    // scurtăm puțin textul de rezumat, să rămână ușor de parcurs
    const s = result.rezumat_executiv || "";
    return s.length > 650 ? s.slice(0, 650) + "…" : s;
  }, [result]);

  return (
    <div className="min-h-screen bg-app">
      <SiteHeader onReset={() => { setActiveIdx(null); onReset(); }} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* CARD 1 — Text analizat (highlight) */}
        <section className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Text analizat</h2>
            <button
              onClick={() => { setActiveIdx(null); onReset(); }}
              className="btn-ghost"
              title="Încărcă alt PDF"
            >
              Încarcă alt PDF
            </button>
          </div>

          <p className="text-sm text-slate-500 mb-4">
            Am subliniat direct în text fragmentele relevante. Selectează o
            problemă din lista de mai jos pentru a vedea exact pasajul.
          </p>

          <div className="rounded-xl border border-slate-200 p-4 max-h-[60vh] overflow-y-auto">
            <HighlightedText
              text={result.text_original}
              problems={problems}
              activeIndex={activeIdx}
            />
          </div>
        </section>

        {/* CARD 2 — Rezumat */}
        <section className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Rezumat</h2>
          {summary ? (
            <p className="text-slate-800 leading-relaxed">{summary}</p>
          ) : (
            <p className="text-slate-500">Nu a fost generat un rezumat.</p>
          )}
        </section>

        {/* CARD 3 — Probleme identificate */}
        <section className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Probleme identificate{" "}
              <span className="text-slate-400 font-normal">
                ({problems.length})
              </span>
            </h2>
          </div>

          <ProblemsList
            problems={problems}
            activeIndex={activeIdx}
            onSelect={(idx) => setActiveIdx(idx)}
          />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
