import React, { useEffect, useMemo, useRef, useState } from "react";
import * as S from "./store.js";
import { refreshCatalog, resetPersonal } from "./demo.js";
import { Empty, FavButton, Icon, IconButton, Logo, RatingBadge } from "./components/ui.jsx";
import { ProducerDetail, WineDetail } from "./components/Detail.jsx";
import { CURRENT_EDITION, ListsManager } from "./components/Forms.jsx";

function useWide() {
  const q = "(min-width: 900px)";
  const [wide, setWide] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setWide(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return wide;
}

const matchesAll = (haystack, tokens) => tokens.every((t) => haystack.includes(t));

// Sezioni sfogliabili, come nel menu dell'app ufficiale.
const BROWSE = [
  { k: "all", l: "Tutto" },
  { k: "wines", l: "Vini" },
  { k: "producers", l: "Produttori" },
  { k: "denominations", l: "Denominazioni" },
  { k: "grapes", l: "Vitigni" },
  { k: "fav", l: "★ Preferiti" },
];

const grapeNames = (w) => (w.grapes || "").split(/[,;]/).map((g) => g.replace(/\d+\s*%/, "").trim()).filter(Boolean);
const priceNum = (r) => parseFloat((r?.price || "").replace(/[^\d,.]/g, "").replace(",", ".")) || Infinity;

export default function App() {
  const [data, setData] = useState(() => refreshCatalog(S.hasSaved() ? S.load() : null));
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all"); // vedi BROWSE, oppure list:<nome>
  const [facet, setFacet] = useState(null); // { kind: "denomination"|"grape", value }
  const [region, setRegion] = useState("");
  const [edition, setEdition] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("name");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [stack, setStack] = useState([]); // [{kind,id}] navigazione dentro la scheda
  const [dialog, setDialog] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const wide = useWide();
  const searchRef = useRef(null);
  const toastTimer = useRef(null);
  const detailRef = useRef(null);

  const flash = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };
  const update = (fn) => setData((d) => fn(d));

  useEffect(() => {
    if (!S.save(data)) flash("Spazio esaurito: esporta un backup");
  }, [data]);

  // "/" porta alla ricerca da tastiera (iPad con tastiera, desktop).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const producerById = useMemo(() => Object.fromEntries(data.producers.map((p) => [p.id, p])), [data.producers]);
  const wineById = useMemo(() => Object.fromEntries(data.wines.map((w) => [w.id, w])), [data.wines]);
  const winesByProducer = useMemo(() => {
    const m = {};
    for (const w of data.wines) (m[w.producerId] ||= []).push(w);
    return m;
  }, [data.wines]);

  const editions = useMemo(() => {
    const s = new Set();
    data.wines.forEach((w) => w.ratings.forEach((r) => r.edition && s.add(r.edition)));
    return [...s].sort((a, b) => b - a);
  }, [data.wines]);
  const shownEdition = S.toInt(edition) || editions[0] || CURRENT_EDITION;

  // Valutazione da mostrare in elenco: quella dell'edizione filtrata, altrimenti la più recente.
  const ratingFor = (w) => (edition ? w.ratings.find((r) => r.edition === S.toInt(edition)) : S.latestRating(w)) || null;

  // ── Filtro e ricerca ───────────────────────────────────────
  const tokens = useMemo(() => S.norm(query).split(" ").filter(Boolean), [query]);
  const { producers, wines } = useMemo(() => {
    const ed = S.toInt(edition);
    const listName = scope.startsWith("list:") ? scope.slice(5) : null;
    const wineOk = (w) => {
      const p = producerById[w.producerId];
      if (region && p?.region !== region) return false;
      if (type && w.type !== type) return false;
      if (ed && !w.ratings.some((r) => r.edition === ed)) return false;
      if (scope === "fav" && !w.favorite) return false;
      if (listName && !w.lists.includes(listName)) return false;
      if (facet?.kind === "denomination" && w.denomination !== facet.value) return false;
      if (facet?.kind === "grape" && !grapeNames(w).includes(facet.value)) return false;
      if (!tokens.length) return true;
      return matchesAll(S.norm([w.name, w.denomination, w.classification, w.grapes, w.type, w.notes, p?.name, p?.owner, p?.town, p?.region,
        ...w.ratings.map((r) => r.vintage)].join(" ")), tokens);
    };
    const producerOk = (p) => {
      if (facet || type) return false; // denominazione, vitigno e tipologia sono attributi dei vini
      if (region && p.region !== region) return false;
      if (ed && !(winesByProducer[p.id] || []).some((w) => w.ratings.some((r) => r.edition === ed))) return false;
      if (scope === "fav" && !p.favorite) return false;
      if (listName && !p.lists.includes(listName)) return false;
      if (!tokens.length) return true;
      return matchesAll(S.norm([p.name, p.owner, p.town, p.address, p.region, p.notes].join(" ")), tokens);
    };

    const byName = (a, b) => a.name.localeCompare(b.name, "it");
    const byUpdated = (a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "");
    const pScore = (p) => Math.max(-1, ...(winesByProducer[p.id] || []).map((w) => S.ratingValue(ratingFor(w))));
    const sorters = {
      name: [byName, byName],
      updated: [byUpdated, byUpdated],
      rating: [(a, b) => pScore(b) - pScore(a) || byName(a, b), (a, b) => S.ratingValue(ratingFor(b)) - S.ratingValue(ratingFor(a)) || byName(a, b)],
      price: [byName, (a, b) => priceNum(ratingFor(a)) - priceNum(ratingFor(b)) || byName(a, b)],
    }[sort];

    const showP = ["all", "producers", "fav"].includes(scope) || listName;
    const showW = ["all", "wines", "fav"].includes(scope) || listName || facet;
    return {
      producers: showP ? data.producers.filter(producerOk).sort(sorters[0]) : [],
      wines: showW ? data.wines.filter(wineOk).sort(sorters[1]) : [],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, tokens, scope, facet, region, edition, type, sort, producerById, winesByProducer]);

  // Denominazioni / vitigni con conteggio, per le sezioni sfogliabili.
  const groups = useMemo(() => {
    if (scope !== "denominations" && scope !== "grapes") return [];
    const m = new Map();
    for (const w of data.wines) {
      const keys = scope === "denominations" ? [w.denomination].filter(Boolean) : grapeNames(w);
      for (const k of keys) m.set(k, (m.get(k) || 0) + 1);
    }
    return [...m.entries()]
      .filter(([k]) => !tokens.length || matchesAll(S.norm(k), tokens))
      .sort((a, b) => a[0].localeCompare(b[0], "it"));
  }, [scope, data.wines, tokens]);

  const listCounts = useMemo(() => {
    const c = {};
    [...data.producers, ...data.wines].forEach((x) => x.lists.forEach((l) => (c[l] = (c[l] || 0) + 1)));
    return c;
  }, [data]);

  // ── Navigazione: la scheda si apre sopra (o accanto a) l'elenco ──
  const current = stack[stack.length - 1] || null;
  const open = (kind, id) => {
    setStack((s) => [...s.filter((e) => e.id !== id), { kind, id }].slice(-8));
    update((d) => S.pushRecent(d, kind, id));
  };
  const openFromList = (kind, id) => {
    setStack([{ kind, id }]);
    update((d) => S.pushRecent(d, kind, id));
  };
  const back = () => setStack((s) => s.slice(0, -1));
  const closeDetail = () => setStack([]);

  useEffect(() => {
    setStack((s) => s.filter((e) => (e.kind === "producer" ? producerById[e.id] : wineById[e.id])));
  }, [producerById, wineById]);

  // Ogni nuova scheda parte dall'alto (l'elenco invece resta dov'era).
  useEffect(() => { detailRef.current?.scrollTo(0, 0); }, [current?.id]);

  const goScope = (k) => { setScope(k); setFacet(null); setMenuOpen(false); };

  // ── Azioni ──────────────────────────────────────────────────
  const actions = {
    open,
    patch: (kind, id, patch) => update((d) => S.patchItem(d, kind, id, patch)),
    toggleList: (kind, id, l) => update((d) => S.toggleInList(d, kind, id, l)),
    manageLists: () => setDialog({ type: "lists" }),
  };

  const resetAll = () => {
    if (!confirm("Azzerare preferiti, liste e note del prototipo?")) return;
    setData(resetPersonal());
    setStack([]);
    flash("Prototipo azzerato");
  };

  // ── Render ──────────────────────────────────────────────────
  const listScopes = data.lists.map((l) => ({ k: `list:${l}`, l, n: listCounts[l] || 0 }));
  const activeFilters = [region, edition, type].filter(Boolean).length;
  const filtering = query || activeFilters || scope !== "all" || facet;
  const recents = !filtering
    ? data.recent
        .map((r) => ({ ...r, item: r.kind === "producer" ? producerById[r.id] : wineById[r.id] }))
        .filter((r) => r.item)
        .slice(0, 8)
    : [];
  const browsingGroups = (scope === "denominations" || scope === "grapes") && !facet;
  const priceOf = (r) => (r?.price ? r.price.replace(/^€\s*/, "€ ") : null);

  const detail = current && (() => {
    if (current.kind === "producer") {
      const p = producerById[current.id];
      return p && <ProducerDetail key={p.id} producer={p} wines={winesByProducer[p.id] || []} lists={data.lists} actions={actions} />;
    }
    const w = wineById[current.id];
    if (!w) return null;
    const siblings = (winesByProducer[w.producerId] || []).filter((x) => x.id !== w.id);
    return <WineDetail key={w.id} wine={w} producer={producerById[w.producerId]} siblings={siblings} lists={data.lists} actions={actions} />;
  })();

  const crumbLabel = (e) => (e.kind === "producer" ? producerById[e.id]?.name : wineById[e.id]?.name) || "";
  const detailChrome = current && (
    <div className="detail-chrome">
      {stack.length > 1 ? (
        <button className="btn-back" onClick={back}><Icon name="back" size={20} /> <span>{crumbLabel(stack[stack.length - 2])}</span></button>
      ) : <span />}
      <IconButton icon="close" label="Chiudi scheda" onClick={closeDetail} />
    </div>
  );

  return (
    <div className={`app ${wide ? "is-wide" : ""}`}>
      <div className="pane-list">
        <header className="topbar">
          <IconButton icon="menu" label="Menu" onClick={() => setMenuOpen(true)} />
          <button className="logo-btn" onClick={() => { goScope("all"); setQuery(""); closeDetail(); }} aria-label="Torna all'inizio">
            <Logo edition={shownEdition} />
          </button>
          <IconButton icon="star" label="Preferiti" onClick={() => goScope("fav")} active={scope === "fav"} filled={scope === "fav"} className="accent" />
        </header>
        <div className="proto-banner">Prototipo non ufficiale · dati inventati</div>

        <div className="search-zone">
          <div className="search">
            <Icon name="search" size={20} />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={scope === "denominations" ? "Cerca una denominazione" : scope === "grapes" ? "Cerca un vitigno" : "Cerca vini, produttori, denominazioni…"}
              aria-label="Cerca"
              enterKeyHint="search"
            />
            {query && <button className="search-clear" onClick={() => { setQuery(""); searchRef.current?.focus(); }} aria-label="Cancella ricerca"><Icon name="close" size={14} /></button>}
          </div>
          <div className="chip-row" role="tablist">
            {[...BROWSE, ...listScopes].map((s) => (
              <button key={s.k} role="tab" aria-selected={scope === s.k} className={`chip ${scope === s.k ? "is-on" : ""}`} onClick={() => goScope(s.k)}>
                {s.l}{s.n != null && <span className="chip-n">{s.n}</span>}
              </button>
            ))}
          </div>
          <div className="toolbar">
            <button className={`tool ${filtersOpen || activeFilters ? "is-on" : ""}`} onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}>
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M1 3h20M1 8h20M1 13h20" /><circle cx="6" cy="3" r="2" fill="var(--surface)" /><circle cx="15" cy="8" r="2" fill="var(--surface)" /><circle cx="8" cy="13" r="2" fill="var(--surface)" /></svg>
              Filtri{activeFilters > 0 && <span className="filter-count">{activeFilters}</span>}
            </button>
            <span className="tool-sep" />
            <label className="tool">
              Ordina
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordina">
                <option value="name">A–Z</option>
                <option value="rating">Punteggio</option>
                <option value="price">Prezzo</option>
                <option value="updated">Modificati di recente</option>
              </select>
            </label>
          </div>
          {filtersOpen && (
            <div className="filters">
              <select value={edition} onChange={(e) => setEdition(e.target.value)} aria-label="Edizione">
                <option value="">Tutte le edizioni</option>
                {editions.map((e) => <option key={e} value={e}>Vitae {e}</option>)}
              </select>
              <select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Regione">
                <option value="">Tutte le regioni</option>
                {S.REGIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
              <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Tipologia">
                <option value="">Tutte le tipologie</option>
                {S.WINE_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              {activeFilters > 0 && <button className="btn btn-sm" onClick={() => { setRegion(""); setEdition(""); setType(""); }}>Azzera</button>}
            </div>
          )}
          {facet && (
            <div className="facet">
              <span className="muted small">{facet.kind === "denomination" ? "Denominazione" : "Vitigno"}</span>
              <button className="chip is-on" onClick={() => setFacet(null)}>{facet.value} <Icon name="close" size={12} /></button>
            </div>
          )}
        </div>

        <main className="results">
          {browsingGroups ? (
            <ul className="group-list">
              {groups.map(([name, n]) => (
                <li key={name}>
                  <button className="group-row" onClick={() => { setFacet({ kind: scope === "denominations" ? "denomination" : "grape", value: name }); setQuery(""); }}>
                    <span className="grow">{name}</span>
                    <span className="muted">{n} {n === 1 ? "vino" : "vini"}</span>
                    <Icon name="chevron" size={16} />
                  </button>
                </li>
              ))}
              {groups.length === 0 && <Empty title="Nessun risultato" />}
            </ul>
          ) : (
            <>
              {recents.length > 0 && (
                <section className="group">
                  <h2 className="group-title">Visti di recente</h2>
                  <div className="recent-row">
                    {recents.map((r) => (
                      <button key={r.id} className="recent" onClick={() => openFromList(r.kind, r.id)}>
                        <Icon name={r.kind === "producer" ? "building" : "glass"} size={14} />
                        <span>{r.item.name}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {wines.length > 0 && (
                <section className="group">
                  <h2 className="group-title">Vini <span>{wines.length}</span></h2>
                  <ul className="cards">
                    {wines.map((w) => {
                      const p = producerById[w.producerId];
                      const r = ratingFor(w);
                      return (
                        <li key={w.id}>
                          <div role="button" tabIndex={0} className={`card ${current?.id === w.id ? "is-current" : ""}`}
                            onClick={() => openFromList("wine", w.id)} onKeyDown={(e) => e.key === "Enter" && openFromList("wine", w.id)}>
                            <div className="card-main">
                              <div className="card-title">{w.name}{r?.vintage ? ` ${r.vintage}` : ""}</div>
                              <div className="card-sub">{p?.name}</div>
                              <div className="card-facts">{[p?.region, w.type, priceOf(r)].filter(Boolean).join(" · ")}</div>
                              {(w.notes || w.lists.length > 0) && (
                                <div className="card-meta">
                                  {w.notes && <span className="meta-note"><Icon name="note" size={13} /> nota</span>}
                                  {w.lists.map((l) => <span key={l} className="tag">{l}</span>)}
                                </div>
                              )}
                            </div>
                            <div className="card-side">
                              <FavButton on={w.favorite} onToggle={() => actions.patch("wine", w.id, { favorite: !w.favorite })} />
                              <RatingBadge rating={r} type={w.type} size="sm" />
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {producers.length > 0 && (
                <section className="group">
                  <h2 className="group-title">Produttori <span>{producers.length}</span></h2>
                  <ul className="cards">
                    {producers.map((p) => {
                      const ws = winesByProducer[p.id] || [];
                      return (
                        <li key={p.id}>
                          <div role="button" tabIndex={0} className={`card ${current?.id === p.id ? "is-current" : ""}`}
                            onClick={() => openFromList("producer", p.id)} onKeyDown={(e) => e.key === "Enter" && openFromList("producer", p.id)}>
                            <div className="card-main">
                              <div className="card-title">{p.name}</div>
                              {p.owner && <div className="card-sub">{p.owner}</div>}
                              <div className="card-facts">{[p.region, `${ws.length} ${ws.length === 1 ? "vino" : "vini"}`].filter(Boolean).join(" · ")}</div>
                              {(p.notes || p.lists.length > 0) && (
                                <div className="card-meta">
                                  {p.notes && <span className="meta-note"><Icon name="note" size={13} /> nota</span>}
                                  {p.lists.map((l) => <span key={l} className="tag">{l}</span>)}
                                </div>
                              )}
                            </div>
                            <div className="card-side">
                              <FavButton on={p.favorite} onToggle={() => actions.patch("producer", p.id, { favorite: !p.favorite })} />
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {producers.length === 0 && wines.length === 0 && (
                <Empty title="Nessun risultato">
                  <p>Prova a cambiare ricerca o filtri.</p>
                  <button className="btn" onClick={() => { setQuery(""); goScope("all"); setRegion(""); setEdition(""); setType(""); }}>Azzera tutto</button>
                </Empty>
              )}
            </>
          )}
        </main>
      </div>

      {wide ? (
        <aside className="pane-detail" ref={detailRef}>
          {detail ? <>{detailChrome}{detail}</> : (
            <Empty title="Seleziona un vino o un produttore">
              <p>La scheda si apre qui accanto: elenco e ricerca restano dove sono.</p>
            </Empty>
          )}
        </aside>
      ) : (
        detail && (
          <div className="sheet-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeDetail()}>
            <div className="sheet" role="dialog" aria-modal="true">
              <div className="sheet-grip" />
              {detailChrome}
              <div className="sheet-body" ref={detailRef}>{detail}</div>
            </div>
          </div>
        )
      )}

      {/* ── Menu laterale ── */}
      {menuOpen && (
        <div className="drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && setMenuOpen(false)}>
          <nav className="drawer">
            <div className="drawer-logo"><Logo edition={shownEdition} /></div>
            {[...BROWSE, ...listScopes].map((b) => (
              <button key={b.k} className={scope === b.k ? "is-on" : ""} onClick={() => goScope(b.k)}>
                <span className="grow">{b.l}{b.n != null && <span className="muted"> · {b.n}</span>}</span>
                <Icon name="chevron" size={18} />
              </button>
            ))}
            <div className="drawer-label">Edizioni Vitae</div>
            <div className="drawer-editions">
              <button className={!edition ? "is-on" : ""} onClick={() => { setEdition(""); setMenuOpen(false); }}>Tutte</button>
              {editions.map((e) => (
                <button key={e} className={edition === String(e) ? "is-on" : ""} onClick={() => { setEdition(String(e)); setMenuOpen(false); }}>{e}</button>
              ))}
            </div>
            <div className="drawer-foot">
              <button onClick={() => { setMenuOpen(false); setDialog({ type: "lists" }); }}>Le mie liste</button>
              <button onClick={() => { setMenuOpen(false); resetAll(); }}>Azzera preferiti e note</button>
              <p className="muted small">Prototipo non ufficiale: produttori, vini e punteggi sono inventati. Preferiti, liste e note restano su questo dispositivo.</p>
            </div>
          </nav>
        </div>
      )}
      {/* ── Dialog ── */}
      {dialog?.type === "lists" && (
        <ListsManager
          lists={data.lists}
          counts={listCounts}
          onClose={() => setDialog(null)}
          onAdd={(n) => update((d) => S.addList(d, n))}
          onRename={(a, b) => { update((d) => S.renameList(d, a, b)); if (scope === `list:${a}`) setScope(`list:${b.trim()}`); }}
          onRemove={(n) => { update((d) => S.removeList(d, n)); if (scope === `list:${n}`) setScope("all"); }}
        />
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
