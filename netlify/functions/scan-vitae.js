/**
 * Netlify Function: scan-vitae
 * Legge uno o due screenshot di una scheda Vitae e restituisce produttore,
 * vini e valutazioni in JSON.
 */
import { callClaudeVision, parseJSONResponse, hasKey } from "./_ai.js";
import { VITAE_SCAN_PROMPT } from "./_vitae-prompt.js";

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const handler = async (event, context) => {
  if (event.httpMethod === "GET") return json(200, { ok: true, hasKey: hasKey() });
  if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });
  if (!hasKey()) return json(500, { error: "ANTHROPIC_API_KEY non configurata su Netlify" });

  let body;
  try { body = JSON.parse(event.body); } catch { return json(400, { error: "Body non valido" }); }
  const images = (body.images || []).filter((i) => i?.base64 && i?.mediaType).slice(0, 4);
  if (!images.length) return json(400, { error: "Nessuna immagine" });

  // Torna un errore leggibile prima che la piattaforma uccida la function.
  const remaining = typeof context?.getRemainingTimeInMillis === "function" ? context.getRemainingTimeInMillis() : 10000;
  const budget = Math.max(3000, remaining - 1500);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), budget);

  try {
    const raw = await callClaudeVision({ prompt: VITAE_SCAN_PROMPT, images, signal: controller.signal });
    const parsed = parseJSONResponse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return json(500, { error: "Risposta AI non valida" });
    return json(200, parsed);
  } catch (err) {
    if (err.name === "AbortError") return json(504, { error: `Timeout dopo ${Math.round(budget / 1000)}s: riprova con uno screenshot solo` });
    return json(err.status || 500, { error: err.message });
  } finally {
    clearTimeout(timer);
  }
};
