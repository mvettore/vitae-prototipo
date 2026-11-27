/**
 * Prompt per leggere una scheda della guida Vitae (screenshot dell'app o
 * foto della pagina) e trasformarla in dati per il Taccuino.
 * Condiviso tra la function scan-vitae e lo sviluppo locale.
 * Il prefisso underscore evita che Netlify lo esponga come endpoint.
 */
export const VITAE_SCAN_PROMPT = `Questa immagine è una scheda della guida vini Vitae dell'AIS (screenshot dell'app o foto della pagina stampata), per uso personale di un socio.
Estrai i dati e restituisci SOLO questo JSON (niente altro testo):
{
  "producer": { "name": "nome dell'azienda", "region": "regione", "town": "comune o località" },
  "wines": [
    {
      "name": "nome del vino (senza il nome del produttore)",
      "denomination": "denominazione e tipologia, es. Barolo DOCG Riserva",
      "type": "Rosso|Bianco|Rosato|Spumante|Dolce|Passito",
      "grape": "vitigni principali",
      "vintage": 2019,
      "edition": 2027,
      "viti": null,
      "score": 94,
      "tastevin": false,
      "selection": null,
      "price": null
    }
  ]
}
Regole:
- "edition" è l'anno dell'edizione della guida (es. "Vitae 2027" → 2027), se visibile.
- "score" è il punteggio in centesimi (usato dall'edizione 2027), altrimenti null.
- "viti" è il numero di viti da 1 a 4 (edizioni fino alla 2026), altrimenti null.
- "tastevin" è true solo se il vino ha il riconoscimento Tastevin.
- "selection" è il nome di un'eventuale selezione o riconoscimento speciale indicato, altrimenti null.
- "price" è la fascia o il prezzo indicato, come testo, altrimenti null.
- Includi tutti i vini valutati presenti nella scheda.
- Non trascrivere le descrizioni della guida.
- Usa null per i campi non leggibili.`;
