// Dati dimostrativi INVENTATI: produttori, vini e punteggi non esistono.
// Servono a mostrare il prototipo senza pubblicare contenuti della guida.
import { uid } from "./store.js";

const P = (name, f) => ({ id: uid(), name, favorite: false, notes: "", lists: [], visits: false, shop: false, ...f });
const W = (producerId, name, f, ratings) => ({
  id: uid(), producerId, name, favorite: false, notes: "", lists: [], ...f,
  ratings: ratings.map((r) => ({ id: uid(), tastevin: false, selection: "", format: "0,750l", ...r })),
});

export function demoData() {
  const sorgive = P("Cascina Le Sorgive", {
    owner: "Famiglia Bertola", address: "Strada delle Sorgive, 4 - Neive (CN)", town: "Neive", region: "Piemonte",
    email: "info@sorgive.example", website: "www.sorgive.example", founded: "1962",
    oenologist: "Luca Bertola", agronomist: "Marta Bertola", viticulture: "Biologica", bottles: "60.000",
    visits: true, shop: true, favorite: true,
    notes: "Visitata a maggio: chiedere di Marta, fanno degustazioni in vigna su prenotazione.",
  });
  const venti = P("Tenuta Poggio ai Venti", {
    owner: "Giovanni e Sara Landi", address: "Località Poggio ai Venti - Montalcino (SI)", town: "Montalcino", region: "Toscana",
    website: "www.poggioaiventi.example", founded: "1988", oenologist: "Paolo Ferri", agronomist: "Giovanni Landi",
    viticulture: "Convenzionale", bottles: "120.000", visits: true,
  });
  const terre = P("Masseria Terre Rosse", {
    owner: "Antonio De Luca", address: "Contrada Terre Rosse - Manduria (TA)", town: "Manduria", region: "Puglia",
    email: "cantina@terrerosse.example", founded: "2009", oenologist: "Antonio De Luca", viticulture: "Biologica", bottles: "35.000",
    shop: true, lists: ["Da provare"],
  });
  const stein = P("Weingut Steinacker", {
    owner: "Familie Pichler", address: "Weinstraße 12 - Termeno (BZ)", town: "Termeno", region: "Trentino-Alto Adige",
    website: "www.steinacker.example", founded: "1921", oenologist: "Martin Pichler", agronomist: "Anna Pichler",
    viticulture: "Convenzionale", bottles: "90.000", visits: true, shop: true,
  });
  const colli = P("Ca' dei Colli", {
    owner: "Famiglia Zanetti", address: "Via dei Colli, 30 - Fumane (VR)", town: "Fumane", region: "Veneto",
    email: "info@cadeicolli.example", website: "www.cadeicolli.example", founded: "1935",
    oenologist: "Elena Zanetti", agronomist: "Marco Zanetti", viticulture: "Convenzionale", bottles: "150.000",
  });

  const wines = [
    W(sorgive.id, "Barbaresco Bricco Sorgive Riserva", { type: "Rosso", denomination: "Barbaresco", classification: "DOCG", grapes: "Nebbiolo 100%", favorite: true, notes: "Bevuto la 2019 a cena da Paolo: ancora chiuso, aspettare almeno 5 anni." }, [
      { edition: 2027, vintage: 2021, score: 93.5, viti: 4, price: "€ 85", alcohol: "14,5%", bottles: "6.000", fermentation: "acciaio", maturation: "botte grande 30 mesi", pairing: "Brasato al Nebbiolo" },
      { edition: 2026, vintage: 2020, viti: 4, price: "€ 80", alcohol: "14,5%", bottles: "5.500", fermentation: "acciaio", maturation: "botte grande 30 mesi" },
      { edition: 2025, vintage: 2019, viti: 3, price: "€ 78" },
    ]),
    W(sorgive.id, "Barbera d'Alba Superiore", { type: "Rosso", denomination: "Barbera d'Alba", classification: "DOC e DOP", grapes: "Barbera 100%" }, [
      { edition: 2027, vintage: 2022, score: 89.5, viti: 3, price: "€ 24", alcohol: "14%", bottles: "12.000", fermentation: "acciaio", maturation: "tonneau 12 mesi", pairing: "Agnolotti del plin al sugo d'arrosto" },
      { edition: 2026, vintage: 2021, viti: 3, price: "€ 22" },
    ]),
    W(sorgive.id, "Langhe Nebbiolo", { type: "Rosso", denomination: "Langhe", classification: "DOC e DOP", grapes: "Nebbiolo 100%" }, [
      { edition: 2027, vintage: 2023, score: 88, viti: 3, price: "€ 22", alcohol: "13,5%", bottles: "15.000", fermentation: "acciaio", maturation: "acciaio 8 mesi", pairing: "Vitello tonnato" },
    ]),
    W(venti.id, "Brunello di Montalcino", { type: "Rosso", denomination: "Brunello di Montalcino", classification: "DOCG", grapes: "Sangiovese 100%", lists: ["Da comprare"] }, [
      { edition: 2027, vintage: 2020, score: 94, viti: 4, tastevin: true, price: "€ 60", alcohol: "14,5%", bottles: "25.000", fermentation: "acciaio", maturation: "botte grande 36 mesi", pairing: "Peposo all'imprunetina" },
      { edition: 2026, vintage: 2019, viti: 4, tastevin: true, price: "€ 58" },
      { edition: 2025, vintage: 2018, viti: 4, price: "€ 55" },
    ]),
    W(venti.id, "Rosso di Montalcino", { type: "Rosso", denomination: "Rosso di Montalcino", classification: "DOC e DOP", grapes: "Sangiovese 100%" }, [
      { edition: 2027, vintage: 2023, score: 87.5, viti: 3, price: "€ 22", alcohol: "13,5%", bottles: "40.000", fermentation: "acciaio", maturation: "botte grande 12 mesi", pairing: "Pici all'aglione" },
    ]),
    W(terre.id, "Primitivo di Manduria Riserva", { type: "Rosso", denomination: "Primitivo di Manduria", classification: "DOC e DOP", grapes: "Primitivo 100%" }, [
      { edition: 2027, vintage: 2022, score: 90, viti: 4, price: "€ 28", alcohol: "15%", bottles: "4.000", fermentation: "acciaio", maturation: "botte piccola 18 mesi", pairing: "Bombette pugliesi" },
      { edition: 2026, vintage: 2021, viti: 3, price: "€ 26" },
    ]),
    W(terre.id, "Salento Rosato", { type: "Rosato", denomination: "Salento", classification: "IGT e IGP", grapes: "Negroamaro 80%, Primitivo 20%" }, [
      { edition: 2027, vintage: 2025, score: 85, viti: 3, price: "€ 12", alcohol: "12,5%", bottles: "8.000", fermentation: "acciaio", maturation: "acciaio 4 mesi", pairing: "Frittura di paranza" },
    ]),
    W(stein.id, "Alto Adige Gewürztraminer Steinacker", { type: "Bianco", denomination: "Alto Adige", classification: "DOC e DOP", grapes: "Gewürztraminer 100%" }, [
      { edition: 2027, vintage: 2024, score: 91, viti: 4, price: "€ 26", alcohol: "14%", bottles: "10.000", fermentation: "acciaio", maturation: "acciaio sui lieviti 8 mesi", pairing: "Speck e formaggi erborinati" },
      { edition: 2026, vintage: 2023, viti: 4, price: "€ 25" },
    ]),
    W(stein.id, "Alto Adige Pinot Bianco", { type: "Bianco", denomination: "Alto Adige", classification: "DOC e DOP", grapes: "Pinot Bianco 100%" }, [
      { edition: 2027, vintage: 2025, score: 88, viti: 3, price: "€ 16", alcohol: "13%", bottles: "30.000", fermentation: "acciaio", maturation: "botte grande 6 mesi", pairing: "Canederli in brodo" },
    ]),
    W(colli.id, "Amarone della Valpolicella Classico", { type: "Rosso", denomination: "Amarone della Valpolicella", classification: "DOCG", grapes: "Corvina 60%, Corvinone 20%, Rondinella 15%, Molinara 5%", lists: ["Da provare"] }, [
      { edition: 2027, vintage: 2019, score: 92.5, viti: 4, price: "€ 55", alcohol: "16%", bottles: "18.000", fermentation: "acciaio", maturation: "botte grande 36 mesi", pairing: "Guancia brasata" },
      { edition: 2026, vintage: 2018, viti: 4, price: "€ 52" },
    ]),
    W(colli.id, "Valpolicella Ripasso Classico Superiore", { type: "Rosso", denomination: "Valpolicella Ripasso", classification: "DOC e DOP", grapes: "Corvina 65%, Rondinella 25%, Molinara 10%" }, [
      { edition: 2027, vintage: 2022, score: 89, viti: 3, price: "€ 24", alcohol: "14,5%", bottles: "30.000", fermentation: "acciaio", maturation: "botte grande 18 mesi", pairing: "Risotto all'Amarone" },
    ]),
  ];

  const now = new Date().toISOString();
  const stamp = (x) => ({ ...x, createdAt: now, updatedAt: now });
  return {
    version: 1,
    demo: true,
    producers: [sorgive, venti, terre, stein, colli].map(stamp),
    wines: wines.map(stamp),
    lists: ["Da provare", "Da comprare"],
    recent: [],
  };
}
