import React, { useState } from "react";
import { Dialog } from "./ui.jsx";

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
