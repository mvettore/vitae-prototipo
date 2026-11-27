import React, { useState } from "react";
import { Dialog, Field } from "./ui.jsx";
import { REGIONS, WINE_TYPES, norm, toInt } from "../store.js";

export const CURRENT_EDITION = 2027;

export function ProducerForm({ initial, onSave, onClose }) {
  const [p, setP] = useState({ name: "", region: "", town: "", website: "", ...initial });
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
      <Field label="Nome"><input autoFocus value={p.name} onChange={set("name")} placeholder="es. Bartolo Mascarello" /></Field>
      <div className="row-2">
        <Field label="Regione">
          <select value={p.region} onChange={set("region")}>
            <option value="">—</option>
            {REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Comune"><input value={p.town} onChange={set("town")} placeholder="es. Barolo" /></Field>
      </div>
      <Field label="Sito web"><input value={p.website} onChange={set("website")} inputMode="url" placeholder="facoltativo" /></Field>
    </Dialog>
  );
}

// Il produttore si sceglie scrivendo: se il nome non esiste viene creato.
export function WineForm({ initial, producers, onSave, onClose }) {
  const startProducer = producers.find((p) => p.id === initial?.producerId)?.name || "";
  const [w, setW] = useState({ name: "", denomination: "", type: "", grape: "", ...initial });
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
        <datalist id="producer-names">
          {producers.map((p) => <option key={p.id} value={p.name} />)}
        </datalist>
      </Field>
      <Field label="Nome del vino"><input autoFocus={!!startProducer} value={w.name} onChange={set("name")} placeholder="es. Barolo" /></Field>
      <Field label="Denominazione"><input value={w.denomination} onChange={set("denomination")} placeholder="es. Barolo DOCG" /></Field>
      <div className="row-2">
        <Field label="Tipologia">
          <select value={w.type} onChange={set("type")}>
            <option value="">—</option>
            {WINE_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Vitigni"><input value={w.grape} onChange={set("grape")} placeholder="es. Nebbiolo" /></Field>
      </div>
    </Dialog>
  );
}

export function RatingForm({ initial, onSave, onClose }) {
  const [r, setR] = useState({
    edition: CURRENT_EDITION, vintage: "", viti: null, score: "", tastevin: false, selection: "", price: "",
    ...initial,
  });
  const edition = toInt(r.edition);
  // Dal 2027 Vitae usa i centesimi; prima le viti.
  const usesScore = edition == null || edition >= 2027;
  const set = (k) => (e) => setR({ ...r, [k]: e.target.value });
  const save = () => onSave({
    ...r,
    edition,
    vintage: toInt(r.vintage),
    score: usesScore ? toInt(r.score) : null,
    viti: usesScore ? null : r.viti,
  });
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
        <Field label="Annata"><input type="number" inputMode="numeric" value={r.vintage ?? ""} onChange={set("vintage")} placeholder="es. 2019" /></Field>
      </div>
      {usesScore ? (
        <Field label="Punteggio (centesimi)">
          <input type="number" inputMode="numeric" min="0" max="100" value={r.score ?? ""} onChange={set("score")} placeholder="es. 94" />
        </Field>
      ) : (
        <Field label="Viti">
          <div className="segmented">
            {[1, 2, 3, 4].map((n) => (
              <button type="button" key={n} className={r.viti === n ? "is-on" : ""} onClick={() => setR({ ...r, viti: r.viti === n ? null : n })}>
                {n}
              </button>
            ))}
          </div>
        </Field>
      )}
      <label className="check">
        <input type="checkbox" checked={!!r.tastevin} onChange={(e) => setR({ ...r, tastevin: e.target.checked })} />
        Tastevin
      </label>
      <div className="row-2">
        <Field label="Selezione o premio"><input value={r.selection || ""} onChange={set("selection")} placeholder="facoltativo" /></Field>
        <Field label="Prezzo indicato"><input value={r.price || ""} onChange={set("price")} placeholder="facoltativo" /></Field>
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
                  if (!counts[l] || confirm(`Eliminare la lista "${l}"? I vini e i produttori restano nel taccuino.`)) onRemove(l);
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
