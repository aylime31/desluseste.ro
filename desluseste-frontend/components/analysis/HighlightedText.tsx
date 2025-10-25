"use client";

import { useMemo } from "react";

type Nivel = "Scăzut" | "Mediu" | "Ridicat";

type Problem = {
  clauza_originala?: string;
  excerpt?: string;
  fragment?: string;
  nivel_atentie?: Nivel;
};

type Props = {
  text: string;
  problems?: Problem[];
  activeIndex: number | null;
};

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function riskClass(nivel?: Nivel) {
  switch (nivel) {
    case "Ridicat":
      return "bg-red-500/20 text-red-50";
    case "Mediu":
      return "bg-amber-500/25 text-amber-50";
    default:
      return "bg-emerald-500/20 text-emerald-50";
  }
}

export function HighlightedText({ text, problems = [], activeIndex }: Props) {
  const parts = useMemo(() => {
    if (!text) return [{ key: "0", text }];

    // 1) extragem fragmentele utilizabile din probleme
    const pats = (problems ?? [])
      .map((p, idx) => {
        const raw =
          p.clauza_originala ?? p.excerpt ?? p.fragment ?? "";
        const pattern = raw.trim();
        return { idx, pattern };
      })
      .filter((p) => p.pattern && p.pattern.length > 3);

    if (pats.length === 0) return [{ key: "0", text }];

    // 2) expresie regulată combinată (case-insensitive)
    const re = new RegExp(
      "(" + pats.map((p) => escapeRegex(p.pattern)).join("|") + ")",
      "gi"
    );

    const out: Array<
      | { key: string; text: string }
      | { key: string; text: string; matchForIdx: number }
    > = [];

    let last = 0;
    let m: RegExpExecArray | null;

    // 3) parcurgem toate potrivirile și decupăm segmentele
    while ((m = re.exec(text)) !== null) {
      const start = m.index;
      const matched = m[0];

      if (start > last) {
        out.push({ key: `t-${last}`, text: text.slice(last, start) });
      }

      // aflăm care pattern a produs match-ul curent
      // (prima potrivire exactă pe textul matched)
      const which =
        pats.find((p) =>
          new RegExp("^" + escapeRegex(p.pattern) + "$", "i").test(matched)
        )?.idx ?? -1;

      out.push({ key: `m-${start}`, text: matched, matchForIdx: which });
      last = start + matched.length;
    }

    if (last < text.length) {
      out.push({ key: `t-${last}`, text: text.slice(last) });
    }

    return out;
  }, [text, problems]);

  return (
    <div className="leading-relaxed whitespace-pre-wrap text-[15px] text-slate-900">
      {parts.map((p, i) => {
        if ("matchForIdx" in p) {
          const idx = p.matchForIdx;
          const nivel = problems[idx]?.nivel_atentie;
          const isActive = activeIndex === idx;

          return (
            <mark
              key={p.key}
              data-idx={idx}
              className={
                "rounded px-0.5 " +
                riskClass(nivel) +
                (isActive
                  ? " outline outline-2 outline-blue-500"
                  : " outline-none")
              }
              title={
                nivel ? `Nivel: ${nivel}` : "Fragment evidențiat"
              }
            >
              {p.text}
            </mark>
          );
        }
        return <span key={p.key}>{p.text}</span>;
      })}
    </div>
  );
}
