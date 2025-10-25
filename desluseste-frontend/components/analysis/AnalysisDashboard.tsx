"use client";

import { useMemo, useState } from "react";
import { SiteHeader } from "../layout/SiteHeader";
import { SiteFooter } from "../layout/SiteFooter";
import { HighlightedText } from "./HighlightedText";
import "@/app/analysis-skin.css";

/* ---- tipuri tolerante ---- */
type IssueIn = {
  titlu?: string; title?: string; label?: string;
  nivel?: string; level?: string; severity?: string;
  clauza_originala?: string;
  citat?: string; quote?: string; pasaj?: string; fragment?: string;
  descriere?: string; notes?: string; explicatie?: string; detalii?: string;
  recomandare?: string; recommendation?: string; sugestie?: string;
};

type Result = {
  text_original?: string;
  rezumat_executiv?: string;
  probleme_identificate?: IssueIn[];
};

/* ================== SEARCH UTILS (char-by-char, tolerant) ================== */

/** Normalizează pentru căutare + map la indecșii originali */
function normalizeWithMap(input: string) {
  const map: number[] = []; // map[i_norm] = i_original
  let norm = "";
  let iNorm = 0;

  const push = (ch: string, origIndex: number) => {
    norm += ch;
    map[iNorm++] = origIndex;
  };

  // strip diacritice, lowercase
  const s = input.normalize("NFD").toLowerCase();
  let lastWasSpace = false;

  for (let i = 0; i < s.length; i++) {
    const code = s.codePointAt(i)!;
    const ch = s[i];

    // ignoră mark-urile de diacritice
    if (code >= 0x0300 && code <= 0x036f) continue;

    // tratează toate spațiile/tab-urile/line-break ca spațiu simplu
    if (/\s/.test(ch)) {
      if (!lastWasSpace) {
        push(" ", i);
        lastWasSpace = true;
      }
      continue;
    }
    lastWasSpace = false;

    // păstrează doar caracterele utile; poți relaxa aici dacă vrei
    if (/[a-z0-9ăâîșț\-_,.;:()"/]/.test(ch)) {
      push(ch, i);
    } else {
      // pentru semne rare, le păstrăm totuși ca să nu stricăm mappingul
      push(ch, i);
    }
  }

  return { norm, map };
}

/** Levenshtein limitat (abandonează dacă depășește maxEdits) */
function boundedLevenshtein(a: string, b: string, maxEdits: number) {
  const n = a.length, m = b.length;
  if (Math.abs(n - m) > maxEdits) return maxEdits + 1;

  const prev = new Array(m + 1);
  const curr = new Array(m + 1);
  for (let j = 0; j <= m; j++) prev[j] = j;

  for (let i = 1; i <= n; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    const ai = a.charCodeAt(i - 1);
    for (let j = 1; j <= m; j++) {
      const cost = ai === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > maxEdits) return maxEdits + 1; // prune
    // swap
    for (let j = 0; j <= m; j++) prev[j] = curr[j];
  }
  return prev[m];
}

/** Găsește needle în hay tolerând diacritice/spații + mici diferențe; întoarce indecși originali */
function smartFindWithContext(hayRaw: string, needleRaw: string, radius = 120) {
  const needleTrim = (needleRaw || "").trim();
  if (!hayRaw || !needleTrim) return null;

  const { norm: H, map: mapH } = normalizeWithMap(hayRaw);
  const { norm: N } = normalizeWithMap(needleTrim);

  if (!N) return null;

  // 1) căutare exactă pe normalizat
  let startN = H.indexOf(N);
  let endN = startN >= 0 ? startN + N.length : -1;

  // 2) fallback fuzzy cu fereastră glisantă
  if (startN < 0) {
    const slack = Math.max(2, Math.floor(N.length * 0.15)); // ~15% toleranță
    let best = { dist: Infinity, s: -1, e: -1 };

    const minW = Math.max(1, N.length - 5);
    const maxW = N.length + 5;

    for (let s = 0; s + minW <= H.length; s++) {
      const wEnd = Math.min(H.length, s + maxW);
      for (let e = s + minW; e <= wEnd; e++) {
        const sub = H.slice(s, e);
        const d = boundedLevenshtein(sub, N, slack);
        if (d <= slack && d < best.dist) best = { dist: d, s, e };
      }
    }
    if (best.s >= 0) {
      startN = best.s;
      endN = best.e;
    }
  }

  if (startN < 0) return null;

  // mapează la indecși originali (caracter cu caracter)
  const startOrig = mapH[startN] ?? 0;
  const endOrig = mapH[endN - 1] != null ? mapH[endN - 1] + 1 : hayRaw.length;

  const sCtx = Math.max(0, startOrig - radius);
  const eCtx = Math.min(hayRaw.length, endOrig + radius);

  const before = (sCtx > 0 ? "…" : "") + hayRaw.slice(sCtx, startOrig);
  const match = hayRaw.slice(startOrig, endOrig);
  const after = hayRaw.slice(endOrig, eCtx) + (eCtx < hayRaw.length ? "…" : "");

  return { before, match, after };
}

/* ================== END SEARCH UTILS ================== */

function sevToMod(s?: string) {
  const v = (s || "ridicat").toLowerCase();
  if (v.startsWith("r") || v.includes("high")) return "high" as const;
  if (v.includes("med")) return "medium" as const;
  return "low" as const;
}
function modToText(m: "high" | "medium" | "low") {
  return m === "high" ? "Ridicat" : m === "medium" ? "Mediu" : "Scăzut";
}

export function AnalysisDashboard({ result, onReset }: { result: Result; onReset: () => void; }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const text = result?.text_original ?? "";
  const summary = result?.rezumat_executiv ?? "";

  const problems = useMemo(() => {
    const list = result?.probleme_identificate ?? [];
    return list.map((r) => {
      const title = r.titlu || r.title || r.label || "Clauză potențial problematică";
      const mod = sevToMod(r.nivel || r.level || r.severity);
      const levelText = modToText(mod);

      const quoteRaw = (r.citat || r.quote || r.pasaj || r.fragment || "").toString().trim();
      const needle = quoteRaw || (r.clauza_originala || "").toString().trim();

      const snippet = smartFindWithContext(text, needle, 120);

      const notes = (r.descriere || r.notes || r.explicatie || r.detalii || "").toString().trim();
      const rec   = (r.recomandare || r.recommendation || r.sugestie || "").toString().trim();

      return { title, mod, levelText, quoteRaw, needle, snippet, notes, rec, clauza_originala: r.clauza_originala?.toString().trim() };
    });
  }, [result, text]);

  return (
    <div className="analysis-skin">
      <SiteHeader onReset={() => { setActiveIdx(null); onReset(); }} />

      <main className="screen">
        <section className="card">
          <div className="grid">
            {/* ===== Stânga: text cu highlight (folosește clauza/quote ca ac) ===== */}
            <div>
              <h2>📄 Text analizat</h2>
              <div className="panel">
                <div className="orig">
                  <HighlightedText
                    text={text}
                    problems={problems.map(p => ({
                      clauza_originala: p.clauza_originala || p.quoteRaw || p.needle || "",
                    }))}
                    activeIndex={activeIdx}
                  />
                </div>
              </div>
            </div>

            {/* ===== Dreapta: Rezumat + Probleme ===== */}
            <div>
              <div className="panel" style={{ marginBottom: 16 }}>
                <h2>📘 Rezumat</h2>
                {summary ? <p>{summary}</p> : <p className="muted">Nu există un rezumat generat.</p>}
              </div>

              <section className="panel">
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <h2>⚠️ Probleme identificate</h2>
                  <span className="badge">{problems.length ? `${problems.length} găsite` : "Nicio problemă detectată"}</span>
                </div>

                <div className="issues">
                  {!problems.length && <p className="muted">Documentul pare în regulă.</p>}

                  {problems.map((p, i) => (
                    <article
                      key={i}
                      className={`issue issue--${p.mod}`}
                      onMouseEnter={() => setActiveIdx(i)}
                      onFocus={() => setActiveIdx(i)}
                      onMouseLeave={() => setActiveIdx(null)}
                    >
                      <header className="issue__head">
                        <span className="issue__icon" aria-hidden>⚠️</span>
                        <h3 className="issue__title">{p.title}</h3>
                        <span className={`issue__pill issue__pill--${p.mod}`}>Nivel: {p.levelText}</span>
                      </header>

                      {/* 🔴 CITATUL EXACT (din backend) sau construit char-by-char din textul din stânga */}
                      {p.quoteRaw ? (
                        <blockquote className="issue__quote">{p.quoteRaw}</blockquote>
                      ) : p.snippet ? (
                        <blockquote className="issue__quote">
                          {p.snippet.before}
                          <mark className="hl hl-yellow">{p.snippet.match}</mark>
                          {p.snippet.after}
                        </blockquote>
                      ) : (
                        <blockquote className="issue__quote">Nu am putut extrage citatul din document.</blockquote>
                      )}

                      {p.notes && <p className="issue__meta">{p.notes}</p>}
                      {p.rec && <p className="issue__recommend">{p.rec}</p>}
                    </article>
                  ))}
                </div>

                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12, gap:8, flexWrap:"wrap" }}>
                  <p className="disclaimer">Nu suntem avocați. Analiză informativă, nu consultanță juridică.</p>
                  <div style={{ display:"flex", gap:8 }}>
                    <button className="btn" onClick={onReset}>Înapoi</button>
                    <button className="btn primary" onClick={() => window.print()}>Exportă PDF</button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
