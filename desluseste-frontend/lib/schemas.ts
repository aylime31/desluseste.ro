// src/lib/schemas.ts
import { z } from "zod";

/** ——— Raw (ce vine de la backend) ——— */
export const IssueItemSchema = z.object({
  titlu_problema: z.string().min(1),
  clauza_originala: z.string().min(1),
  categorie_problema: z.string().min(1),
  explicatie_simpla: z.string().min(1),
  // Acceptăm: "Scăzut" | "Mediu" | "Ridicat" | number [0..100] | number [1..3] | string ciuntit (scazut, RIdICAT etc.)
  nivel_atentie: z.union([
    z.enum(["Scăzut", "Mediu", "Ridicat"]),
    z.number().min(0).max(100),
    z.number().int().min(1).max(3),
    z.string().min(1),
  ]),
  sugestie: z.string().min(1),
  // opționale utile pt. highlight & deep-link
  anchor_id: z.string().optional(),
  offset_start: z.number().int().nonnegative().optional(),
  offset_end: z.number().int().nonnegative().optional(),
});

export const AnalysisResponseSchema = z.object({
  probleme_identificate: z.array(IssueItemSchema),
  rezumat_executiv: z.string().min(1),
  text_original: z.string().min(1),
});

export type IssueItem = z.infer<typeof IssueItemSchema>;
export type AnalysisResponse = z.infer<typeof AnalysisResponseSchema>;

/** ——— Tipuri normalizate pentru UI ——— */
export type NivelCanonic = "Scăzut" | "Mediu" | "Ridicat";

export type NormalizedIssueItem = {
  titlu_problema: string;
  clauza_originala: string;
  categorie_problema: string;
  explicatie_simpla: string;
  nivel_atentie: NivelCanonic; // canonic
  score13: 1 | 2 | 3;          // 1..3
  percent: number;             // 0..100 întreg
  sugestie: string;
  anchor_id: string;           // mereu prezent după normalizare
  offset_start?: number;
  offset_end?: number;
};

export type NormalizedAnalysisResponse = {
  probleme_identificate: NormalizedIssueItem[];
  rezumat_executiv: string;
  text_original: string;
};

/** ——— Normalizări & utils ——— */

// Normalizează stringurile indiferent de diacritice/case/spații
function normStr(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // scoate diacritice
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Mapare robustă: orice → scor 1..3
export function nivelToScore(anyNivel: unknown): 1 | 2 | 3 {
  if (typeof anyNivel === "number") {
    // dacă pare procent
    if (anyNivel > 3) {
      const pct = clamp(anyNivel, 0, 100);
      if (pct >= 70) return 3;
      if (pct >= 40) return 2;
      return 1;
    }
    // dacă e 1..3
    const n = Math.round(anyNivel);
    if (n <= 1) return 1 as const;
    if (n === 2) return 2 as const;
    return 3 as const;
  }

  const s = normStr(String(anyNivel));
  if (s === "ridicat") return 3;
  if (s === "mediu") return 2;
  if (s === "scazut" || s === "scazut" /* redundanță safe */) return 1;

  // heuritică pentru texte tipo "high/medium/low", "mare/mijlociu/mic"
  if (/(ridicat|high|mare|inalt)/.test(s)) return 3;
  if (/(mediu|medium|mijlociu)/.test(s)) return 2;
  if (/(scazut|low|mic|redus)/.test(s)) return 1;

  // fallback nervos: 1 (nu supra-alarma)
  return 1;
}

export function scoreToNivel(s: 1 | 2 | 3): NivelCanonic {
  return s === 3 ? "Ridicat" : s === 2 ? "Mediu" : "Scăzut";
}

export function scoreToPercent(s: 1 | 2 | 3): number {
  // 1→33, 2→67, 3→100 (rotunjit la întreg)
  if (s === 1) return 33;
  if (s === 2) return 67;
  return 100;
}

// Slug pt. ancore stabile (diacritice out)
export function makeAnchorId(title: string, idx: number) {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base || "problema"}-${idx}`;
}

/** Media de risc în procente 0..100 (rotunjit) dintr-un array de nivele eterogene */
export function calcRiskPercent(nivele: Array<string | number>): number {
  if (!nivele || nivele.length === 0) return 0;
  const scores = nivele.map(nivelToScore);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length; // 1..3
  const pct = (avg / 3) * 100;
  return Math.round(pct);
}

/** Parser + normalizator: folosește-l imediat după fetch */
export function normalizeAnalysis(json: unknown): NormalizedAnalysisResponse {
  const parsed = AnalysisResponseSchema.parse(json);

  const items: NormalizedIssueItem[] = parsed.probleme_identificate.map((p, idx) => {
    const score13 = nivelToScore(p.nivel_atentie);
    const percent = scoreToPercent(score13);
    const nivel_canonic = scoreToNivel(score13);
    const anchor_id = p.anchor_id && p.anchor_id.trim().length > 0
      ? p.anchor_id
      : makeAnchorId(p.titlu_problema, idx);

    return {
      titlu_problema: p.titlu_problema,
      clauza_originala: p.clauza_originala,
      categorie_problema: p.categorie_problema,
      explicatie_simpla: p.explicatie_simpla,
      nivel_atentie: nivel_canonic,
      score13: score13,
      percent,
      sugestie: p.sugestie,
      anchor_id,
      offset_start: p.offset_start,
      offset_end: p.offset_end,
    };
  });

  return {
    probleme_identificate: items,
    rezumat_executiv: parsed.rezumat_executiv,
    text_original: parsed.text_original,
  };
}
