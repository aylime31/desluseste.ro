"use client";
import * as React from "react";
import type { IssueItem } from "@/lib/schemas";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";

type Nivel = "Scăzut" | "Mediu" | "Ridicat";

type Props = {
  probleme: IssueItem[];
  onSelect: (idx: number) => void;
  activeIndex?: number | null;
  onSelectById?: (anchorId: string, idx: number) => void;
};

const norm = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

function toNivel(anyNivel: string | number | undefined): Nivel {
  if (typeof anyNivel === "number") {
    const n = Math.max(0, Math.min(100, anyNivel));
    if (n >= 70) return "Ridicat";
    if (n >= 40) return "Mediu";
    return "Scăzut";
  }
  const t = norm(String(anyNivel || ""));
  if (/ridicat|high|mare|inalt/.test(t)) return "Ridicat";
  if (/mediu|medium|mijlociu/.test(t)) return "Mediu";
  return "Scăzut";
}

export function RiskList({ probleme, onSelect, activeIndex = null, onSelectById }: Props) {
  const listRef = React.useRef<HTMLDivElement | null>(null);

  const slugify = React.useCallback((s: string) => {
    return s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }, []);

  const getRiskIcon = (nivel: Nivel) => {
    if (nivel === "Ridicat") return <AlertTriangle className="w-4 h-4 text-red-400" aria-hidden />;
    if (nivel === "Mediu")   return <AlertCircle   className="w-4 h-4 text-amber-400" aria-hidden />;
    return <Info className="w-4 h-4 text-emerald-400" aria-hidden />;
  };

  const getRiskColor = (nivel: Nivel) => {
    if (nivel === "Ridicat") return "border-red-500/30 hover:border-red-500/50 hover:bg-red-500/5";
    if (nivel === "Mediu")   return "border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/5";
    return "border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/5";
  };

  const getCategoryBadge = (cat: string) => {
    if (!cat) return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    if (/Financiare|Severe/i.test(cat))
      return "bg-red-500/10 text-red-400 border border-red-500/20";
    if (/Date/i.test(cat))
      return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
    if (/Ambiguitate/i.test(cat))
      return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
  };

  const handleActivate = React.useCallback((i: number, anchorId: string) => {
    onSelect(i);
    try { history.replaceState(null, "", `#${anchorId}`); } catch {}
    onSelectById?.(anchorId, i);
  }, [onSelect, onSelectById]);

  if (!probleme || probleme.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Info className="w-12 h-12 mx-auto mb-3 opacity-50" aria-hidden />
        <p>Nu au fost identificate probleme semnificative</p>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label="Lista problemelor identificate"
      className="space-y-3"
    >
      {probleme.map((p, i) => {
        const level: Nivel = toNivel(p.nivel_atentie as any);
        const anchorId = p.anchor_id && p.anchor_id.trim().length
          ? p.anchor_id
          : `${slugify(p.titlu_problema || `problema-${i}`)}-${i}`;
        const isActive = activeIndex === i;

        return (
          <button
            key={anchorId}
            type="button"
            role="option"
            aria-selected={isActive}
            data-active={isActive ? "true" : "false"}
            data-level={level}
            onClick={() => handleActivate(i, anchorId)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleActivate(i, anchorId);
              }
            }}
            className={[
              "w-full text-left p-4 rounded-xl border transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950",
              getRiskColor(level),
              isActive ? "ring-1 ring-indigo-500/50 bg-slate-800/60" : "",
            ].join(" ")}
          >
            <div className="flex items-start gap-3 mb-2">
              <div className="mt-0.5">{getRiskIcon(level)}</div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-slate-200 group-hover:text-white transition-colors line-clamp-2">
                  {p.titlu_problema || `Problemă ${i + 1}`}
                </h4>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`text-xs px-2 py-1 rounded-lg ${getCategoryBadge(p.categorie_problema || "")}`}>
                {p.categorie_problema || "Neîncadrată"}
              </span>
              <span className="text-xs px-2 py-1 rounded-lg bg-slate-800 text-slate-400">
                Nivel: {level}
              </span>
              <span id={anchorId} className="sr-only">Ancoră {i + 1}</span>
            </div>

            {p.explicatie_simpla && (
              <p className="text-sm text-slate-400 leading-relaxed line-clamp-2 mb-2">
                {p.explicatie_simpla}
              </p>
            )}

            {p.sugestie && (
              <div className="text-xs text-slate-500 italic">
                💡 {p.sugestie}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
