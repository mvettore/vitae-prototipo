# Taccuino Vitae

Prototipo **non ufficiale** di una nuova interfaccia per la guida vini **Vitae** dell'AIS: web app installabile su iPhone, con il look dell'app ufficiale (bianco e arancio, punteggio in centesimi e viti) e una navigazione ripensata.

Al primo avvio mostra **dati dimostrativi inventati** (produttori e vini che non esistono), per non pubblicare contenuti della guida. Dal banner "Inizia vuoto" si parte con il taccuino vuoto e si aggiungono i propri dati.

Il logo in testata è una ricostruzione testuale: per usare il file ufficiale, mettilo in `public/logo.svg` e imposta `USE_LOGO_FILE = true` in `src/components/ui.jsx`. Il sito è escluso dai motori di ricerca (`robots.txt`, meta e header `noindex`).

Nasce per coprire quello che manca all'app ufficiale:

- **Ricerca sempre visibile.** Un solo campo cerca produttori, vini, vitigni, località e le tue note. La scheda si apre sopra l'elenco (su iPad e desktop, accanto): chiudendola ritrovi risultati e scroll dove li avevi lasciati.
- **Navigazione dentro la scheda.** Produttore → vino → altro vino dello stesso produttore, con "indietro" che torna al passo precedente, non all'inizio.
- **Note personali** su ogni produttore e su ogni vino, salvate in automatico.
- **Preferiti e liste personali** (es. "Da provare", "Da comprare"), filtrabili con un tocco.
- **Valutazioni per edizione:** sullo stesso vino vedi la storia tra le edizioni, viti fino alla 2026 e centesimi dalla 2027, più il Tastevin.
- **Scheda tecnica per annata** (alcol, bottiglie, fermentazione, affinamento, abbinamento) e cambio edizione con un tocco.
- **Sfoglia per denominazione e vitigno**, come nel menu dell'app ufficiale.
- **Recenti**, filtri per edizione, regione e tipologia, ordinamento per punteggio o prezzo.

## Da dove vengono i dati

Il taccuino non contiene dati della guida: li inserisci tu, per uso personale.

- **A mano**, oppure
- **da screenshot:** fai uno screenshot della scheda del produttore nell'app Vitae (o una foto della pagina) e caricalo. Claude legge produttore, vini, edizione, annata e punteggi; le descrizioni della guida non vengono copiate. Prima di salvare puoi correggere tutto.

Tutto resta nel browser del dispositivo (localStorage). Dal menu **⋯** puoi esportare e ripristinare un backup JSON.

## Sviluppo

```bash
npm install
npm run dev
```

Per provare la lettura degli screenshot in locale, crea `.env.local` con:

```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

(La chiave in `.env.local` è solo per lo sviluppo: finisce nel bundle del browser, non usarla in produzione.)

## Deploy su Netlify

1. Importa il repository su Netlify: build `npm run build`, cartella `dist` (già in `netlify.toml`).
2. In **Site settings → Environment variables** aggiungi `ANTHROPIC_API_KEY`.
3. Facoltativo: `CLAUDE_MODEL_VISION` per cambiare modello (predefinito `claude-haiku-5-5`).
4. Da Safari su iPhone: Condividi → **Aggiungi alla schermata Home**.

La function `netlify/functions/scan-vitae.js` è l'unica parte server: riceve lo screenshot e restituisce i dati in JSON.
