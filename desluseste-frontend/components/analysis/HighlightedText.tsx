"use client";
import { useMemo } from "react";

type Problem = {
  titlu?: string;
  nivel_atentie?: "ridicat" | "mediu" | "scazut";
  clauza_originala?: string;
};

type Props = {
  text: string;
  /** Acceptă ambele nume, ca să nu mai crape la mismatch */
  probleme?: Problem[] | null;
  problems?: Problem[] | null;
  activeIndex: number | null;
};

export function HighlightedText({ text, probleme, problems, activeIndex }: Props) {
  const parts = useMemo(() => {
    if (!text) return [{ key: "0", text }];

    // === normalize list (probleme | problems) ===
    const list = (Array.isArray(problems) ? problems : Array.isArray(probleme) ? probleme : []) as Problem[];

    // extrage pattern-uri valide (min 6 caractere utile)
    const patterns = list
      .map((p, idx) => ({ idx, pattern: (p.clauza_originala || "").trim() }))
      .filter((p) => p.pattern && p.pattern.replace(/\W+/g, "").length >= 6);

    if (patterns.length === 0) return [{ key: "0", text }];

    // === găsește TOATE aparițiile, cu poziții ===
    type Hit = { start: number; end: number; idx: number; text: string };
    const hits: Hit[] = [];

    for (const { idx, pattern } of patterns) {
      const re = new RegExp(escapeRegExp(pattern), "ig");
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null) {
        hits.push({ start: m.index, end: m.index + m[0].length, idx, text: m[0] });
        // protecție infinite loop pe zero-width (nu ar trebui după filtrarea noastră)
        if (m.index === re.lastIndex) re.lastIndex++;
      }
    }

    if (hits.length === 0) return [{ key: "0", text }];

    // === sortează: start asc, apoi lungime desc (preferă potriviri mai lungi) ===
    hits.sort((a, b) => (a.start - b.start) || (b.end - b.start) - (a.end - a.start));

    // === elimină suprapunerile (greedy pe cele mai lungi deja sortate) ===
    const accepted: Hit[] = [];
    let lastEnd = -1;
    for (const h of hits) {
      if (h.start >= lastEnd) {
        accepted.push(h);
        lastEnd = h.end;
      }
    }

    // === construiește segmentele finale ===
    const chunks: Array<{ text: string; idx?: number }> = [];
    let cursor = 0;
    for (const h of accepted) {
      if (h.start > cursor) chunks.push({ text: text.slice(cursor, h.start) });
      chunks.push({ text: text.slice(h.start, h.end), idx: h.idx });
      cursor = h.end;
    }
    if (cursor < text.length) chunks.push({ text: text.slice(cursor) });

    let key = 0;
    return chunks.map((c) => ({ key: String(key++), ...c }));
  }, [text, probleme, problems]);

  return (
    <p className="leading-7 text-slate-800 whitespace-pre-wrap">
      {parts.map((p) =>
        typeof p.idx === "number" ? (
          <mark key={p.key} className={`hl ${activeIndex === p.idx ? "hl-red" : "hl-yellow"}`}>
            {p.text}
          </mark>
        ) : (
          <span key={p.key}>{p.text}</span>
        )
      )}
    </p>
  );
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
