import React, { useEffect } from "react";

// ── Icone (SVG inline, ereditano il colore) ───────────────────
const paths = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  camera: <><path d="M4 8h3l2-2.5h6L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></>,
  star: <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z" />,
  more: <><circle cx="5" cy="12" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="19" cy="12" r="1.3" /></>,
  back: <path d="M15 5l-7 7 7 7" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  note: <><path d="M5 4h10l4 4v12H5z" /><path d="M8 12h8M8 16h5" /></>,
  edit: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
  trash: <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />,
  list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  building: <path d="M4 20V8l8-4 8 4v12M9 20v-5h6v5M4 20h16" />,
  glass: <path d="M8 3h8l-.6 6a3.4 3.4 0 0 1-6.8 0zM12 13v7M8.5 20h7" />,
};

export function Icon({ name, size = 20, filled = false, style }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={style}
      fill={filled ? "currentColor" : "none"} stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export function IconButton({ icon, label, onClick, active, filled, className = "" }) {
  return (
    <button type="button" className={`icon-btn ${active ? "is-active" : ""} ${className}`} onClick={onClick} aria-label={label} title={label}>
      <Icon name={icon} filled={filled} />
    </button>
  );
}

export function FavButton({ on, onToggle, size = 22 }) {
  return (
    <button
      type="button"
      className={`fav-btn ${on ? "is-on" : ""}`}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      aria-pressed={on}
      aria-label={on ? "Togli dai preferiti" : "Aggiungi ai preferiti"}
    >
      <Icon name="star" size={size} filled={on} />
    </button>
  );
}

// ── Valutazione Vitae ─────────────────────────────────────────
// Viti (fino al 2026) come grappoli pieni/vuoti, centesimi dal 2027.
export function Viti({ n }) {
  return (
    <span className="viti" aria-label={`${n} viti su 4`}>
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className={i <= n ? "vite on" : "vite"} />
      ))}
    </span>
  );
}

export function RatingBadge({ rating, compact = false }) {
  if (!rating) return null;
  return (
    <span className="rating">
      {rating.score != null ? (
        <span className="score">{rating.score}<small>/100</small></span>
      ) : rating.viti ? (
        <Viti n={rating.viti} />
      ) : null}
      {rating.tastevin && <span className="tag tag-gold">Tastevin</span>}
      {!compact && rating.selection && <span className="tag">{rating.selection}</span>}
    </span>
  );
}

// ── Dialog modale ────────────────────────────────────────────
export function Dialog({ title, onClose, children, footer, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`dialog ${wide ? "dialog-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="dialog-head">
          <h2>{title}</h2>
          <IconButton icon="close" label="Chiudi" onClick={onClose} />
        </header>
        <div className="dialog-body">{children}</div>
        {footer && <footer className="dialog-foot">{footer}</footer>}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {children}
    </div>
  );
}
