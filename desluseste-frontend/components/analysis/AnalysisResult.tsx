"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";

/** ====== Types (kept minimal) ====== */
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

type Result = {
  text_original: string;
  rezumat_executiv: string;
  probleme_identificate: Problem[];
};

type Props = {
  result: Result;
  onReset: () => void;
};

/** ====== Utilities ====== */
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const colorForLevel = (n?: Nivel) =>
  n === "Ridicat" ? "hl hl-red" : n === "Mediu" ? "hl hl-yellow" : "hl hl-green";

function computeRanges(
  text: string,
  problems: Problem[]
): Array<{ start: number; end: number; idx: number }> {
  const ranges: Array<{ start: number; end: number; idx: number; len: number }> = [];

  problems.forEach((p, idx) => {
    const src =
      (p.clauza_originala ?? "").trim() ||
      (p.excerpt ?? "").trim() ||
      (p.fragment ?? "").trim();

    if (!src || src.length <= 5) return;

    const rx = new RegExp(escapeRegex(src), "gi");
    let m: RegExpExecArray | null;
    while ((m = rx.exec(text)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      if (end <= start) {
        rx.lastIndex = start + 1;
        continue;
      }
      ranges.push({ start, end, idx, len: end - start });
    }
  });

  if (!ranges.length) return [];
  ranges.sort((a, b) => (a.start - b.start) || (b.len - a.len));

  const out: Array<{ start: number; end: number; idx: number }> = [];
  let lastEnd = -1;
  for (const r of ranges) {
    if (r.start >= lastEnd) {
      out.push({ start: r.start, end: r.end, idx: r.idx });
      lastEnd = r.end;
    }
  }
  return out;
}

/** ====== Inline Highlight renderer ====== */
function HighlightedText({
  text,
  problems,
  activeIndex,
  onMarkMounted,
}: {
  text: string;
  problems: Problem[];
  activeIndex: number | null;
  onMarkMounted?: () => void; // signals when marks are in DOM
}) {
  const ranges = useMemo(() => computeRanges(text ?? "", problems ?? []), [text, problems]);

  useEffect(() => {
    onMarkMounted?.();
  }, [ranges.length, onMarkMounted]);

  if (!ranges.length) {
    return <pre className="text-original">{text}</pre>;
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  ranges.forEach((r, i) => {
    if (r.start > cursor) {
      parts.push(
        <span key={`t-${i}-${cursor}`} className="prewrap">
          {text.slice(cursor, r.start)}
        </span>
      );
    }
    const problem = problems[r.idx];
    const cls = colorForLevel(problem?.nivel_atentie);
    const isActive = activeIndex === r.idx;
    parts.push(
      <mark
        key={`h-${i}-${r.start}`}
        className={`${cls} ${isActive ? "ringed" : ""}`}
        data-problem-index={r.idx}
      >
        {text.slice(r.start, r.end)}
      </mark>
    );
    cursor = r.end;
  });

  if (cursor < text.length) {
    parts.push(
      <span key={`t-end-${cursor}`} className="prewrap">
        {text.slice(cursor)}
      </span>
    );
  }

  return <div className="text-original">{parts}</div>;
}

/** ====== The Single-File Page ====== */
export default function OneFileAnalysis({ result, onReset }: Props) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // Scroll to first highlight of a problem when selecting it from the list
  const wantScrollIdx = useRef<number | null>(null);
  const onMarksMounted = () => {
    const idx = wantScrollIdx.current;
    if (idx == null) return;
    const el = document.querySelector<HTMLElement>(`mark[data-problem-index="${idx}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    wantScrollIdx.current = null;
  };

  const problems = result?.probleme_identificate ?? [];

  return (
    <div className="onepage">
      {/* Header */}
      <header className="head">
        <div className="head__inner">
          <div className="brand">
            <div className="dot" />
            <span className="brand__name">desluseste.ro</span>
          </div>
          <button className="btn btn--ghost" onClick={() => onReset()}>
            Încarcă alt PDF
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="wrap">
        {/* Text analizat */}
        <section className="panel">
          <h2 className="panel__title">📄 Text analizat</h2>
          <HighlightedText
            text={result?.text_original ?? ""}
            problems={problems}
            activeIndex={activeIdx}
            onMarkMounted={onMarksMounted}
          />
        </section>

        {/* Rezumat */}
        <section className="panel panel--soft">
          <h2 className="panel__title">📘 Rezumat</h2>
          <p className="panel__text prewrap">{result?.rezumat_executiv ?? ""}</p>
        </section>

        {/* Probleme */}
        <section className="panel">
          <h2 className="panel__title">
            ⚠️ Probleme identificate <span className="muted">({problems.length})</span>
          </h2>

          {problems.length === 0 ? (
            <p className="muted">Nicio problemă identificată.</p>
          ) : (
            <ul className="plist">
              {problems.map((p, i) => {
                const title = p.titlu || p.categorie || "Clauză posibil problematică";
                const snippet =
                  p.clauza_originala || p.excerpt || p.fragment || "(fragment nedisponibil)";
                const level = p.nivel_atentie || "Mediu";
                const isActive = activeIdx === i;

                return (
                  <li
                    key={i}
                    className={`pitem ${isActive ? "pitem--active" : ""}`}
                    onClick={() => {
                      setActiveIdx(i);
                      wantScrollIdx.current = i;
                      onMarksMounted(); // in case marks already present
                    }}
                  >
                    <div className="pitem__line">
                      <strong className="pitem__title">{title}</strong>
                      <span
                        className={
                          "badge " +
                          (level === "Ridicat"
                            ? "badge--danger"
                            : level === "Mediu"
                            ? "badge--warn"
                            : "badge--ok")
                        }
                      >
                        {level}
                      </span>
                    </div>
                    <p className="pitem__snippet">{snippet}</p>

                    {p.recomandare ? (
                      <p className="pitem__tip">
                        <span className="bold">Sugestie:</span> {p.recomandare}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      {/* Inline CSS (global) */}
      <style jsx global>{`
        :root {
          --ink-900: #0f172a;
          --ink-800: #111827;
          --ink-600: #475569;
          --g-25: #fcfcfd;
          --g-50: #f8fafc;
          --g-100: #f1f5f9;
          --g-200: #e5e7eb;
          --g-300: #cbd5e1;
          --blue-600: #2563eb;
          --blue-700: #1e40af;
          --shadow: 0 10px 25px rgba(2, 6, 23, 0.06);
        }

        * {
          box-sizing: border-box;
        }
        html,
        body,
        #__next {
          height: 100%;
        }
        body {
          margin: 0;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter,
            "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji";
          color: var(--ink-800);
          background: linear-gradient(180deg, #eef3ff 0%, #ffffff 60%, #f8fafc 100%);
        }

        /* Header */
        .head {
          position: sticky;
          top: 0;
          z-index: 50;
          background: linear-gradient(90deg, #2b50d8, #3d66f1);
          color: #fff;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
        }
        .head__inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-weight: 900;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          color: #eaf2ff;
        }
        .dot {
          width: 14px;
          height: 14px;
          border-radius: 4px;
          background: linear-gradient(135deg, #60a5fa, #1d4ed8);
        }

        /* Layout */
        .wrap {
          max-width: 1100px;
          margin: 24px auto 80px;
          padding: 0 20px;
          display: grid;
          gap: 18px;
        }

        /* Panels */
        .panel {
          background: #fff;
          border: 1px solid var(--g-200);
          border-radius: 16px;
          padding: 18px 20px;
          box-shadow: var(--shadow);
        }
        .panel--soft {
          background: linear-gradient(180deg, #eef6ff, #ffffff);
        }
        .panel__title {
          margin: 4px 0 12px;
          font-size: 18px;
          font-weight: 800;
          color: var(--ink-900);
        }
        .panel__text {
          margin: 0;
          color: var(--ink-800);
          line-height: 1.6;
        }
        .muted {
          color: var(--ink-600);
          font-weight: 600;
        }
        .bold {
          font-weight: 700;
        }
        .prewrap {
          white-space: pre-wrap;
        }

        /* Text original + highlight */
        .text-original {
          border: 1px solid var(--g-200);
          background: var(--g-50);
          border-radius: 12px;
          padding: 14px;
          white-space: pre-wrap;
          line-height: 1.55;
          color: #111827;
        }
        .hl {
          border-radius: 4px;
          padding: 0 0.1em;
        }
        .hl-yellow {
          background: #fff3b0;
        }
        .hl-red {
          background: #fecaca;
        }
        .hl-green {
          background: #bbf7d0;
        }
        .ringed {
          outline: 2px solid #60a5fa;
          outline-offset: 2px;
        }

        /* Problems */
        .plist {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 10px;
        }
        .pitem {
          border: 1px solid var(--g-200);
          border-radius: 12px;
          padding: 12px 14px;
          background: #f8fafc;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
          cursor: pointer;
        }
        .pitem:hover {
          border-color: #a3bffa;
          background: #f1f5ff;
          box-shadow: 0 10px 20px rgba(37, 99, 235, 0.08);
        }
        .pitem--active {
          border-color: #60a5fa;
          background: #eef6ff;
          box-shadow: 0 10px 22px rgba(37, 99, 235, 0.12);
        }
        .pitem__line {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 4px;
        }
        .pitem__title {
          font-weight: 800;
          color: var(--ink-900);
        }
        .pitem__snippet {
          margin: 2px 0 0;
          color: #334155;
          line-clamp: 2;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .pitem__tip {
          margin-top: 6px;
          font-size: 13px;
          color: #475569;
        }
        .badge {
          font-size: 12px;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 999px;
          border: 1px solid var(--g-200);
          background: var(--g-100);
          color: var(--ink-900);
        }
        .badge--danger {
          background: #fee2e2;
          color: #991b1b;
          border-color: #fecaca;
        }
        .badge--warn {
          background: #fef3c7;
          color: #92400e;
          border-color: #fde68a;
        }
        .badge--ok {
          background: #dcfce7;
          color: #166534;
          border-color: #bbf7d0;
        }

        /* Buttons */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          padding: 10px 14px;
          font-weight: 700;
          cursor: pointer;
          user-select: none;
        }
        .btn--ghost {
          border: 1px solid #c7d2fe;
          background: rgba(255, 255, 255, 0.08);
          color: #eaf2ff;
        }
        .btn--ghost:hover {
          background: rgba(255, 255, 255, 0.18);
        }
      `}</style>
    </div>
  );
}
