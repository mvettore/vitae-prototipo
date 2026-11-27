// Dati del Taccuino: tutto in localStorage, nessun server.
// Struttura:
//   producers: [{ id, name, region, town, website, favorite, notes, lists[], createdAt, updatedAt }]
//   wines:     [{ id, producerId, name, denomination, type, grape, favorite, notes, lists[], ratings[], createdAt, updatedAt }]
//   ratings:   [{ id, edition, vintage, score, viti, tastevin, selection, price, format,
//                 alcohol, bottles, fermentation, maturation, pairing }]
//   Una "valutazione" è la recensione di un'annata in una certa edizione della guida:
//   la scheda tecnica (alcol, bottiglie, affinamento…) cambia con l'annata, quindi sta qui.
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


// Scheda tecnica di un'annata recensita.
export const REVIEW_FACTS = [
  ["alcohol", "Alcol"],
  ["bottles", "Bottiglie"],
  ["fermentation", "Fermentazione"],
  ["maturation", "Mat./Aff."],
  ["format", "Formato"],
  ["pairing", "Abbinamento"],
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

export function hasSaved() {
  try { return localStorage.getItem(KEY) !== null; } catch { return false; }
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
    dataVersion: d.dataVersion,
    producers: Array.isArray(d.producers) ? d.producers.map((p) => ({ lists: [], notes: "", favorite: false, ...p })) : [],
    wines: Array.isArray(d.wines) ? d.wines.map((w) => ({ lists: [], notes: "", favorite: false, ratings: [], ...w })) : [],
    lists: Array.isArray(d.lists) ? d.lists.filter((l) => typeof l === "string") : base.lists,
    recent: Array.isArray(d.recent) ? d.recent : [],
  };
}


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
  if (r.score != null && r.score !== "") return Number(r.score) + (r.viti || 0) / 10 + (r.tastevin ? 0.05 : 0);
  if (r.viti) return 78 + Number(r.viti) * 4 + (r.tastevin ? 2 : 0);
  return r.tastevin ? 95 : 0;
}

export function sortedRatings(wine) {
  return [...(wine.ratings || [])].sort(
    (a, b) => (b.edition || 0) - (a.edition || 0) || (b.vintage || 0) - (a.vintage || 0)
  );
}

export const latestRating = (wine) => sortedRatings(wine)[0] || null;


// ── Mutazioni (restituiscono sempre un nuovo oggetto dati) ──



export function patchItem(data, kind, id, patch) {
  const key = kind === "producer" ? "producers" : "wines";
  return {
    ...data,
    [key]: data[key].map((x) => (x.id === id ? { ...x, ...patch, updatedAt: now() } : x)),
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

export function toInt(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}


export const fmtScore = (n) => (n == null ? "" : Number(n).toLocaleString("it-IT", { maximumFractionDigits: 1 }));
