/**
 * Prompt per leggere screenshot dell'app Vitae (scheda produttore, elenco vini
 * o scheda vino) e trasformarli in dati per il Taccuino.
 * Condiviso tra la function scan-vitae e lo sviluppo locale.
 * Il prefisso underscore evita che Netlify lo esponga come endpoint.
 */
export const VITAE_SCAN_PROMPT = `Queste immagini sono screenshot dell'app della guida vini Vitae dell'AIS (scheda produttore, elenco dei vini di un produttore oppure scheda di un singolo vino), per uso personale di un socio.
Estrai i dati e restituisci SOLO questo JSON (niente altro testo):
{
  "producer": {
    "name": "nome dell'azienda (riga in grassetto)",
    "owner": "titolare o famiglia (riga sotto il nome)",
    "address": "indirizzo completo",
    "town": "comune",
    "region": "regione",
    "phone": "telefono",
    "email": "email",
    "website": "sito web",
    "founded": "anno di fondazione",
    "oenologist": "conduzione enologica",
    "agronomist": "conduzione agronomica",
    "viticulture": "viticoltura (es. Convenzionale, Biologica)",
    "bottles": "bottiglie prodotte",
    "visits": false,
    "shop": false
  },
  "wines": [
    {
      "name": "nome del vino senza l'annata, con iniziali maiuscole (es. Barbaresco Gaiun Martinenga Riserva)",
      "vintage": 2021,
      "edition": 2027,
      "type": "Rosso|Bianco|Rosato|Spumante|Dolce|Passito",
      "denomination": "denominazione (es. Barbaresco)",
      "classification": "DOCG|DOC e DOP|IGT e IGP",
      "grapes": "uvaggio con percentuali (es. Nebbiolo 100%)",
      "score": 92.5,
      "viti": 4,
      "tastevin": false,
      "price": "€ 36",
      "format": "0,750l",
      "alcohol": "15%",
      "bottles": "5.000",
      "fermentation": "acciaio",
      "maturation": "botte grande 36 mesi",
      "pairing": "abbinamento consigliato"
    }
  ]
}
Regole:
- "edition" è l'anno dell'edizione della guida mostrato nell'intestazione (es. "VINI 2027" → 2027).
- "score" è il punteggio nel riquadro arancione: può avere il mezzo punto (92.5). Altrimenti null.
- "viti" è il numero di simboli "t" nel riquadro accanto al punteggio (da 1 a 4).
- "visits" è true se compare l'icona OPEN (visite in cantina), "shop" se compare l'icona del negozio (vendita diretta).
- Includi tutti i vini visibili. Se lo screenshot mostra solo il produttore, "wines" è [].
- Se il produttore non ha una scheda propria nello screenshot, ricavane il nome dalla riga sotto il nome del vino.
- Non trascrivere le descrizioni della guida (testi narrativi e note di degustazione).
- Usa null per i campi non presenti o non leggibili.`;
