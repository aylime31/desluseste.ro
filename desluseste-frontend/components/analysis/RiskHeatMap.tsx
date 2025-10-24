"use client";
import * as React from "react";
import type { IssueItem } from "@/lib/schemas";

type Props = {
  probleme: IssueItem[];
  /** opțional: ordine de categorii preferată; restul se pun la final în „Altele” */
  categoryOrder?: string[];
  /** opțional: când dai click pe o celulă (cat, nivel) */
  onCellClick?: (opts: { categorie: string; nivel: "Scăzut" | "Mediu" | "Ridicat"; count: number }) => void;
};

const CANON_LEVELS = ["Scăzut", "Mediu", "Ridicat"] as const;
type Nivel = typeof CANON_LEVELS[number];

const CANON_CATS_DEFAULT = [
  "Consecințe Financiare Severe",
  "Ambiguitate Lingvistică",
  "Asimetrie a Obligațiilor",
  "Referințe la Costuri Suplimentare",
  "Procesarea Datelor",
];

const norm = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim();

/** mapă tolerantă la text stricat/diacritice */
function normalizeLevel(s: string): Nivel {
  const t = norm(s);
  if (/ridicat|high|mare|inalt/.test(t)) return "Ridicat";
  if (/mediu|medium|mijlociu/.test(t)) return "Mediu";
  return "Scăzut";
}

export function RiskHeatmap({ probleme, categoryOrder = CANON_CATS_DEFAULT, onCellClick }: Props) {
  // 1) Grupare categorii (tolerantă). Orice necunoscut → „Altele”.
  const { categories, grid, rowTotals, colTotals, maxCount } = React.useMemo(() => {
    const prefer = new Set(categoryOrder);
    const grid: Record<string, Record<Nivel, number>> = {};
    const seenCats = new Set<string>();

    // pregătește întâi preferatele
    categoryOrder.forEach((c) => {
      grid[c] = { Scăzut: 0, Mediu: 0, Ridicat: 0 };
      seenCats.add(c);
    });

    const otherKey = "Altele";
    grid[otherKey] = { Scăzut: 0, Mediu: 0, Ridicat: 0 };

    for (const p of probleme) {
      const rawCat = (p.categorie_problema || "").trim();
      const cat = prefer.has(rawCat) ? rawCat : rawCat ? rawCat : otherKey;
      const bucket = prefer.has(rawCat) ? rawCat : (!rawCat ? otherKey : (grid[rawCat] ? rawCat : otherKey));
      if (!grid[bucket]) grid[bucket] = { Scăzut: 0, Mediu: 0, Ridicat: 0 };

      const lvl = normalizeLevel(String(p.nivel_atentie));
      grid[bucket][lvl] = (grid[bucket][lvl] ?? 0) + 1;
      if (bucket !== otherKey) seenCats.add(bucket);
    }

    // adaugă toate categoriile reale care nu-s în preferințe (dar au apărut)
    Object.keys(grid).forEach((c) => seenCats.add(c));
    const categories = [
      ...categoryOrder.filter((c) => seenCats.has(c)),
      ...Array.from(seenCats).filter((c) => !categoryOrder.includes(c) && c !== otherKey),
      otherKey,
    ].filter((c, i, arr) => arr.indexOf(c) === i); // uniq stabil

    // Totale și max global pentru scală
    const rowTotals: Record<string, number> = {};
    const colTotals: Record<Nivel, number> = { Scăzut: 0, Mediu: 0, Ridicat: 0 };
    let maxCount = 0;

    categories.forEach((c) => {
      rowTotals[c] = 0;
      CANON_LEVELS.forEach((l) => {
        const val = grid[c]?.[l] ?? 0;
        rowTotals[c] += val;
        colTotals[l] += val;
        if (val > maxCount) maxCount = val;
      });
    });

    return { categories, grid, rowTotals, colTotals, maxCount };
  }, [probleme, categoryOrder]);

  // 2) Culoare scalată pe quantile (0, 1, 2, 3) ca să nu “ardă” harta când ai outliers
  const quantize = (count: number, max: number) => {
    if (count <= 0 || max <= 0) return 0;
    const q = count / max;
    if (q >= 0.75) return 3;
    if (q >= 0.5) return 2;
    if (q >= 0.25) return 1;
    return 0;
  };

  const cellClass = (lvl: Nivel, bin: number): string => {
    // folosim culoare după nivel, intensitate după bin
    const base =
      lvl === "Ridicat"
        ? ["bg-red-500/20 border-red-500/30", "bg-red-500/35 border-red-500/50", "bg-red-500/55 border-red-500/70", "bg-red-500/70 border-red-500/80"]
        : lvl === "Mediu"
        ? ["bg-amber-500/20 border-amber-500/30", "bg-amber-500/35 border-amber-500/50", "bg-amber-500/55 border-amber-500/70", "bg-amber-500/70 border-amber-500/80"]
        : ["bg-emerald-500/20 border-emerald-500/30", "bg-emerald-500/35 border-emerald-500/50", "bg-emerald-500/55 border-emerald-500/70", "bg-emerald-500/70 border-emerald-500/80"];
    return base[bin] ?? "bg-slate-800/50 border-slate-700/50";
  };

  const shortCat = (cat: string) => {
    if (/Financiare/i.test(cat)) return "Financiare";
    if (/Ambiguitate/i.test(cat)) return "Ambiguitate";
    if (/Asimetrie/i.test(cat)) return "Asimetrie";
    if (/Costuri/i.test(cat)) return "Costuri";
    if (/Date/i.test(cat)) return "Date";
    return cat;
  };

  return (
    <div className="w-full overflow-x-auto">
      {/* Legendă compactă */}
      <div className="mb-2 flex items-center gap-3 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1">
          <i className="inline-block w-3 h-3 rounded bg-emerald-500/55" /> Scăzut
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="inline-block w-3 h-3 rounded bg-amber-500/55" /> Mediu
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="inline-block w-3 h-3 rounded bg-red-500/55" /> Ridicat
        </span>
        <span className="ml-auto">Max per celulă: <strong className="text-slate-300">{maxCount}</strong></span>
      </div>

      <div role="table" aria-label="Harta de căldură a riscurilor" className="min-w-[560px]">
        <div role="row" className="grid grid-cols-[auto_repeat(3,1fr)_auto] gap-3 text-xs items-end">
          <div role="columnheader" />
          {CANON_LEVELS.map((l) => (
            <div key={l} role="columnheader" className="text-center font-semibold text-slate-300">{l}</div>
          ))}
          <div role="columnheader" className="text-right font-semibold text-slate-300 pr-1">Total</div>

          {categories.map((cat) => (
            <React.Fragment key={cat}>
              <div role="rowheader" className="py-2 pr-3 text-right font-medium text-slate-300 text-[11px] leading-tight">
                {shortCat(cat)}
              </div>

              {CANON_LEVELS.map((lvl) => {
                const count = grid[cat]?.[lvl] ?? 0;
                const bin = quantize(count, maxCount);
                const cls = count === 0 ? "bg-slate-800/50 border-slate-700/50" : cellClass(lvl, bin);
                const label = `${shortCat(cat)} — ${lvl}: ${count}`;

                return (
                  <button
                    key={`${cat}-${lvl}`}
                    role="cell"
                    aria-label={label}
                    title={label}
                    onClick={() => onCellClick?.({ categorie: cat, nivel: lvl, count })}
                    className={[
                      "h-12 rounded-xl border-2 flex items-center justify-center transition-all",
                      "hover:scale-[1.04] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950",
                      cls,
                    ].join(" ")}
                  >
                    {count > 0 && (
                      <span className="text-lg font-bold text-white drop-shadow-lg tabular-nums">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}

              <div role="cell" className="py-2 text-right pr-1 text-slate-400 tabular-nums">{rowTotals[cat] ?? 0}</div>
            </React.Fragment>
          ))}

          {/* rând total pe niveluri */}
          <div role="rowheader" className="py-2 pr-3 text-right font-semibold text-slate-300 text-[11px] leading-tight">
            Total
          </div>
          {CANON_LEVELS.map((lvl) => (
            <div key={`total-${lvl}`} role="cell" className="h-12 rounded-xl border-2 border-slate-700/50 bg-slate-800/40 flex items-center justify-center text-slate-300 tabular-nums">
              {colTotals[lvl]}
            </div>
          ))}
          <div role="cell" className="py-2 text-right pr-1 text-slate-200 font-semibold tabular-nums">
            {Object.values(rowTotals).reduce((a, b) => a + b, 0)}
          </div>
        </div>
      </div>
    </div>
  );
}
