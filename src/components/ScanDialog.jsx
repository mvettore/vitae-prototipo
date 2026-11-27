import React, { useRef, useState } from "react";
import { Dialog, Field, Icon } from "./ui.jsx";
import { resizeImage, scanVitae } from "../scan.js";
import { PRODUCER_FIELDS, REGIONS } from "../store.js";

// Screenshot della scheda Vitae → dati da controllare → taccuino.
export function ScanDialog({ onImport, onClose }) {
  const inputRef = useRef(null);
  const [previews, setPreviews] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const pick = async (files) => {
    setError(null);
    const list = [...files].slice(0, 4);
    if (!list.length) return;
    try {
      const urls = await Promise.all(list.map((f) => resizeImage(f, 1400)));
      setPreviews(urls);
      setBusy(true);
      const res = await scanVitae(urls);
      setResult({
        producer: { name: "", region: "", town: "", ...(res.producer || {}) },
        wines: (res.wines || []).map((w) => ({ ...w, include: true })),
      });
    } catch (e) {
      setError(e.message || "Lettura non riuscita");
    } finally {
      setBusy(false);
    }
  };

  const setProducer = (k, v) => setResult({ ...result, producer: { ...result.producer, [k]: v } });
  const setWine = (i, k, v) => setResult({ ...result, wines: result.wines.map((w, j) => (j === i ? { ...w, [k]: v } : w)) });

  const footer = result ? (
    <>
      <button className="btn" onClick={() => { setResult(null); setPreviews([]); }}>Rifai</button>
      <button
        className="btn btn-primary"
        disabled={!result.producer.name?.trim()}
        onClick={() => onImport({ producer: result.producer, wines: result.wines.filter((w) => w.include) })}
      >
        Aggiungi al taccuino
      </button>
    </>
  ) : null;

  return (
    <Dialog title="Da scheda Vitae" onClose={onClose} footer={footer} wide={!!result}>
      {!result && (
        <>
          <p className="muted">
            Carica fino a 4 screenshot dall'app Vitae: la scheda del produttore, l'elenco dei suoi vini o la scheda di un vino.
            Vengono letti dati, punteggi e scheda tecnica; le descrizioni della guida non vengono copiate.
          </p>
          <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => pick(e.target.files)} />
          <button className="drop" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? <span className="spinner" /> : <Icon name="camera" size={28} />}
            <span>{busy ? "Lettura della scheda…" : "Scegli gli screenshot"}</span>
          </button>
          {previews.length > 0 && (
            <div className="previews">{previews.map((p, i) => <img key={i} src={p} alt="" />)}</div>
          )}
          {error && <p className="error">{error}</p>}
        </>
      )}

      {result && (
        <>
          <p className="muted small">Controlla e correggi prima di salvare. Se il produttore è già nel taccuino, i dati vengono uniti.</p>
          <div className="row-3">
            <Field label="Produttore"><input value={result.producer.name || ""} onChange={(e) => setProducer("name", e.target.value)} /></Field>
            <Field label="Regione">
              <select value={result.producer.region || ""} onChange={(e) => setProducer("region", e.target.value)}>
                <option value="">—</option>
                {[...new Set([result.producer.region, ...REGIONS].filter(Boolean))].map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Titolare"><input value={result.producer.owner || ""} onChange={(e) => setProducer("owner", e.target.value)} /></Field>
          </div>
          {(() => {
            const found = PRODUCER_FIELDS.filter(([k]) => !["region", "owner"].includes(k) && result.producer[k]).map(([, l]) => l);
            return found.length > 0 && <p className="muted small">Letti anche: {found.join(", ")}.</p>;
          })()}

          <h3 className="block-title">Vini trovati ({result.wines.length})</h3>
          {result.wines.length === 0 && <p className="muted">Nessun vino letto: puoi comunque salvare il produttore.</p>}
          <div className="scan-wines">
            {result.wines.map((w, i) => (
              <div key={i} className={`scan-wine ${w.include ? "" : "is-off"}`}>
                <div className="scan-wine-head">
                  <label className="check">
                    <input type="checkbox" checked={w.include} onChange={(e) => setWine(i, "include", e.target.checked)} />
                    Includi
                  </label>
                  <span className="muted small">{[w.type, w.denomination, w.grapes].filter(Boolean).join(" · ")}</span>
                </div>
                <Field label="Vino"><input value={w.name || ""} onChange={(e) => setWine(i, "name", e.target.value)} /></Field>
                <div className="row-5">
                  <Field label="Annata"><input inputMode="numeric" value={w.vintage ?? ""} onChange={(e) => setWine(i, "vintage", e.target.value)} /></Field>
                  <Field label="Edizione"><input inputMode="numeric" value={w.edition ?? ""} onChange={(e) => setWine(i, "edition", e.target.value)} /></Field>
                  <Field label="Punti"><input inputMode="decimal" value={w.score ?? ""} onChange={(e) => setWine(i, "score", e.target.value)} /></Field>
                  <Field label="Viti"><input inputMode="numeric" value={w.viti ?? ""} onChange={(e) => setWine(i, "viti", e.target.value)} /></Field>
                  <Field label="Prezzo"><input value={w.price ?? ""} onChange={(e) => setWine(i, "price", e.target.value)} /></Field>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Dialog>
  );
}
