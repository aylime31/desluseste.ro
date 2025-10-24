"use client";
import { RiskGauge } from "@/components/analysis/RiskGauge";

export function ExecutiveSummary({
  summary,
  levels,
}: {
  summary: string;
  levels: number[];
}) {
  const avg =
    levels.length ? Math.round(levels.reduce((a, b) => a + b, 0) / levels.length) : 0;
  const badge =
    avg >= 70 ? "bg-red-500/20 text-red-200 border-red-500/30" :
    avg >= 40 ? "bg-amber-500/20 text-amber-200 border-amber-500/30" :
                "bg-emerald-500/20 text-emerald-200 border-emerald-500/30";

  return (
    <div className="card-tight">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-muted">Rezumat executiv</h3>
        <span className={`text-xs border px-2 py-1 rounded ${badge}`}>
          Risc mediu: <strong className="ml-1">{avg}%</strong>
        </span>
      </div>
      <p className="leading-relaxed">{summary}</p>
      <div className="mt-6">
        <RiskGauge nivele={levels} />
      </div>
    </div>
  );
}
