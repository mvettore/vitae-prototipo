import React, { useState } from "react";
import { Dialog, Field } from "./ui.jsx";
import { CLASSIFICATIONS, PRODUCER_FIELDS, REGIONS, REVIEW_FACTS, WINE_TYPES, norm, toInt, toNum } from "../store.js";

export const CURRENT_EDITION = 2027;

const placeholders = {
  owner: "es. Famiglia Rossi", address: "Via, numero - Comune (PR)", phone: "", email: "", website: "www…",
  founded: "es. 1950", oenologist: "", agronomist: "", viticulture: "es. Biologica", bottles: "es. 40.000",
  alcohol: "es. 14%", fermentation: "es. acciaio", maturation: "es. botte grande 24 mesi", format: "0,750l", pairing: "",
};

export function ProducerForm({ initial, onSave, onClose }) {
  const [p, setP] = useState(() => {
    const base = { name: "", visits: false, shop: false };
    for (const [k] of PRODUCER_FIELDS) base[k] = "";
    return { ...base, ...initial };
  });
  const set = (k) => (e) => setP({ ...p, [k]: e.target.value });
  const valid = p.name.trim().length > 0;
  return (
    <Dialog
      title={initial?.id ? "Modifica produttore" : "Nuovo produttore"}
      onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>Annulla</button>
        <button className="btn btn-primary" disabled={!valid} onClick={() => onSave({ ...p, name: p.name.trim() })}>Salva</button>
      </>}
    >
      <Field label="Nome"><input autoFocus value={p.name} onChange={set("name")} placeholder="Nome dell'azienda" /></Field>
      <div className="row-2">
        {PRODUCER_FIELDS.map(([k, label]) => (
          <Field key={k} label={label}>
            {k === "region" ? (
              <select value={p.region} onChange={set("region")}>
                <option value="">—</option>
                {REGIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            ) : (
              <input value={p[k] || ""} onChange={set(k)} placeholder={placeholders[k] || ""}
                inputMode={k === "phone" ? "tel" : k === "email" ? "email" : k === "website" ? "url" : undefined} />
            )}
          </Field>
        ))}
      </div>
      <label className="check"><input type="checkbox" checked={!!p.visits} onChange={(e) => setP({ ...p, visits: e.target.checked })} /> Visite in cantina</label>
      <label className="check"><input type="checkbox" checked={!!p.shop} onChange={(e) => setP({ ...p, shop: e.target.checked })} /> Vendita diretta</label>
    </Dialog>
  );
}

// Il produttore si sceglie scrivendo: se il nome non esiste viene creato.
export function WineForm({ initial, producers, onSave, onClose }) {
  const startProducer = producers.find((p) => p.id === initial?.producerId)?.name || "";
  const [w, setW] = useState({ name: "", denomination: "", classification: "", type: "", grapes: "", ...initial });
  const [producerName, setProducerName] = useState(startProducer);
  const set = (k) => (e) => setW({ ...w, [k]: e.target.value });
  const valid = w.name.trim() && producerName.trim();
  const existing = producers.find((p) => norm(p.name) === norm(producerName));
  return (
    <Dialog
      title={initial?.id ? "Modifica vino" : "Nuovo vino"}
      onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>Annulla</button>
        <button className="btn btn-primary" disabled={!valid} onClick={() => onSave({ ...w, name: w.name.trim() }, producerName.trim())}>Salva</button>
      </>}
    >
      <Field label="Produttore" hint={producerName && !existing ? "Nuovo produttore: verrà creato" : null}>
        <input list="producer-names" value={producerName} onChange={(e) => setProducerName(e.target.value)} placeholder="Cerca o scrivi" />
        <datalist id="producer-names">{producers.map((p) => <option key={p.id} value={p.name} />)}</datalist>
      </Field>
      <Field label="Nome del vino" hint="Senza annata: l'annata va nella valutazione">
        <input autoFocus={!!startProducer} value={w.name} onChange={set("name")} placeholder="es. Barbaresco Martinenga Riserva" />
      </Field>
      <div className="row-2">
        <Field label="Tipologia">
          <select value={w.type} onChange={set("type")}>
            <option value="">—</option>
            {WINE_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Classificazione">
          <select value={w.classification} onChange={set("classification")}>
            <option value="">—</option>
            {CLASSIFICATIONS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Denominazione"><input value={w.denomination} onChange={set("denomination")} placeholder="es. Barbaresco" /></Field>
        <Field label="Uvaggio"><input value={w.grapes} onChange={set("grapes")} placeholder="es. Nebbiolo 100%" /></Field>
      </div>
    </Dialog>
  );
}

export function RatingForm({ initial, onSave, onClose }) {
  const [r, setR] = useState(() => {
    const base = { edition: CURRENT_EDITION, vintage: "", score: "", viti: null, tastevin: false, price: "" };
    for (const [k] of REVIEW_FACTS) base[k] = "";
    return { ...base, ...initial, score: initial?.score != null ? String(initial.score).replace(".", ",") : "" };
  });
  const set = (k) => (e) => setR({ ...r, [k]: e.target.value });
  const edition = toInt(r.edition);
  const save = () => onSave({ ...r, edition, vintage: toInt(r.vintage), score: toNum(r.score) });
  return (
    <Dialog
      title={initial?.id ? "Modifica valutazione" : "Nuova valutazione"}
      onClose={onClose}
      footer={<>
        <button className="btn" onClick={onClose}>Annulla</button>
        <button className="btn btn-primary" disabled={!edition} onClick={save}>Salva</button>
      </>}
    >
      <div className="row-2">
        <Field label="Edizione Vitae"><input type="number" inputMode="numeric" value={r.edition ?? ""} onChange={set("edition")} /></Field>
        <Field label="Annata"><input type="number" inputMode="numeric" value={r.vintage ?? ""} onChange={set("vintage")} placeholder="es. 2021" /></Field>
        <Field label="Punteggio" hint={edition && edition < 2027 ? "I centesimi ci sono dall'edizione 2027" : null}>
          <input inputMode="decimal" value={r.score} onChange={set("score")} placeholder="es. 92,5" />
        </Field>
        <Field label="Prezzo"><input value={r.price || ""} onChange={set("price")} placeholder="es. € 36" /></Field>
      </div>
      <Field label="Viti">
        <div className="segmented">
          {[1, 2, 3, 4].map((n) => (
            <button type="button" key={n} className={r.viti === n ? "is-on" : ""} onClick={() => setR({ ...r, viti: r.viti === n ? null : n })}>{n}</button>
          ))}
        </div>
      </Field>
      <label className="check"><input type="checkbox" checked={!!r.tastevin} onChange={(e) => setR({ ...r, tastevin: e.target.checked })} /> Tastevin</label>
      <div className="row-2">
        {REVIEW_FACTS.map(([k, label]) => (
          <Field key={k} label={label}><input value={r[k] || ""} onChange={set(k)} placeholder={placeholders[k] || ""} /></Field>
        ))}
      </div>
    </Dialog>
  );
}

export function ListsManager({ lists, counts, onAdd, onRename, onRemove, onClose }) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState("");
  return (
    <Dialog title="Le mie liste" onClose={onClose}>
      <ul className="lists-manager">
        {lists.map((l) => (
          <li key={l}>
            {editing === l ? (
              <form onSubmit={(e) => { e.preventDefault(); onRename(l, editValue); setEditing(null); }} className="inline-form">
                <input autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                <button className="btn btn-primary btn-sm">OK</button>
              </form>
            ) : (
              <>
                <span className="grow">{l} <span className="muted">· {counts[l] || 0}</span></span>
                <button className="btn btn-sm" onClick={() => { setEditing(l); setEditValue(l); }}>Rinomina</button>
                <button className="btn btn-sm btn-danger" onClick={() => {
                  if (!counts[l] || confirm(`Eliminare la lista "${l}"? Vini e produttori restano nel taccuino.`)) onRemove(l);
                }}>Elimina</button>
              </>
            )}
          </li>
        ))}
      </ul>
      <form className="inline-form" onSubmit={(e) => { e.preventDefault(); onAdd(name); setName(""); }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nuova lista, es. Regali" />
        <button className="btn btn-primary" disabled={!name.trim()}>Aggiungi</button>
      </form>
    </Dialog>
  );
}
