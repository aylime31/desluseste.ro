// src/lib/api.ts
import { normalizeAnalysis, type NormalizedAnalysisResponse } from "./schemas";
import { AnalysisResponseSchema } from "./schemas";

const DEFAULT_ENDPOINT =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  "https://desluseste-ro.onrender.com/analizeaza-pdf/";

const TIMEOUT_MS = 60_000; // 60s hard cap

/**
 * Trimite un PDF către backend pentru analiză și validează răspunsul.
 * Aruncă erori clare, scurte și localizate.
 */
export async function analizeazaPdf(
  file: File,
  endpoint: string = DEFAULT_ENDPOINT
): Promise<NormalizedAnalysisResponse> {
  if (!(file instanceof File)) {
    throw new Error("Fișier invalid. Încarcă un PDF real.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let resp: Response;
  try {
    resp = await fetch(endpoint, {
      method: "POST",
      body: formData,
      credentials: "omit",
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === "AbortError") throw new Error("Timpul de analiză a expirat (server lent).");
    throw new Error("Eroare de rețea. Verifică conexiunea sau reîncearcă peste câteva secunde.");
  }

  clearTimeout(timeout);

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    // Render dă 502/504 la cold start – dăm retry scurt
    if ([502, 503, 504].includes(resp.status)) {
      await new Promise((r) => setTimeout(r, 1500));
      return analizeazaPdf(file, endpoint);
    }
    throw new Error(`Eroare server (${resp.status}): ${text.slice(0, 200)}`);
  }

  let json: unknown;
  try {
    json = await resp.json();
  } catch {
    throw new Error("Răspuns corupt (nu e JSON valid).");
  }

  const parsed = AnalysisResponseSchema.safeParse(json);
  if (!parsed.success) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Schema mismatch:", parsed.error.flatten());
    }
    throw new Error("Răspuns nevalid de la server (schema nu corespunde).");
  }

  // Normalizează imediat pt. UI — scapă de orice text inconsistent
  return normalizeAnalysis(parsed.data);
}
