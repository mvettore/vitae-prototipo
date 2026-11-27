import { VITAE_SCAN_PROMPT } from "../netlify/functions/_vitae-prompt.js";

// Ridimensiona lo screenshot: abbastanza grande da leggere i punteggi,
// abbastanza piccolo da stare nel limite di payload delle function.
export function resizeImage(file, maxPx = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Immagine non leggibile"));
    };
    img.src = url;
  });
}

const toPart = (dataUrl) => ({
  base64: dataUrl.split(",")[1],
  mediaType: dataUrl.split(";")[0].split(":")[1] || "image/jpeg",
});

function parseJSON(raw) {
  const clean = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(clean);
}

export async function scanVitae(dataUrls) {
  const images = dataUrls.map(toPart);
  const local = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const devKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  // In sviluppo locale senza `netlify dev` si può chiamare l'API direttamente.
  if (local && devKey) {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": devKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: "claude-haiku-5-5",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: [
            ...images.map((i) => ({ type: "image", source: { type: "base64", media_type: i.mediaType, data: i.base64 } })),
            { type: "text", text: VITAE_SCAN_PROMPT },
          ],
        }],
      }),
    });
    if (!resp.ok) throw new Error(`API ${resp.status}`);
    const data = await resp.json();
    return parseJSON((data.content || []).filter((b) => b.type === "text").map((b) => b.text).join(""));
  }

  const resp = await fetch("/.netlify/functions/scan-vitae", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images }),
  });
  const raw = await resp.text();
  if (!resp.ok) {
    let detail = "";
    try { detail = JSON.parse(raw).error || ""; } catch { detail = raw.slice(0, 160); }
    throw new Error(detail || `Errore server ${resp.status}`);
  }
  return JSON.parse(raw);
}
