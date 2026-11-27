import React, { useState } from "react";
import { FavButton, Icon, IconButton, RatingBadge, typeKey } from "./ui.jsx";
import { REVIEW_FACTS, bestRating, fmtScore, latestRating, ratingValue, sortedRatings } from "../store.js";

function ListChips({ lists, active, onToggle, onManage }) {
  return (
    <div className="chip-row wrap center">
      {lists.map((l) => (
        <button key={l} type="button" className={`chip ${active.includes(l) ? "is-on" : ""}`} onClick={() => onToggle(l)}>
          {active.includes(l) ? "✓ " : "+ "}{l}
        </button>
      ))}
      <button type="button" className="chip chip-ghost" onClick={onManage}>Gestisci liste</button>
    </div>
  );
}

function Notes({ value, onChange, placeholder }) {
  return (
    <section className="block">
      <h3 className="block-title">Le mie note</h3>
      <textarea className="notes" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} />
      <p className="muted small">Visibili solo a te, salvate su questo dispositivo.</p>
    </section>
  );
}

function FactRows({ rows }) {
  const visible = rows.filter(([, v]) => v !== null && v !== undefined && v !== "");
  if (!visible.length) return null;
  return (
    <dl className="facts">
      {visible.map(([label, value]) => (
        <div key={label} className="fact">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const href = {
  map: (p) => (p.address || p.town ? `https://maps.apple.com/?q=${encodeURIComponent([p.name, p.address || p.town].join(", "))}` : null),
  mail: (p) => (p.email ? `mailto:${p.email}` : null),
  web: (p) => (p.website ? (/^https?:/.test(p.website) ? p.website : `https://${p.website}`) : null),
  tel: (p) => (p.phone ? `tel:${p.phone.replace(/[^\d+]/g, "")}` : null),
};

export function ProducerDetail({ producer: p, wines, lists, actions }) {
  const sorted = [...wines].sort((a, b) => ratingValue(latestRating(b)) - ratingValue(latestRating(a)) || a.name.localeCompare(b.name));
  const bar = [
    ["map", "sign", "Indicazioni"],
    ["mail", "mail", "Email"],
    ["web", "globe", "Sito web"],
    ["tel", "phone", "Telefono"],
  ];
  return (
    <article className="detail">
      <header className="producer-head">
        <div className="head-tools">
          <FavButton on={p.favorite} onToggle={() => actions.patch("producer", p.id, { favorite: !p.favorite })} size={24} />
        </div>
        <h1>{p.name}</h1>
        {p.owner && <p className="owner">{p.owner}</p>}
        <div className="contacts">
          {(p.address || p.town) && <div>{p.address || p.town}{p.region && !p.address ? `, ${p.region}` : ""}</div>}
          {p.phone && <div>Tel. {p.phone}</div>}
          {p.email && <div>{p.email}</div>}
          {p.website && <div>{p.website.replace(/^https?:\/\//, "")}</div>}
        </div>
      </header>

      <nav className="action-bar">
        {bar.map(([k, icon, label]) => {
          const url = href[k](p);
          return url ? (
            <a key={k} href={url} target={k === "web" || k === "map" ? "_blank" : undefined} rel="noreferrer" aria-label={label}>
              <Icon name={icon} size={30} />
            </a>
          ) : (
            <span key={k} className="is-disabled" aria-label={`${label} non disponibile`}><Icon name={icon} size={30} /></span>
          );
        })}
      </nav>

      <FactRows rows={[
        ["Regione", p.region],
        ["Anno di fondazione", p.founded],
        ["Conduzione enologica", p.oenologist],
        ["Conduzione agronomica", p.agronomist],
        ["Viticoltura", p.viticulture],
        ["Bottiglie prodotte", p.bottles],
      ]} />
      {(p.visits || p.shop) && (
        <div className="services">
          {p.visits && <span><Icon name="open" size={22} /> Visite in cantina</span>}
          {p.shop && <span><Icon name="shop" size={22} /> Vendita diretta</span>}
        </div>
      )}

      <ListChips lists={lists} active={p.lists} onToggle={(l) => actions.toggleList("producer", p.id, l)} onManage={actions.manageLists} />

      <section className="block">
        <div className="block-head">
          <h3 className="block-title">{wines.length} {wines.length === 1 ? "vino recensito" : "vini recensiti"}</h3>
          <button className="btn btn-sm" onClick={() => actions.newWine(p.id)}><Icon name="plus" size={16} /> Vino</button>
        </div>
        {sorted.length === 0 ? (
          <p className="muted">Nessun vino ancora: aggiungilo a mano o da uno screenshot.</p>
        ) : (
          <ul className="wine-rows">
            {sorted.map((w) => {
              const r = latestRating(w);
              return (
                <li key={w.id}>
                  <button className="wine-row" onClick={() => actions.open("wine", w.id)}>
                    <span className="grow">
                      <span className="wine-row-title">{w.name}{r?.vintage ? ` ${r.vintage}` : ""}</span>
                      <span className="wine-row-sub">{[w.type, r?.price].filter(Boolean).join(" · ")}</span>
                    </span>
                    <RatingBadge rating={r} type={w.type} size="sm" />
                    {w.favorite && <Icon name="star" size={14} filled style={{ color: "var(--gold)" }} />}
                    <Icon name="chevron" size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Notes value={p.notes} onChange={(notes) => actions.patch("producer", p.id, { notes })} placeholder="Visite, persone conosciute, impressioni sulla cantina…" />

      <div className="detail-actions">
        <button className="btn btn-sm" onClick={() => actions.editProducer(p)}><Icon name="edit" size={16} /> Modifica</button>
        <button className="btn btn-sm btn-danger" onClick={() => actions.deleteProducer(p)}><Icon name="trash" size={16} /> Elimina</button>
      </div>
    </article>
  );
}

export function WineDetail({ wine: w, producer, siblings, lists, actions }) {
  const ratings = sortedRatings(w);
  const [selId, setSelId] = useState(null);
  const r = ratings.find((x) => x.id === selId) || ratings[0] || null;

  return (
    <article className="detail">
      <header className={`wine-band band-${typeKey(w.type)}`}>
        <div className="head-tools">
          <FavButton on={w.favorite} onToggle={() => actions.patch("wine", w.id, { favorite: !w.favorite })} size={24} />
        </div>
        <h1>{w.name}{r?.vintage ? ` ${r.vintage}` : ""}</h1>
        {w.type && <p className="band-type">{w.type}</p>}
      </header>

      {ratings.length > 1 && (
        <div className="edition-switch" role="tablist" aria-label="Edizioni">
          {ratings.map((x) => (
            <button key={x.id} role="tab" aria-selected={x.id === r?.id} className={x.id === r?.id ? "is-on" : ""} onClick={() => setSelId(x.id)}>
              <span className="es-ed">Vitae {x.edition || "—"}</span>
              <span className="es-vin">{x.vintage || "s.a."}{x.score != null ? ` · ${fmtScore(x.score)}` : ""}</span>
            </button>
          ))}
        </div>
      )}

      {(w.denomination || w.grapes) && (
        <div className="grapes">
          {w.denomination && <div className="grapes-denom">{w.denomination}</div>}
          {w.grapes && w.grapes.split(/[,;]\s*/).map((g) => <div key={g}>{g}</div>)}
        </div>
      )}

      <div className="icon-row">
        <div><Icon name="sign" size={24} /><span>{producer?.region || "—"}</span></div>
        <div><Icon name="building" size={24} /><span>{w.classification || "—"}</span></div>
        <div><Icon name="glass" size={24} /><span>{r?.format || "0,750l"}</span></div>
        <div><span className="euro">€</span><span>{r?.price ? r.price.replace(/^€\s*/, "€ ") : "—"}</span></div>
      </div>

      <dl className="facts">
        <div className="fact">
          <dt>Valutazione{r?.edition ? <small> Vitae {r.edition}</small> : null}</dt>
          <dd>{r ? <RatingBadge rating={r} type={w.type} size="lg" /> : <span className="muted">—</span>}</dd>
        </div>
      </dl>
      {r && <FactRows rows={REVIEW_FACTS.filter(([k]) => k !== "format").map(([k, label]) => [label, r[k]])} />}

      {producer && (
        <button className="fact-link" onClick={() => actions.open("producer", producer.id)}>
          <span>Produttore</span>
          <span className="fact-link-val">{producer.name} <Icon name="chevron" size={18} /></span>
        </button>
      )}

      <ListChips lists={lists} active={w.lists} onToggle={(l) => actions.toggleList("wine", w.id, l)} onManage={actions.manageLists} />

      <Notes value={w.notes} onChange={(notes) => actions.patch("wine", w.id, { notes })} placeholder="Assaggi, abbinamenti provati, dove l'hai trovato e a che prezzo…" />

      <section className="block">
        <div className="block-head">
          <h3 className="block-title">Storico nelle edizioni</h3>
          <button className="btn btn-sm" onClick={() => actions.newRating(w.id)}><Icon name="plus" size={16} /> Edizione</button>
        </div>
        {ratings.length === 0 ? (
          <p className="muted">Nessuna valutazione registrata.</p>
        ) : (
          <table className="history">
            <thead><tr><th>Edizione</th><th>Annata</th><th>Valutazione</th><th aria-label="Azioni" /></tr></thead>
            <tbody>
              {ratings.map((x) => (
                <tr key={x.id} className={x.id === r?.id ? "is-sel" : ""} onClick={() => setSelId(x.id)}>
                  <td className="num">{x.edition || "—"}</td>
                  <td className="num">{x.vintage || "—"}</td>
                  <td><RatingBadge rating={x} type={w.type} size="sm" /></td>
                  <td className="row-actions" onClick={(e) => e.stopPropagation()}>
                    <IconButton icon="edit" label="Modifica valutazione" onClick={() => actions.editRating(w.id, x)} />
                    <IconButton icon="trash" label="Elimina valutazione" onClick={() => actions.deleteRating(w.id, x)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {siblings.length > 0 && (
        <section className="block">
          <h3 className="block-title">Altri vini di {producer?.name}</h3>
          <ul className="wine-rows">
            {siblings.map((s) => {
              const sr = latestRating(s);
              return (
                <li key={s.id}>
                  <button className="wine-row" onClick={() => actions.open("wine", s.id)}>
                    <span className="grow"><span className="wine-row-title">{s.name}{sr?.vintage ? ` ${sr.vintage}` : ""}</span></span>
                    <RatingBadge rating={sr} type={s.type} size="sm" />
                    <Icon name="chevron" size={16} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="detail-actions">
        <button className="btn btn-sm" onClick={() => actions.editWine(w)}><Icon name="edit" size={16} /> Modifica</button>
        <button className="btn btn-sm btn-danger" onClick={() => actions.deleteWine(w)}><Icon name="trash" size={16} /> Elimina</button>
      </div>
    </article>
  );
}

export { bestRating };
