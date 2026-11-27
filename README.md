# Vitae, prototipo di interfaccia

Prototipo **non ufficiale** di una nuova interfaccia per la guida vini **Vitae** dell'AIS. È una web app statica, installabile su iPhone, con il look dell'app ufficiale (bianco e arancio, punteggio in centesimi e viti) e una navigazione ripensata.

**Tutti i dati sono inventati:** produttori, persone, vini, punteggi e prezzi sono generati (`src/demo.js`, circa 60 produttori e 200+ vini). Sono reali solo denominazioni e vitigni, così ricerca e filtri sono credibili. Non contiene contenuti della guida.

## Cosa mostra

- **Ricerca sempre visibile:** un campo solo per vini, produttori, denominazioni, vitigni e note. La scheda si apre sopra l'elenco (su iPad accanto): chiudendola si ritrovano risultati e scroll dove erano.
- **Navigazione dentro la scheda:** vino → produttore → altro vino, con "indietro" che torna al passo precedente.
- **Valutazione per edizione:** punteggio e scheda tecnica dell'annata (alcol, bottiglie, fermentazione, affinamento, abbinamento), con cambio edizione 2027 / 2026 / 2025 in un tocco.
- **Personale:** preferiti, liste ("Da provare", "Da comprare" e altre) e note su vini e produttori, salvate sul dispositivo.
- **Sfoglia** per denominazione e vitigno, filtri per edizione, regione e tipologia, ordinamento per punteggio o prezzo.

## Sviluppo

```bash
npm install
npm run dev
```

## Deploy su Netlify

Importa il repository su Netlify: build `npm run build`, cartella `dist` (già in `netlify.toml`). Non servono variabili d'ambiente.

Il sito è escluso dai motori di ricerca (`robots.txt`, meta e header `noindex`). Dato che riprende il look dell'app ufficiale, conviene anche proteggerlo con password (Netlify: *Site configuration → Access control*).

Il logo in testata è una ricostruzione testuale: per usare il file ufficiale, mettilo in `public/logo.svg` e imposta `USE_LOGO_FILE = true` in `src/components/ui.jsx`.
