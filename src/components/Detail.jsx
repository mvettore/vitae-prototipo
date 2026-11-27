import React from "react";
import { FavButton, Icon, IconButton, RatingBadge } from "./ui.jsx";
import { bestRating, latestRating, ratingValue, sortedRatings } from "../store.js";

function ListChips({ lists, active, onToggle, onManage }) {
  return (
    <div className="chip-row wrap">
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
    <section className="section">
      <h3 className="section-title">Le mie note</h3>
      <textarea
        className="notes"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
      />
      <p className="muted small">Salvate automaticamente su questo dispositivo.</p>
    </section>
  );
}

export function ProducerDetail({ producer, wines, lists, actions }) {
  const sorted = [...wines].sort((a, b) => ratingValue(bestRating(b)) - ratingValue(bestRating(a)) || a.name.localeCompare(b.name));
  return (
    <article className="detail">
      <header className="detail-head">
        <div className="eyebrow"><Icon name="building" size={14} /> Produttore</div>
        <div className="title-row">
          <h1>{producer.name}</h1>
          <FavButton on={producer.favorite} onToggle={() => actions.patch("producer", producer.id, { favorite: !producer.favorite })} size={26} />
        </div>
        <p className="subtitle">{[producer.town, producer.region].filter(Boolean).join(", ") || "Località non indicata"}</p>
        {producer.website && (
          <a className="link small" href={/^https?:/.test(producer.website) ? producer.website : `https://${producer.website}`} target="_blank" rel="noreferrer">
            {producer.website.replace(/^https?:\/\//, "")}
          </a>
        )}
        <div className="detail-actions">
          <button className="btn btn-sm" onClick={() => actions.editProducer(producer)}><Icon name="edit" size={16} /> Modifica</button>
          <button className="btn btn-sm btn-danger" onClick={() => actions.deleteProducer(producer)}><Icon name="trash" size={16} /> Elimina</button>
        </div>
      </header>

      <ListChips lists={lists} active={producer.lists} onToggle={(l) => actions.toggleList("producer", producer.id, l)} onManage={actions.manageLists} />

      <section className="section">
        <div className="section-head">
          <h3 className="section-title">Vini ({wines.length})</h3>
          <button className="btn btn-sm" onClick={() => actions.newWine(producer.id)}><Icon name="plus" size={16} /> Vino</button>
        </div>
        {sorted.length === 0 ? (
          <p className="muted">Nessun vino ancora. Aggiungilo a mano o da uno screenshot della scheda.</p>
        ) : (
          <ul className="mini-list">
            {sorted.map((w) => (
              <li key={w.id}>
                <button className="mini-item" onClick={() => actions.open("wine", w.id)}>
                  <span className="grow">
                    <span className="mini-title">{w.name}</span>
                    <span className="mini-sub">{w.denomination || w.type || " "}</span>
                  </span>
                  <RatingBadge rating={latestRating(w)} compact />
                  {w.favorite && <Icon name="star" size={14} filled style={{ color: "var(--gold)" }} />}
                  <Icon name="chevron" size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Notes value={producer.notes} onChange={(notes) => actions.patch("producer", producer.id, { notes })} placeholder="Visite, persone, impressioni sulla cantina…" />
    </article>
  );
}

export function WineDetail({ wine, producer, siblings, lists, actions }) {
  const ratings = sortedRatings(wine);
  return (
    <article className="detail">
      <header className="detail-head">
        <div className="eyebrow"><Icon name="glass" size={14} /> Vino{wine.type ? ` · ${wine.type}` : ""}</div>
        <div className="title-row">
          <h1>{wine.name}</h1>
          <FavButton on={wine.favorite} onToggle={() => actions.patch("wine", wine.id, { favorite: !wine.favorite })} size={26} />
        </div>
        {producer && (
          <button className="producer-link" onClick={() => actions.open("producer", producer.id)}>
            {producer.name}{producer.region ? ` · ${producer.region}` : ""} <Icon name="chevron" size={14} />
          </button>
        )}
        <p className="subtitle">{[wine.denomination, wine.grape].filter(Boolean).join(" · ")}</p>
        <div className="detail-actions">
          <button className="btn btn-sm" onClick={() => actions.editWine(wine)}><Icon name="edit" size={16} /> Modifica</button>
          <button className="btn btn-sm btn-danger" onClick={() => actions.deleteWine(wine)}><Icon name="trash" size={16} /> Elimina</button>
        </div>
      </header>

      <ListChips lists={lists} active={wine.lists} onToggle={(l) => actions.toggleList("wine", wine.id, l)} onManage={actions.manageLists} />

      <section className="section">
        <div className="section-head">
          <h3 className="section-title">Valutazioni Vitae</h3>
          <button className="btn btn-sm" onClick={() => actions.newRating(wine.id)}><Icon name="plus" size={16} /> Edizione</button>
        </div>
        {ratings.length === 0 ? (
          <p className="muted">Nessuna valutazione registrata.</p>
        ) : (
          <table className="ratings">
            <thead>
              <tr><th>Edizione</th><th>Annata</th><th>Valutazione</th><th aria-label="Azioni" /></tr>
            </thead>
            <tbody>
              {ratings.map((r) => (
                <tr key={r.id}>
                  <td className="num">{r.edition || "—"}</td>
                  <td className="num">{r.vintage || "—"}</td>
                  <td>
                    <RatingBadge rating={r} />
                    {r.price && <span className="muted small"> · {r.price}</span>}
                  </td>
                  <td className="row-actions">
                    <IconButton icon="edit" label="Modifica valutazione" onClick={() => actions.editRating(wine.id, r)} />
                    <IconButton icon="trash" label="Elimina valutazione" onClick={() => actions.deleteRating(wine.id, r)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Notes value={wine.notes} onChange={(notes) => actions.patch("wine", wine.id, { notes })} placeholder="Assaggi, abbinamenti, dove l'hai trovato e a che prezzo…" />

      {siblings.length > 0 && (
        <section className="section">
          <h3 className="section-title">Altri vini di {producer?.name}</h3>
          <ul className="mini-list">
            {siblings.map((w) => (
              <li key={w.id}>
                <button className="mini-item" onClick={() => actions.open("wine", w.id)}>
                  <span className="grow"><span className="mini-title">{w.name}</span></span>
                  <RatingBadge rating={latestRating(w)} compact />
                  <Icon name="chevron" size={16} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
