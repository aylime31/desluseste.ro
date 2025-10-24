// src/components/analysis/RiskGauge.tsx
"use client";
import * as React from "react";

type Nivel = number | "Ridicat" | "Mediu" | "Scăzut";

export function RiskGauge({ nivele }: { nivele: Nivel[] }) {
  const pct = React.useMemo(() => calcRiskPercent(nivele), [nivele]);
  const color =
    pct >= 70 ? "text-red-300" : pct >= 40 ? "text-amber-300" : "text-emerald-300";
  const barBg =
    pct >= 70 ? "bg-red-500/30" : pct >= 40 ? "bg-amber-500/30" : "bg-emerald-500/30";
  const barFill =
    pct >= 70 ? "bg-red-500" : pct >= 40 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div
      role="group"
      aria-label="indice risc"
      className="select-none"
    >
      <div className="flex items-end gap-2">
        <span className={`text-3xl font-bold tabular-nums ${color}`} aria-live="polite">
          {pct}%
        </span>
        <span className="text-slate-400 text-sm leading-6">indice risc</span>
      </div>

      {/* bară simplă, fără dependențe */}
      <div className={`mt-2 h-2 w-full rounded-full ${barBg}`}>
        <div
          className={`h-2 rounded-full ${barFill}`}
          style={{ width: `${pct}%`, transition: "width 300ms ease-out" }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

/** ===== Utils ===== **/

/**
 * Calculează procentul de risc:
 * - Dacă majoritatea valorilor > 3 → tratăm ca procente [0..100] și facem media.
 * - Altfel mapăm Ridicat=3, Mediu=2, Scăzut=1 sau scor numeric 1..3, apoi media/3*100.
 * - Listă goală → 0.
 * Rotunjire: Math.round (ex: 66.67 → 67).
 */
export function calcRiskPercent(vals: Nivel[]): number {
  if (!vals || vals.length === 0) return 0;

  const nums = vals.map(v => {
    if (typeof v === "number") return v;
    switch (v) {
      case "Ridicat": return 3;
      case "Mediu": return 2;
      case "Scăzut": return 1;
      default: return 0;
    }
  });

  const count = nums.length;
  const gt3 = nums.filter(n => n > 3).length;

  // Heuristică: dacă peste jumătate sunt >3, tratăm tot ca procente
  if (gt3 > count / 2) {
    const clamped = nums.map(n => clamp(n, 0, 100));
    const avg = clamped.reduce((a, b) => a + b, 0) / count;
    return Math.round(avg);
  }

  // Altfel tratăm ca scale 1..3
  const mapped = nums.map(n => {
    if (n <= 0) return 0;
    if (n <= 3) return n;        // 1..3 deja
    // fallback: dacă au venit 10, 20, 30 → normalizăm grosier la 1..3
    if (n <= 33) return 1;
    if (n <= 66) return 2;
    return 3;
  });

  const avg13 = mapped.reduce((a, b) => a + b, 0) / count;
  const pct = (avg13 / 3) * 100;
  return Math.round(pct);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
