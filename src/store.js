// Dati del Taccuino: tutto in localStorage, nessun server.
// Struttura:
//   producers: [{ id, name, region, town, website, favorite, notes, lists[], createdAt, updatedAt }]
//   wines:     [{ id, producerId, name, denomination, type, grape, favorite, notes, lists[], ratings[], createdAt, updatedAt }]
//   ratings:   [{ id, edition, vintage, viti, score, tastevin, selection, price }]
//   lists:     ["Da provare", ...]
//   recent:    [{ kind: "producer"|"wine", id }]

const KEY = "taccuino-vitae-v1";

export const WINE_TYPES = ["Rosso", "Bianco", "Rosato", "Spumante", "Dolce", "Passito"];
export const REGIONS = [
  "Valle d'Aosta", "Piemonte", "Lombardia", "Trentino-Alto Adige", "Veneto",
  "Friuli-Venezia Giulia", "Liguria", "Emilia-Romagna", "Toscana", "Umbria",
  "Marche", "Lazio", "Abruzzo", "Molise", "Campania", "Puglia", "Basilicata",
  "Calabria", "Sicilia", "Sardegna",
];

export const emptyData = () => ({
  version: 1,
  producers: [],
  wines: [],
  lists: ["Da provare", "Da comprare"],
  recent: [],
});

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyData();
    return sanitize(JSON.parse(raw));
  } catch {
    return emptyData();
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function sanitize(d) {
  const base = emptyData();
  if (!d || typeof d !== "object") return base;
  return {
    version: 1,
    producers: Array.isArray(d.producers) ? d.producers.map((p) => ({ lists: [], notes: "", favorite: false, ...p })) : [],
    wines: Array.isArray(d.wines) ? d.wines.map((w) => ({ lists: [], notes: "", favorite: false, ratings: [], ...w })) : [],
    lists: Array.isArray(d.lists) ? d.lists.filter((l) => typeof l === "string") : base.lists,
    recent: Array.isArray(d.recent) ? d.recent : [],
  };
}

export const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2));

export function norm(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const now = () => new Date().toISOString();

// ── Valutazioni ──────────────────────────────────────────────

// Valore numerico per ordinare: centesimi se ci sono, altrimenti viti
// convertite su scala 100 (solo per l'ordinamento, mai mostrato).
export function ratingValue(r) {
  if (!r) return -1;
  if (r.score != null && r.score !== "") return Number(r.score) + (r.tastevin ? 0.5 : 0);
  if (r.viti) return 78 + Number(r.viti) * 4 + (r.tastevin ? 2 : 0);
  return r.tastevin ? 95 : 0;
}

export function sortedRatings(wine) {
  return [...(wine.ratings || [])].sort(
    (a, b) => (b.edition || 0) - (a.edition || 0) || (b.vintage || 0) - (a.vintage || 0)
  );
}

export const latestRating = (wine) => sortedRatings(wine)[0] || null;

export function bestRating(wine) {
  return (wine.ratings || []).reduce((best, r) => (ratingValue(r) > ratingValue(best) ? r : best), null);
}

// ── Mutazioni (restituiscono sempre un nuovo oggetto dati) ──

export function upsertProducer(data, p) {
  if (p.id && data.producers.some((x) => x.id === p.id)) {
    return { ...data, producers: data.producers.map((x) => (x.id === p.id ? { ...x, ...p, updatedAt: now() } : x)) };
  }
  const np = { lists: [], notes: "", favorite: false, ...p, id: p.id || uid(), createdAt: now(), updatedAt: now() };
  return { ...data, producers: [...data.producers, np] };
}

export function upsertWine(data, w) {
  if (w.id && data.wines.some((x) => x.id === w.id)) {
    return { ...data, wines: data.wines.map((x) => (x.id === w.id ? { ...x, ...w, updatedAt: now() } : x)) };
  }
  const nw = { lists: [], notes: "", favorite: false, ratings: [], ...w, id: w.id || uid(), createdAt: now(), updatedAt: now() };
  return { ...data, wines: [...data.wines, nw] };
}

export function patchItem(data, kind, id, patch) {
  const key = kind === "producer" ? "producers" : "wines";
  return {
    ...data,
    [key]: data[key].map((x) => (x.id === id ? { ...x, ...patch, updatedAt: now() } : x)),
  };
}

export function deleteProducer(data, id) {
  const wineIds = new Set(data.wines.filter((w) => w.producerId === id).map((w) => w.id));
  return {
    ...data,
    producers: data.producers.filter((p) => p.id !== id),
    wines: data.wines.filter((w) => w.producerId !== id),
    recent: data.recent.filter((r) => r.id !== id && !wineIds.has(r.id)),
  };
}

export function deleteWine(data, id) {
  return {
    ...data,
    wines: data.wines.filter((w) => w.id !== id),
    recent: data.recent.filter((r) => r.id !== id),
  };
}

export function saveRating(data, wineId, rating) {
  return {
    ...data,
    wines: data.wines.map((w) => {
      if (w.id !== wineId) return w;
      const exists = rating.id && w.ratings.some((r) => r.id === rating.id);
      const ratings = exists
        ? w.ratings.map((r) => (r.id === rating.id ? rating : r))
        : [...w.ratings, { ...rating, id: uid() }];
      return { ...w, ratings, updatedAt: now() };
    }),
  };
}

export function deleteRating(data, wineId, ratingId) {
  return {
    ...data,
    wines: data.wines.map((w) =>
      w.id === wineId ? { ...w, ratings: w.ratings.filter((r) => r.id !== ratingId), updatedAt: now() } : w
    ),
  };
}

export function pushRecent(data, kind, id) {
  const recent = [{ kind, id }, ...data.recent.filter((r) => r.id !== id)].slice(0, 12);
  return { ...data, recent };
}

export function toggleInList(data, kind, id, list) {
  const key = kind === "producer" ? "producers" : "wines";
  const item = data[key].find((x) => x.id === id);
  if (!item) return data;
  const lists = item.lists.includes(list) ? item.lists.filter((l) => l !== list) : [...item.lists, list];
  return patchItem(data, kind, id, { lists });
}

export function addList(data, name) {
  const n = name.trim();
  if (!n || data.lists.includes(n)) return data;
  return { ...data, lists: [...data.lists, n] };
}

export function renameList(data, from, to) {
  const t = to.trim();
  if (!t || data.lists.includes(t)) return data;
  const swap = (x) => ({ ...x, lists: x.lists.map((l) => (l === from ? t : l)) });
  return {
    ...data,
    lists: data.lists.map((l) => (l === from ? t : l)),
    producers: data.producers.map(swap),
    wines: data.wines.map(swap),
  };
}

export function removeList(data, name) {
  const drop = (x) => ({ ...x, lists: x.lists.filter((l) => l !== name) });
  return {
    ...data,
    lists: data.lists.filter((l) => l !== name),
    producers: data.producers.map(drop),
    wines: data.wines.map(drop),
  };
}

// ── Import da scheda letta con l'AI ──────────────────────────
// Unisce al taccuino esistente: produttore riconosciuto per nome,
// vino per nome+produttore, valutazione per edizione+annata.
export function mergeScan(data, scan) {
  let d = data;
  const pName = (scan.producer?.name || "").trim();
  if (!pName) throw new Error("Nome del produttore mancante");

  let producer = d.producers.find((p) => norm(p.name) === norm(pName));
  let producerNew = false;
  if (!producer) {
    d = upsertProducer(d, { name: pName, region: scan.producer.region || "", town: scan.producer.town || "" });
    producer = d.producers[d.producers.length - 1];
    producerNew = true;
  } else {
    const fill = {};
    if (!producer.region && scan.producer.region) fill.region = scan.producer.region;
    if (!producer.town && scan.producer.town) fill.town = scan.producer.town;
    if (Object.keys(fill).length) d = patchItem(d, "producer", producer.id, fill);
  }

  let winesNew = 0;
  let ratingsNew = 0;
  for (const sw of scan.wines || []) {
    const name = (sw.name || "").trim();
    if (!name) continue;
    let wine = d.wines.find((w) => w.producerId === producer.id && norm(w.name) === norm(name));
    if (!wine) {
      d = upsertWine(d, {
        producerId: producer.id,
        name,
        denomination: sw.denomination || "",
        type: WINE_TYPES.includes(sw.type) ? sw.type : "",
        grape: sw.grape || "",
      });
      wine = d.wines[d.wines.length - 1];
      winesNew++;
    }
    const hasRating = sw.edition || sw.viti || sw.score || sw.tastevin;
    if (!hasRating) continue;
    const rating = {
      edition: toInt(sw.edition),
      vintage: toInt(sw.vintage),
      viti: toInt(sw.viti),
      score: toInt(sw.score),
      tastevin: !!sw.tastevin,
      selection: sw.selection || "",
      price: sw.price ? String(sw.price) : "",
    };
    const dup = wine.ratings.find((r) => r.edition === rating.edition && r.vintage === rating.vintage);
    d = saveRating(d, wine.id, dup ? { ...dup, ...rating, id: dup.id } : rating);
    if (!dup) ratingsNew++;
  }
  return { data: d, producerId: producer.id, producerNew, winesNew, ratingsNew };
}

export function toInt(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}
