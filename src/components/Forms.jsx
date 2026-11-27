import React, { useState } from "react";
import { Dialog, Field } from "./ui.jsx";

export const CURRENT_EDITION = 2027;

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

// Scheda di degustazione personale, ispirata alla scheda AIS: vista, naso, bocca.
export function TastingForm({ initial, vintages, onSave, onDelete, onClose }) {
  const [t, setT] = useState({
    date: new Date().toISOString().slice(0, 10),
    vintage: vintages[0] ?? "",
    occasion: "", score: "", sight: "", nose: "", palate: "", pairing: "", notes: "",
    ...initial,
  });
  const set = (k) => (e) => setT({ ...t, [k]: e.target.value });
  const save = () => {
    const score = parseFloat(String(t.score).replace(",", "."));
    const vintage = parseInt(t.vintage, 10);
    onSave({ ...t, score: Number.isFinite(score) ? score : null, vintage: Number.isFinite(vintage) ? vintage : null });
  };
  const area = (k, label, ph) => (
    <Field label={label}><textarea className="field-area" rows={2} value={t[k] || ""} onChange={set(k)} placeholder={ph} /></Field>
  );
  return (
    <Dialog
      title={initial?.id ? "Modifica degustazione" : "Nuova degustazione"}
      onClose={onClose}
      footer={<>
        {initial?.id && <button className="btn btn-danger" style={{ marginRight: "auto" }} onClick={onDelete}>Elimina</button>}
        <button className="btn" onClick={onClose}>Annulla</button>
        <button className="btn btn-primary" onClick={save}>Salva</button>
      </>}
    >
      <div className="row-3">
        <Field label="Data"><input type="date" value={t.date || ""} onChange={set("date")} /></Field>
        <Field label="Annata">
          <input list="tasting-vintages" inputMode="numeric" value={t.vintage ?? ""} onChange={set("vintage")} placeholder="es. 2019" />
          <datalist id="tasting-vintages">{vintages.map((v) => <option key={v} value={v} />)}</datalist>
        </Field>
        <Field label="Il mio voto"><input inputMode="decimal" value={t.score ?? ""} onChange={set("score")} placeholder="/100" /></Field>
      </div>
      <Field label="Occasione"><input value={t.occasion || ""} onChange={set("occasion")} placeholder="es. Banco d'assaggio AIS, cena da amici" /></Field>
      {area("sight", "Esame visivo", "Colore, riflessi, consistenza")}
      {area("nose", "Esame olfattivo", "Intensità, complessità, sentori")}
      {area("palate", "Esame gusto-olfattivo", "Struttura, equilibrio, persistenza")}
      <Field label="Abbinamento provato"><input value={t.pairing || ""} onChange={set("pairing")} /></Field>
      {area("notes", "Considerazioni", "Evoluzione, quando riaprirlo, prezzo pagato…")}
    </Dialog>
  );
}
