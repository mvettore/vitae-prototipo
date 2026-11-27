/**
 * Chiamata ad Anthropic Claude con immagini. Il prefisso underscore evita
 * che Netlify lo esponga come endpoint.
 */
const MODEL_VISION = process.env.CLAUDE_MODEL_VISION || "claude-haiku-5-5";

export function hasKey() {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function callClaudeVision({ prompt, images, maxTokens = 3000, signal }) {
  const content = images.map((img) => ({
    type: "image",
    source: { type: "base64", media_type: img.mediaType || "image/jpeg", data: img.base64 },
  }));
  content.push({ type: "text", text: prompt });

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: MODEL_VISION, max_tokens: maxTokens, messages: [{ role: "user", content }] }),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    const err = new Error(`Anthropic ${resp.status}: ${text.slice(0, 300)}`);
    err.status = resp.status;
    throw err;
  }
  const data = await resp.json();
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
  if (!text) throw new Error("Risposta vuota");
  return text;
}

export function parseJSONResponse(raw) {
  const clean = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(clean);
}
