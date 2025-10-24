"use client";
import { useEffect, useMemo, useRef } from "react";
import type { IssueItem } from "@/lib/schemas";

type Props = {
  text: string;
  probleme: IssueItem[];
  activeIndex: number | null;
};

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function HighlightedText({ text, probleme, activeIndex }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const parts = useMemo(() => {
    const segments: Array<{ key: string; text: string; highlight?: number }> = [];
    if (!text) return segments;

    // Build regex to match any clauza_originala
    const patterns = probleme
      .map((p, idx) => ({ idx, pattern: p.clauza_originala?.trim() }))
      .filter((p) => p.pattern && p.pattern.length > 8); // avoid very short noise

    if (patterns.length === 0) return [{ key: "0", text }];

    const tokens: Array<{ start: number; end: number; idx: number }> = [];
    for (const { idx, pattern } of patterns) {
      const re = new RegExp(escapeRegExp(pattern!), "gi");
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) {
        tokens.push({ start: m.index, end: m.index + m[0].length, idx });
      }
    }
    tokens.sort((a, b) => a.start - b.start || a.end - b.end);

    // Merge and slice text
    let cursor = 0;
    let k = 0;
    for (const t of tokens) {
      if (t.start > cursor) segments.push({ key: `t-${k++}`, text: text.slice(cursor, t.start) });
      segments.push({ key: `h-${k++}`, text: text.slice(t.start, t.end), highlight: t.idx });
      cursor = t.end;
    }
    if (cursor < text.length) segments.push({ key: `t-${k++}`, text: text.slice(cursor) });
    return segments;
  }, [text, probleme]);

  useEffect(() => {
    if (activeIndex == null) return;
    const el = containerRef.current?.querySelector<HTMLSpanElement>(`[data-hidx='${activeIndex}']`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIndex]);

  return (
    <div ref={containerRef} className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm">
      {parts.map((p) =>
        p.highlight != null ? (
          <span
            key={p.key}
            data-hidx={p.highlight}
            className={`px-1 py-0.5 rounded-md transition-all ${activeIndex === p.highlight
                ? "bg-yellow-400/40 ring-2 ring-yellow-400/60 shadow-lg shadow-yellow-400/20"
                : "bg-yellow-400/20 hover:bg-yellow-400/30"
              }`}
          >
            {p.text}
          </span>
        ) : (
          <span key={p.key}>{p.text}</span>
        )
      )}
    </div>
  );
}