import React, { useEffect, useMemo, useRef, useState } from "react";
import * as S from "./store.js";
import { Empty, FavButton, Icon, IconButton, RatingBadge } from "./components/ui.jsx";
import { ProducerDetail, WineDetail } from "./components/Detail.jsx";
import { ListsManager, ProducerForm, RatingForm, WineForm } from "./components/Forms.jsx";
import { ScanDialog } from "./components/ScanDialog.jsx";

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

export default function App() {
  const [data, setData] = useState(S.load);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all"); // all | producers | wines | fav | list:<nome>
  const [region, setRegion] = useState("");
  const [edition, setEdition] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("name"); // name | rating | updated
  const [stack, setStack] = useState([]); // [{kind,id}] navigazione dentro il pannello di dettaglio
  const [dialog, setDialog] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const wide = useWide();
  const searchRef = useRef(null);
  const importRef = useRef(null);

  useEffect(() => {
    if (!S.save(data)) flash("Spazio esaurito: esporta un backup");
  }, [data]);

  // "/" porta sempre alla ricerca (da tastiera, su iPad o desktop).
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

  const toastTimer = useRef(null);
  const flash = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };
  const update = (fn) => setData((d) => fn(d));

  const producerById = useMemo(() => Object.fromEntries(data.producers.map((p) => [p.id, p])), [data.producers]);
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

  // ── Filtro e ricerca ───────────────────────────────────────
  const { producers, wines } = useMemo(() => {
    const tokens = S.norm(query).split(" ").filter(Boolean);
    const ed = S.toInt(edition);
    const listName = scope.startsWith("list:") ? scope.slice(5) : null;

    const wineOk = (w) => {
      const p = producerById[w.producerId];
      if (region && p?.region !== region) return false;
      if (type && w.type !== type) return false;
      if (ed && !w.ratings.some((r) => r.edition === ed)) return false;
      if (scope === "fav" && !w.favorite) return false;
      if (listName && !w.lists.includes(listName)) return false;
      if (!tokens.length) return true;
      return matchesAll(S.norm([w.name, w.denomination, w.grape, w.type, w.notes, p?.name, p?.town, p?.region].join(" ")), tokens);
    };
    const producerOk = (p) => {
      if (region && p.region !== region) return false;
      if (type) return false; // la tipologia è un attributo dei vini
      if (ed && !(winesByProducer[p.id] || []).some((w) => w.ratings.some((r) => r.edition === ed))) return false;
      if (scope === "fav" && !p.favorite) return false;
      if (listName && !p.lists.includes(listName)) return false;
      if (!tokens.length) return true;
      return matchesAll(S.norm([p.name, p.town, p.region, p.notes].join(" ")), tokens);
    };

    const byName = (a, b) => a.name.localeCompare(b.name, "it");
    const byUpdated = (a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "");
    const producerScore = (p) => Math.max(-1, ...(winesByProducer[p.id] || []).map((w) => S.ratingValue(S.bestRating(w))));
    const sorters = {
      name: { p: byName, w: byName },
      updated: { p: byUpdated, w: byUpdated },
      rating: {
        p: (a, b) => producerScore(b) - producerScore(a) || byName(a, b),
        w: (a, b) => S.ratingValue(S.latestRating(b)) - S.ratingValue(S.latestRating(a)) || byName(a, b),
      },
    }[sort];

    return {
      producers: scope === "wines" ? [] : data.producers.filter(producerOk).sort(sorters.p),
      wines: scope === "producers" ? [] : data.wines.filter(wineOk).sort(sorters.w),
    };
  }, [data, query, scope, region, edition, type, sort, producerById, winesByProducer]);

  const listCounts = useMemo(() => {
    const c = {};
    [...data.producers, ...data.wines].forEach((x) => x.lists.forEach((l) => (c[l] = (c[l] || 0) + 1)));
    return c;
  }, [data]);

  // ── Navigazione: il dettaglio si apre sopra l'elenco ─────────
  const current = stack[stack.length - 1] || null;
  // Dentro la scheda (produttore → vino → …) si impila; "indietro" torna al passo prima.
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

  // Se l'elemento aperto viene eliminato, il pannello si chiude.
  useEffect(() => {
    setStack((s) => s.filter((e) => (e.kind === "producer" ? producerById[e.id] : data.wines.some((w) => w.id === e.id))));
  }, [producerById, data.wines]);

  // ── Azioni ──────────────────────────────────────────────────
  const actions = {
    open,
    patch: (kind, id, patch) => update((d) => S.patchItem(d, kind, id, patch)),
    toggleList: (kind, id, l) => update((d) => S.toggleInList(d, kind, id, l)),
    manageLists: () => setDialog({ type: "lists" }),
    editProducer: (p) => setDialog({ type: "producer", initial: p }),
    editWine: (w) => setDialog({ type: "wine", initial: w }),
    newWine: (producerId) => setDialog({ type: "wine", initial: { producerId } }),
    newRating: (wineId) => setDialog({ type: "rating", wineId }),
    editRating: (wineId, r) => setDialog({ type: "rating", wineId, initial: r }),
    deleteRating: (wineId, r) => {
      if (confirm(`Eliminare la valutazione dell'edizione ${r.edition || ""}?`)) update((d) => S.deleteRating(d, wineId, r.id));
    },
    deleteProducer: (p) => {
      const n = (winesByProducer[p.id] || []).length;
      if (confirm(`Eliminare ${p.name}${n ? ` e i suoi ${n} vini` : ""} dal taccuino?`)) {
        update((d) => S.deleteProducer(d, p.id));
        flash("Produttore eliminato");
      }
    },
    deleteWine: (w) => {
      if (confirm(`Eliminare ${w.name} dal taccuino?`)) {
        update((d) => S.deleteWine(d, w.id));
        flash("Vino eliminato");
      }
    },
  };

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `taccuino-vitae-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const importBackup = async (file) => {
    try {
      const incoming = S.sanitize(JSON.parse(await file.text()));
      if (!confirm(`Sostituire il taccuino con il backup (${incoming.producers.length} produttori, ${incoming.wines.length} vini)?`)) return;
      setData(incoming);
      setStack([]);
      flash("Backup ripristinato");
    } catch {
      flash("File di backup non valido");
    }
  };

  // ── Render ──────────────────────────────────────────────────
  const scopes = [
    { k: "all", l: "Tutto" },
    { k: "producers", l: "Produttori" },
    { k: "wines", l: "Vini" },
    { k: "fav", l: "★ Preferiti" },
    ...data.lists.map((l) => ({ k: `list:${l}`, l, n: listCounts[l] || 0 })),
  ];
  const activeFilters = [region, edition, type].filter(Boolean).length + (sort !== "name" ? 1 : 0);
  const filtering = query || region || edition || type || scope !== "all";
  const recents = !filtering
    ? data.recent
        .map((r) => (r.kind === "producer" ? producerById[r.id] && { ...r, item: producerById[r.id] } : (() => {
          const w = data.wines.find((x) => x.id === r.id);
          return w && { ...r, item: w };
        })()))
        .filter(Boolean)
        .slice(0, 8)
    : [];
  const isEmpty = data.producers.length === 0;

  const detail = current && (() => {
    if (current.kind === "producer") {
      const p = producerById[current.id];
      return p && <ProducerDetail producer={p} wines={winesByProducer[p.id] || []} lists={data.lists} actions={actions} />;
    }
    const w = data.wines.find((x) => x.id === current.id);
    if (!w) return null;
    const p = producerById[w.producerId];
    const siblings = (winesByProducer[w.producerId] || []).filter((x) => x.id !== w.id);
    return <WineDetail wine={w} producer={p} siblings={siblings} lists={data.lists} actions={actions} />;
  })();

  const crumbLabel = (e) => (e.kind === "producer" ? producerById[e.id]?.name : data.wines.find((w) => w.id === e.id)?.name) || "";

  const detailChrome = current && (
    <div className="detail-chrome">
      {stack.length > 1 ? (
        <button className="btn btn-sm btn-ghost" onClick={back}><Icon name="back" size={16} /> {crumbLabel(stack[stack.length - 2])}</button>
      ) : <span />}
      <IconButton icon="close" label="Chiudi scheda" onClick={closeDetail} />
    </div>
  );

  return (
    <div className={`app ${wide ? "is-wide" : ""}`}>
      <div className="pane-list">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <div>
              <div className="brand-name">Taccuino Vitae</div>
              <div className="brand-sub">{data.producers.length} produttori · {data.wines.length} vini</div>
            </div>
          </div>
          <div className="topbar-actions">
            <IconButton icon="camera" label="Aggiungi da scheda Vitae" onClick={() => setDialog({ type: "scan" })} />
            <IconButton icon="plus" label="Nuovo" onClick={() => setDialog({ type: "new" })} />
            <div className="menu-wrap">
              <IconButton icon="more" label="Altro" active={menuOpen} onClick={() => setMenuOpen((o) => !o)} />
              {menuOpen && (
                <>
                  <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
                  <div className="menu" role="menu">
                    <button role="menuitem" onClick={() => { setMenuOpen(false); setDialog({ type: "lists" }); }}>Le mie liste</button>
                    <button role="menuitem" onClick={() => { setMenuOpen(false); exportBackup(); }}>Esporta backup</button>
                    <button role="menuitem" onClick={() => { setMenuOpen(false); importRef.current?.click(); }}>Ripristina backup</button>
                  </div>
                </>
              )}
              <input ref={importRef} type="file" accept="application/json" hidden onChange={(e) => { e.target.files[0] && importBackup(e.target.files[0]); e.target.value = ""; }} />
            </div>
          </div>
        </header>

        <div className="search-zone">
          <div className="search">
            <Icon name="search" size={18} />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca produttori, vini, vitigni, note…"
              aria-label="Cerca"
              enterKeyHint="search"
            />
            {query && <button className="search-clear" onClick={() => { setQuery(""); searchRef.current?.focus(); }} aria-label="Cancella ricerca"><Icon name="close" size={16} /></button>}
            <button className={`filter-toggle ${filtersOpen || activeFilters ? "is-on" : ""}`} onClick={() => setFiltersOpen((o) => !o)} aria-expanded={filtersOpen}>
              Filtri{activeFilters > 0 && <span className="filter-count">{activeFilters}</span>}
            </button>
          </div>
          <div className="chip-row" role="tablist">
            {scopes.map((s) => (
              <button key={s.k} role="tab" aria-selected={scope === s.k} className={`chip ${scope === s.k ? "is-on" : ""}`} onClick={() => setScope(s.k)}>
                {s.l}{s.n != null && <span className="chip-n">{s.n}</span>}
              </button>
            ))}
          </div>
          {filtersOpen && <div className="filters">
            <select value={region} onChange={(e) => setRegion(e.target.value)} aria-label="Regione">
              <option value="">Tutte le regioni</option>
              {S.REGIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
            <select value={edition} onChange={(e) => setEdition(e.target.value)} aria-label="Edizione">
              <option value="">Tutte le edizioni</option>
              {editions.map((e) => <option key={e} value={e}>Vitae {e}</option>)}
            </select>
            <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Tipologia">
              <option value="">Tutte le tipologie</option>
              {S.WINE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordina">
              <option value="name">A–Z</option>
              <option value="rating">Punteggio</option>
              <option value="updated">Modificati di recente</option>
            </select>
          </div>}
        </div>

        <main className="results">
          {isEmpty ? (
            <Empty title="Il taccuino è vuoto">
              <p>Aggiungi un produttore a mano, oppure carica lo screenshot di una scheda dall'app Vitae: produttore, vini e punteggi vengono letti in automatico.</p>
              <div className="empty-actions">
                <button className="btn btn-primary" onClick={() => setDialog({ type: "scan" })}><Icon name="camera" size={16} /> Da scheda Vitae</button>
                <button className="btn" onClick={() => setDialog({ type: "producer" })}><Icon name="plus" size={16} /> Produttore</button>
              </div>
            </Empty>
          ) : (
            <>
              {recents.length > 0 && (
                <section className="group">
                  <h2 className="group-title">Recenti</h2>
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

              {producers.length > 0 && (
                <section className="group">
                  <h2 className="group-title">Produttori <span className="muted">{producers.length}</span></h2>
                  <ul className="cards">
                    {producers.map((p) => {
                      const ws = winesByProducer[p.id] || [];
                      const best = ws.map(S.bestRating).filter(Boolean).sort((a, b) => S.ratingValue(b) - S.ratingValue(a))[0];
                      return (
                        <li key={p.id}>
                          <div role="button" tabIndex={0} className={`card ${current?.id === p.id ? "is-current" : ""}`}
                            onClick={() => openFromList("producer", p.id)}
                            onKeyDown={(e) => e.key === "Enter" && openFromList("producer", p.id)}>
                            <div className="card-main">
                              <div className="card-title">{p.name}</div>
                              <div className="card-sub">
                                {[p.town, p.region].filter(Boolean).join(", ")}{(p.town || p.region) ? " · " : ""}{ws.length} {ws.length === 1 ? "vino" : "vini"}
                              </div>
                              <div className="card-meta">
                                {best && <RatingBadge rating={best} compact />}
                                {p.notes && <span className="meta-note"><Icon name="note" size={14} /> nota</span>}
                                {p.lists.map((l) => <span key={l} className="tag">{l}</span>)}
                              </div>
                            </div>
                            <FavButton on={p.favorite} onToggle={() => actions.patch("producer", p.id, { favorite: !p.favorite })} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {wines.length > 0 && (
                <section className="group">
                  <h2 className="group-title">Vini <span className="muted">{wines.length}</span></h2>
                  <ul className="cards">
                    {wines.map((w) => {
                      const p = producerById[w.producerId];
                      const r = edition ? w.ratings.find((x) => x.edition === S.toInt(edition)) : S.latestRating(w);
                      return (
                        <li key={w.id}>
                          <div role="button" tabIndex={0} className={`card ${current?.id === w.id ? "is-current" : ""}`}
                            onClick={() => openFromList("wine", w.id)}
                            onKeyDown={(e) => e.key === "Enter" && openFromList("wine", w.id)}>
                            {w.type && <span className={`type-dot type-${S.norm(w.type)}`} title={w.type} />}
                            <div className="card-main">
                              <div className="card-title">{w.name}</div>
                              <div className="card-sub">{p?.name}{w.denomination ? ` · ${w.denomination}` : ""}</div>
                              <div className="card-meta">
                                {r && <><RatingBadge rating={r} compact /><span className="muted small">{r.edition ? `Vitae ${r.edition}` : ""}{r.vintage ? ` · ${r.vintage}` : ""}</span></>}
                                {w.notes && <span className="meta-note"><Icon name="note" size={14} /> nota</span>}
                                {w.lists.map((l) => <span key={l} className="tag">{l}</span>)}
                              </div>
                            </div>
                            <FavButton on={w.favorite} onToggle={() => actions.patch("wine", w.id, { favorite: !w.favorite })} />
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
                  {filtering && (
                    <button className="btn" onClick={() => { setQuery(""); setScope("all"); setRegion(""); setEdition(""); setType(""); }}>Azzera tutto</button>
                  )}
                </Empty>
              )}
            </>
          )}
        </main>
      </div>

      {wide ? (
        <aside className="pane-detail">
          {detail ? <>{detailChrome}{detail}</> : (
            <Empty title="Seleziona un produttore o un vino">
              <p>La scheda si apre qui accanto: l'elenco e la ricerca restano dove sono.</p>
            </Empty>
          )}
        </aside>
      ) : (
        detail && (
          <div className="sheet-overlay" onMouseDown={(e) => e.target === e.currentTarget && closeDetail()}>
            <div className="sheet" role="dialog" aria-modal="true">
              <div className="sheet-grip" />
              {detailChrome}
              <div className="sheet-body">{detail}</div>
            </div>
          </div>
        )
      )}

      {/* ── Dialog ── */}
      {dialog?.type === "new" && (
        <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setDialog(null)}>
          <div className="dialog dialog-choice">
            <h2>Aggiungi</h2>
            <button className="choice" onClick={() => setDialog({ type: "scan" })}><Icon name="camera" /> <span><b>Da scheda Vitae</b><small>Screenshot dall'app o foto della guida</small></span></button>
            <button className="choice" onClick={() => setDialog({ type: "producer" })}><Icon name="building" /> <span><b>Produttore</b><small>Inserimento manuale</small></span></button>
            <button className="choice" onClick={() => setDialog({ type: "wine" })}><Icon name="glass" /> <span><b>Vino</b><small>Inserimento manuale</small></span></button>
            <button className="btn" onClick={() => setDialog(null)}>Annulla</button>
          </div>
        </div>
      )}
      {dialog?.type === "producer" && (
        <ProducerForm
          initial={dialog.initial}
          onClose={() => setDialog(null)}
          onSave={(p) => {
            const isNew = !p.id;
            const id = p.id || S.uid();
            update((d) => S.upsertProducer(d, { ...p, id }));
            setDialog(null);
            if (isNew) openFromList("producer", id);
          }}
        />
      )}
      {dialog?.type === "wine" && (
        <WineForm
          initial={dialog.initial}
          producers={data.producers}
          onClose={() => setDialog(null)}
          onSave={(w, producerName) => {
            const isNew = !w.id;
            const id = w.id || S.uid();
            const found = data.producers.find((p) => S.norm(p.name) === S.norm(producerName));
            const producerId = found?.id || S.uid();
            update((d) => {
              const withProducer = found ? d : S.upsertProducer(d, { id: producerId, name: producerName, region: "", town: "" });
              return S.upsertWine(withProducer, { ...w, id, producerId });
            });
            setDialog(null);
            if (isNew) open("wine", id);
          }}
        />
      )}
      {dialog?.type === "rating" && (
        <RatingForm
          initial={dialog.initial}
          onClose={() => setDialog(null)}
          onSave={(r) => { update((d) => S.saveRating(d, dialog.wineId, r)); setDialog(null); }}
        />
      )}
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
      {dialog?.type === "scan" && (
        <ScanDialog
          onClose={() => setDialog(null)}
          onImport={(scan) => {
            try {
              const res = S.mergeScan(data, scan);
              setData(res.data);
              setDialog(null);
              openFromList("producer", res.producerId);
              flash(`${res.producerNew ? "Nuovo produttore" : "Produttore aggiornato"} · ${res.winesNew} vini nuovi · ${res.ratingsNew} valutazioni`);
            } catch (e) {
              flash(e.message);
            }
          }}
        />
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
