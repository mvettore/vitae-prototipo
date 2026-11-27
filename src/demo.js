// Catalogo DIMOSTRATIVO: produttori, persone, vini e punteggi sono inventati.
// Le denominazioni e i vitigni sono reali, per rendere credibili ricerca e filtri.
// Il generatore è deterministico (seed fisso): gli id restano stabili tra i
// ricaricamenti, così preferiti, liste e note dell'utente non si perdono.

export const DATA_VERSION = 7;

// ── PRNG con seed (mulberry32) ───────────────────────────────
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// ── Materiale per regione ────────────────────────────────────
// [denominazione, classificazione, tipologia, uvaggio, prezzo min, prezzo max]
const R = {
  Piemonte: {
    pr: ["Neive (CN)", "La Morra (CN)", "Canelli (AT)", "Gavi (AL)", "Monforte d'Alba (CN)", "Nizza Monferrato (AT)"],
    wines: [
      ["Barolo", "DOCG", "Rosso", "Nebbiolo 100%", 45, 140],
      ["Barbaresco", "DOCG", "Rosso", "Nebbiolo 100%", 40, 120],
      ["Barbera d'Asti Superiore", "DOCG", "Rosso", "Barbera 100%", 14, 35],
      ["Langhe Nebbiolo", "DOC e DOP", "Rosso", "Nebbiolo 100%", 16, 30],
      ["Dogliani", "DOCG", "Rosso", "Dolcetto 100%", 12, 22],
      ["Gavi", "DOCG", "Bianco", "Cortese 100%", 12, 28],
      ["Roero Arneis", "DOCG", "Bianco", "Arneis 100%", 12, 24],
      ["Moscato d'Asti", "DOCG", "Dolce", "Moscato Bianco 100%", 10, 20],
    ],
  },
  "Valle d'Aosta": {
    pr: ["Aymavilles (AO)", "Morgex (AO)", "Chambave (AO)"],
    wines: [
      ["Valle d'Aosta Petite Arvine", "DOC e DOP", "Bianco", "Petite Arvine 100%", 18, 32],
      ["Valle d'Aosta Fumin", "DOC e DOP", "Rosso", "Fumin 100%", 20, 36],
      ["Valle d'Aosta Blanc de Morgex et de La Salle", "DOC e DOP", "Bianco", "Prié Blanc 100%", 15, 28],
    ],
  },
  Lombardia: {
    pr: ["Erbusco (BS)", "Teglio (SO)", "Santa Maria della Versa (PV)", "Desenzano del Garda (BS)"],
    wines: [
      ["Franciacorta Brut", "DOCG", "Spumante", "Chardonnay 80%, Pinot Nero 20%", 22, 45],
      ["Franciacorta Satèn", "DOCG", "Spumante", "Chardonnay 100%", 28, 50],
      ["Valtellina Superiore Sassella", "DOCG", "Rosso", "Nebbiolo (Chiavennasca) 100%", 22, 45],
      ["Sforzato di Valtellina", "DOCG", "Rosso", "Nebbiolo (Chiavennasca) 100%", 40, 75],
      ["Lugana", "DOC e DOP", "Bianco", "Turbiana 100%", 14, 26],
      ["Oltrepò Pavese Metodo Classico Pinot Nero", "DOCG", "Spumante", "Pinot Nero 100%", 20, 38],
    ],
  },
  "Trentino-Alto Adige": {
    pr: ["Termeno (BZ)", "Appiano (BZ)", "Caldaro (BZ)", "Mezzocorona (TN)", "Lavis (TN)"],
    wines: [
      ["Alto Adige Gewürztraminer", "DOC e DOP", "Bianco", "Gewürztraminer 100%", 18, 35],
      ["Alto Adige Pinot Bianco", "DOC e DOP", "Bianco", "Pinot Bianco 100%", 14, 28],
      ["Alto Adige Lagrein Riserva", "DOC e DOP", "Rosso", "Lagrein 100%", 20, 40],
      ["Alto Adige Pinot Nero", "DOC e DOP", "Rosso", "Pinot Nero 100%", 22, 48],
      ["Trento Brut", "DOC e DOP", "Spumante", "Chardonnay 70%, Pinot Nero 30%", 22, 45],
      ["Teroldego Rotaliano", "DOC e DOP", "Rosso", "Teroldego 100%", 13, 26],
    ],
  },
  Veneto: {
    pr: ["Fumane (VR)", "Negrar (VR)", "Soave (VR)", "Valdobbiadene (TV)", "Conegliano (TV)"],
    wines: [
      ["Amarone della Valpolicella Classico", "DOCG", "Rosso", "Corvina 60%, Corvinone 20%, Rondinella 15%, Molinara 5%", 45, 95],
      ["Valpolicella Ripasso Classico Superiore", "DOC e DOP", "Rosso", "Corvina 65%, Rondinella 25%, Molinara 10%", 18, 36],
      ["Recioto della Valpolicella Classico", "DOCG", "Passito", "Corvina 70%, Rondinella 30%", 30, 55],
      ["Soave Classico", "DOC e DOP", "Bianco", "Garganega 100%", 12, 25],
      ["Conegliano Valdobbiadene Prosecco Superiore Extra Brut", "DOCG", "Spumante", "Glera 100%", 12, 22],
    ],
  },
  "Friuli-Venezia Giulia": {
    pr: ["Cormons (GO)", "Buttrio (UD)", "Prepotto (UD)", "Oslavia (GO)"],
    wines: [
      ["Collio Friulano", "DOC e DOP", "Bianco", "Friulano 100%", 16, 30],
      ["Friuli Colli Orientali Ribolla Gialla", "DOC e DOP", "Bianco", "Ribolla Gialla 100%", 15, 32],
      ["Friuli Colli Orientali Schioppettino di Prepotto", "DOC e DOP", "Rosso", "Schioppettino 100%", 22, 40],
      ["Ramandolo", "DOCG", "Dolce", "Verduzzo Friulano 100%", 20, 35],
    ],
  },
  Liguria: {
    pr: ["Dolceacqua (IM)", "Riomaggiore (SP)", "Ortovero (SV)"],
    wines: [
      ["Riviera Ligure di Ponente Pigato", "DOC e DOP", "Bianco", "Pigato 100%", 14, 26],
      ["Rossese di Dolceacqua", "DOC e DOP", "Rosso", "Rossese 100%", 16, 30],
      ["Cinque Terre", "DOC e DOP", "Bianco", "Bosco 60%, Albarola 25%, Vermentino 15%", 22, 40],
    ],
  },
  "Emilia-Romagna": {
    pr: ["Sorbara (MO)", "Castelvetro di Modena (MO)", "Brisighella (RA)", "Bertinoro (FC)"],
    wines: [
      ["Lambrusco di Sorbara", "DOC e DOP", "Rosato", "Lambrusco di Sorbara 100%", 10, 18],
      ["Lambrusco Grasparossa di Castelvetro", "DOC e DOP", "Rosso", "Lambrusco Grasparossa 100%", 10, 18],
      ["Romagna Sangiovese Superiore Riserva", "DOC e DOP", "Rosso", "Sangiovese 100%", 16, 32],
      ["Romagna Albana Secco", "DOCG", "Bianco", "Albana 100%", 14, 26],
    ],
  },
  Toscana: {
    pr: ["Montalcino (SI)", "Gaiole in Chianti (SI)", "Montepulciano (SI)", "Bolgheri (LI)", "San Gimignano (SI)", "Greve in Chianti (FI)"],
    wines: [
      ["Brunello di Montalcino", "DOCG", "Rosso", "Sangiovese 100%", 45, 120],
      ["Rosso di Montalcino", "DOC e DOP", "Rosso", "Sangiovese 100%", 18, 32],
      ["Chianti Classico Gran Selezione", "DOCG", "Rosso", "Sangiovese 100%", 35, 80],
      ["Chianti Classico Riserva", "DOCG", "Rosso", "Sangiovese 90%, Canaiolo 10%", 22, 45],
      ["Vino Nobile di Montepulciano", "DOCG", "Rosso", "Sangiovese (Prugnolo Gentile) 100%", 22, 45],
      ["Bolgheri Superiore", "DOC e DOP", "Rosso", "Cabernet Sauvignon 60%, Merlot 30%, Cabernet Franc 10%", 55, 140],
      ["Vernaccia di San Gimignano", "DOCG", "Bianco", "Vernaccia di San Gimignano 100%", 12, 26],
      ["Vin Santo del Chianti Classico", "DOC e DOP", "Passito", "Trebbiano 70%, Malvasia 30%", 35, 70],
    ],
  },
  Umbria: {
    pr: ["Montefalco (PG)", "Orvieto (TR)", "Torgiano (PG)"],
    wines: [
      ["Montefalco Sagrantino", "DOCG", "Rosso", "Sagrantino 100%", 30, 60],
      ["Montefalco Rosso", "DOC e DOP", "Rosso", "Sangiovese 70%, Sagrantino 15%, Merlot 15%", 15, 28],
      ["Orvieto Classico Superiore", "DOC e DOP", "Bianco", "Grechetto 60%, Procanico 40%", 12, 24],
      ["Torgiano Rosso Riserva", "DOCG", "Rosso", "Sangiovese 80%, Canaiolo 20%", 25, 45],
    ],
  },
  Marche: {
    pr: ["Cupramontana (AN)", "Matelica (MC)", "Offida (AP)", "Morro d'Alba (AN)"],
    wines: [
      ["Castelli di Jesi Verdicchio Riserva", "DOCG", "Bianco", "Verdicchio 100%", 18, 35],
      ["Verdicchio di Matelica", "DOC e DOP", "Bianco", "Verdicchio 100%", 13, 26],
      ["Offida Pecorino", "DOCG", "Bianco", "Pecorino 100%", 13, 25],
      ["Lacrima di Morro d'Alba", "DOC e DOP", "Rosso", "Lacrima 100%", 12, 22],
      ["Conero Riserva", "DOCG", "Rosso", "Montepulciano 100%", 22, 42],
    ],
  },
  Lazio: {
    pr: ["Frascati (RM)", "Montefiascone (VT)", "Cori (LT)"],
    wines: [
      ["Frascati Superiore", "DOCG", "Bianco", "Malvasia di Candia 70%, Malvasia del Lazio 30%", 10, 20],
      ["Cesanese del Piglio Superiore", "DOCG", "Rosso", "Cesanese 100%", 15, 30],
      ["Cori Bellone", "DOC e DOP", "Bianco", "Bellone 100%", 13, 24],
    ],
  },
  Abruzzo: {
    pr: ["Loreto Aprutino (PE)", "Ofena (AQ)", "Controguerra (TE)"],
    wines: [
      ["Montepulciano d'Abruzzo Colline Teramane Riserva", "DOCG", "Rosso", "Montepulciano 100%", 22, 45],
      ["Trebbiano d'Abruzzo", "DOC e DOP", "Bianco", "Trebbiano Abruzzese 100%", 12, 40],
      ["Cerasuolo d'Abruzzo", "DOC e DOP", "Rosato", "Montepulciano 100%", 11, 22],
      ["Abruzzo Pecorino", "DOC e DOP", "Bianco", "Pecorino 100%", 12, 22],
    ],
  },
  Molise: {
    pr: ["Campomarino (CB)", "Larino (CB)"],
    wines: [
      ["Tintilia del Molise", "DOC e DOP", "Rosso", "Tintilia 100%", 14, 28],
      ["Molise Falanghina", "DOC e DOP", "Bianco", "Falanghina 100%", 10, 18],
    ],
  },
  Campania: {
    pr: ["Taurasi (AV)", "Lapio (AV)", "Tufo (AV)", "Castelvenere (BN)", "Furore (SA)"],
    wines: [
      ["Taurasi Riserva", "DOCG", "Rosso", "Aglianico 100%", 35, 70],
      ["Fiano di Avellino", "DOCG", "Bianco", "Fiano 100%", 15, 32],
      ["Greco di Tufo", "DOCG", "Bianco", "Greco 100%", 14, 28],
      ["Falanghina del Sannio", "DOC e DOP", "Bianco", "Falanghina 100%", 11, 22],
      ["Costa d'Amalfi Furore Bianco", "DOC e DOP", "Bianco", "Falanghina 60%, Biancolella 40%", 22, 45],
    ],
  },
  Puglia: {
    pr: ["Manduria (TA)", "Salice Salentino (LE)", "Gioia del Colle (BA)", "Castel del Monte (BT)", "Guagnano (LE)"],
    wines: [
      ["Primitivo di Manduria", "DOC e DOP", "Rosso", "Primitivo 100%", 14, 32],
      ["Primitivo di Manduria Dolce Naturale", "DOCG", "Dolce", "Primitivo 100%", 25, 45],
      ["Gioia del Colle Primitivo Riserva", "DOC e DOP", "Rosso", "Primitivo 100%", 22, 40],
      ["Salice Salentino Rosso Riserva", "DOC e DOP", "Rosso", "Negroamaro 90%, Malvasia Nera 10%", 13, 26],
      ["Castel del Monte Nero di Troia Riserva", "DOCG", "Rosso", "Nero di Troia 100%", 20, 40],
      ["Salento Rosato", "IGT e IGP", "Rosato", "Negroamaro 100%", 9, 16],
    ],
  },
  Basilicata: {
    pr: ["Barile (PZ)", "Rionero in Vulture (PZ)", "Venosa (PZ)"],
    wines: [
      ["Aglianico del Vulture Superiore", "DOCG", "Rosso", "Aglianico 100%", 28, 55],
      ["Aglianico del Vulture", "DOC e DOP", "Rosso", "Aglianico 100%", 15, 30],
    ],
  },
  Calabria: {
    pr: ["Cirò Marina (KR)", "Cosenza (CS)", "Bivongi (RC)"],
    wines: [
      ["Cirò Rosso Classico Superiore Riserva", "DOC e DOP", "Rosso", "Gaglioppo 100%", 15, 32],
      ["Cirò Rosato", "DOC e DOP", "Rosato", "Gaglioppo 100%", 10, 18],
      ["Calabria Greco Bianco", "IGT e IGP", "Bianco", "Greco Bianco 100%", 12, 22],
    ],
  },
  Sicilia: {
    pr: ["Castiglione di Sicilia (CT)", "Vittoria (RG)", "Marsala (TP)", "Pantelleria (TP)", "Menfi (AG)"],
    wines: [
      ["Etna Rosso", "DOC e DOP", "Rosso", "Nerello Mascalese 90%, Nerello Cappuccio 10%", 22, 48],
      ["Etna Bianco Superiore", "DOC e DOP", "Bianco", "Carricante 100%", 25, 50],
      ["Cerasuolo di Vittoria Classico", "DOCG", "Rosso", "Nero d'Avola 60%, Frappato 40%", 18, 35],
      ["Passito di Pantelleria", "DOC e DOP", "Passito", "Zibibbo 100%", 30, 60],
      ["Sicilia Nero d'Avola", "DOC e DOP", "Rosso", "Nero d'Avola 100%", 12, 25],
      ["Sicilia Grillo", "DOC e DOP", "Bianco", "Grillo 100%", 11, 22],
    ],
  },
  Sardegna: {
    pr: ["Berchidda (SS)", "Oliena (NU)", "Santadi (SU)", "Mamoiada (NU)"],
    wines: [
      ["Vermentino di Gallura Superiore", "DOCG", "Bianco", "Vermentino 100%", 15, 30],
      ["Cannonau di Sardegna Riserva", "DOC e DOP", "Rosso", "Cannonau 100%", 18, 38],
      ["Carignano del Sulcis Riserva", "DOC e DOP", "Rosso", "Carignano 100%", 20, 40],
      ["Vernaccia di Oristano", "DOC e DOP", "Bianco", "Vernaccia di Oristano 100%", 22, 40],
    ],
  },
};

// Nomi di fantasia: luoghi inventati, non aziende reali.
const PREFIX_BY_REGION = {
  Piemonte: ["Cascina", "Tenuta", "Cantina"], "Valle d'Aosta": ["Domaine", "Cave", "Cantina"],
  Lombardia: ["Tenuta", "Cantina", "Corte"], "Trentino-Alto Adige": ["Weingut", "Maso", "Tenuta"],
  Veneto: ["Ca'", "Corte", "Tenuta"], "Friuli-Venezia Giulia": ["Tenuta", "Cantina", "Borgo"],
  Liguria: ["Cantina", "Terre", "Podere"], "Emilia-Romagna": ["Podere", "Fattoria", "Cantina"],
  Toscana: ["Podere", "Tenuta", "Fattoria", "Castello"], Umbria: ["Tenuta", "Fattoria", "Cantina"],
  Marche: ["Tenuta", "Fattoria", "Cantina"], Lazio: ["Tenuta", "Casale", "Cantina"],
  Abruzzo: ["Tenuta", "Cantina", "Fattoria"], Molise: ["Cantina", "Masseria"],
  Campania: ["Tenuta", "Cantina", "Masseria"], Puglia: ["Masseria", "Tenuta", "Cantina"],
  Basilicata: ["Cantina", "Tenuta"], Calabria: ["Cantina", "Tenuta", "Masseria"],
  Sicilia: ["Baglio", "Tenuta", "Cantina", "Feudo"], Sardegna: ["Cantina", "Tenuta", "Agricola"],
};
const PLACES = [
  "Colle Fosco", "Poggio Ventoso", "Rio Chiaro", "Monte Ombroso", "Sasso Bianco", "Vigna del Lupo", "Pietra Lunga",
  "Valle Serena", "Le Ginestre Alte", "Il Calcare", "Bric Fiorì", "Corte Alba", "Le Fornaci Vecchie", "Fonte Antica",
  "Roccanera", "Campo dei Gelsi", "Le Due Querce", "Serra Lucente", "Prato Grande", "Costa del Vento", "Belpoggio",
  "La Mirandola Alta", "Torre del Falco", "Acquabuona", "Terre di Mezzo", "Bosco Nero", "Le Macine", "San Vitale Alto",
  "Rocca Serena", "Fontanabianca", "Poggio delle Stelle", "Colle Lungo", "Vallerosa", "Casalnuovo", "Cerro Alto",
  "Montebruno", "Il Pianello", "Le Crete Rosse", "Monte Sereno", "Ripalta", "Campo Lungo", "La Palazzina Nuova",
  "Pozzo Antico", "Terre Bianche", "Vigna Vecchia", "Le Sorgive", "Poggio ai Venti", "Collina d'Oro", "Bricco Ventoso",
  "Valfredda", "Monte Fiorito", "Le Rocche Alte", "Sant'Elmo Basso", "Fonte Fredda", "Riva Lunga", "Mandorleto",
  "Gelsomino", "Uliveto Grande", "Scogliera", "Piana del Sole", "Serralta", "Lavanda", "Cardo Selvatico",
];
const FIRST = ["Luca", "Marta", "Giovanni", "Sara", "Paolo", "Elena", "Marco", "Chiara", "Andrea", "Giulia", "Stefano", "Francesca", "Matteo", "Anna", "Davide", "Laura", "Alberto", "Silvia", "Pietro", "Irene"];
const LAST = ["Bertola", "Landi", "De Luca", "Pichler", "Zanetti", "Ferri", "Rinaldi", "Moretti", "Galli", "Conti", "Sartori", "Marini", "Fabbri", "Lombardi", "Bassi", "Greco", "Serra", "Esposito", "Mancini", "Vitale", "Russo", "Caruso", "Fontana", "Costa"];
const CRU = ["Vigna Alta", "Bricco Rosa", "Sorì del Sole", "Vigna Vecchia", "Il Poggio", "Le Coste", "Ronco del Gelso", "Campo Fiorito", "La Rocca", "Monte Alto", "Selezione", "Vigna del Pozzo", "Pian del Bosco", "Fontanile"];
const STREETS = ["Strada", "Via", "Località", "Contrada", "Frazione"];
const FERMENT = ["acciaio", "acciaio", "cemento", "legno", "acciaio e legno"];
const MATUR = {
  Rosso: ["botte grande 24 mesi", "botte grande 36 mesi", "botte piccola 18 mesi", "tonneau 12 mesi", "cemento e botte grande 20 mesi", "botte piccola 10 mesi"],
  Bianco: ["acciaio 6 mesi", "acciaio sui lieviti 8 mesi", "botte grande 10 mesi", "cemento 6 mesi", "tonneau 9 mesi"],
  Rosato: ["acciaio 4 mesi", "acciaio 5 mesi"],
  Spumante: ["sui lieviti 30 mesi", "sui lieviti 24 mesi", "sui lieviti 48 mesi", "autoclave 4 mesi"],
  Dolce: ["acciaio 6 mesi", "botte piccola 12 mesi"],
  Passito: ["caratello 48 mesi", "botte piccola 24 mesi", "acciaio 12 mesi"],
};
const PAIR = {
  Rosso: ["Brasato al vino rosso", "Filetto di cervo ai mirtilli", "Agnello al forno con patate", "Pappardelle al ragù di cinghiale", "Fegato alla veneziana", "Peposo all'imprunetina", "Bombette pugliesi", "Arrosticini", "Risotto all'Amarone", "Formaggi stagionati"],
  Bianco: ["Risotto agli asparagi", "Spaghetti alle vongole", "Branzino al sale", "Crudo di gamberi", "Canederli in brodo", "Tagliolini al tartufo bianco", "Frittata di erbe", "Pesce spada alla griglia"],
  Rosato: ["Frittura di paranza", "Pizza margherita", "Zuppa di pesce", "Salumi misti", "Tiella di riso, patate e cozze"],
  Spumante: ["Ostriche", "Tempura di verdure", "Antipasto di mare", "Culatello"],
  Dolce: ["Crostata di frutta", "Pasticceria secca", "Panettone"],
  Passito: ["Formaggi erborinati", "Cantucci", "Foie gras", "Cassata siciliana"],
};
const ALC = { Rosso: [13.5, 15.5], Bianco: [12, 14], Rosato: [12, 13.5], Spumante: [12, 12.5], Dolce: [5.5, 13], Passito: [13.5, 15.5] };

const viti = (score) => (score >= 90 ? 4 : score >= 85 ? 3 : 2);
const fmtInt = (n) => n.toLocaleString("it-IT");

// ── Produttori e vini scritti a mano (con note e liste d'esempio) ──
function handmade() {
  const p = (id, name, f) => ({ id, name, favorite: false, notes: "", lists: [], visits: false, shop: false, phone: "", ...f });
  const w = (id, producerId, name, f, ratings) => ({
    id, producerId, name, favorite: false, notes: "", lists: [], tastings: [], ...f,
    ratings: ratings.map((r) => ({ id: `${id}-${r.edition}`, tastevin: false, selection: "", format: "0,750l", ...r })),
  });
  const producers = [
    p("p-sorgive", "Cascina Le Sorgive", { owner: "Famiglia Bertola", address: "Strada delle Sorgive, 4 - Neive (CN)", town: "Neive", region: "Piemonte",
      email: "info@sorgive.example", website: "www.sorgive.example", founded: "1962", oenologist: "Luca Bertola", agronomist: "Marta Bertola",
      viticulture: "Biologica", bottles: "60.000", visits: true, shop: true, favorite: true,
      notes: "Visitata a maggio: chiedere di Marta, fanno degustazioni in vigna su prenotazione." }),
    p("p-poggio-ai-venti", "Tenuta Poggio ai Venti", { owner: "Giovanni e Sara Landi", address: "Località Poggio ai Venti - Montalcino (SI)", town: "Montalcino", region: "Toscana",
      website: "www.poggioaiventi.example", founded: "1988", oenologist: "Paolo Ferri", agronomist: "Giovanni Landi", viticulture: "Convenzionale", bottles: "120.000", visits: true }),
    p("p-terre-rosse", "Masseria Terre Rosse", { owner: "Antonio De Luca", address: "Contrada Terre Rosse - Manduria (TA)", town: "Manduria", region: "Puglia",
      email: "cantina@terrerosse.example", founded: "2009", oenologist: "Antonio De Luca", viticulture: "Biologica", bottles: "35.000", shop: true, lists: ["Da provare"] }),
  ];
  const wines = [
    w("w-sorgive-1", "p-sorgive", "Barbaresco Bricco Sorgive Riserva", { type: "Rosso", denomination: "Barbaresco", classification: "DOCG", grapes: "Nebbiolo 100%", favorite: true,
      notes: "Bevuto la 2019 a cena da Paolo: ancora chiuso, aspettare almeno 5 anni.",
      tastings: [{ id: "t-demo-1", date: "2026-10-18", vintage: 2019, occasion: "Cena da Paolo", score: 91,
        sight: "Granato luminoso, unghia aranciata, buona trasparenza.",
        nose: "Rosa appassita, ciliegia sotto spirito, liquirizia e un tocco di catrame.",
        palate: "Tannino ancora serrato, acidità viva, chiusura lunga su note di spezie.",
        pairing: "Brasato con polenta", notes: "Da riprovare tra qualche anno." }] }, [
      { edition: 2027, vintage: 2021, score: 93.5, viti: 4, price: "€ 85", alcohol: "14,5%", bottles: "6.000", fermentation: "acciaio", maturation: "botte grande 30 mesi", pairing: "Brasato al Nebbiolo" },
      { edition: 2026, vintage: 2020, viti: 4, price: "€ 80", alcohol: "14,5%", bottles: "5.500", fermentation: "acciaio", maturation: "botte grande 30 mesi", pairing: "Tajarin al ragù" },
      { edition: 2025, vintage: 2019, viti: 3, price: "€ 78", alcohol: "14%", bottles: "5.000", fermentation: "acciaio", maturation: "botte grande 30 mesi" },
    ]),
    w("w-sorgive-2", "p-sorgive", "Barbera d'Asti Superiore", { type: "Rosso", denomination: "Barbera d'Asti Superiore", classification: "DOCG", grapes: "Barbera 100%" }, [
      { edition: 2027, vintage: 2022, score: 89.5, viti: 3, price: "€ 24", alcohol: "14%", bottles: "12.000", fermentation: "acciaio", maturation: "tonneau 12 mesi", pairing: "Agnolotti del plin al sugo d'arrosto" },
      { edition: 2026, vintage: 2021, viti: 3, price: "€ 22" },
    ]),
    w("w-sorgive-3", "p-sorgive", "Langhe Nebbiolo", { type: "Rosso", denomination: "Langhe Nebbiolo", classification: "DOC e DOP", grapes: "Nebbiolo 100%" }, [
      { edition: 2027, vintage: 2023, score: 88, viti: 3, price: "€ 22", alcohol: "13,5%", bottles: "15.000", fermentation: "acciaio", maturation: "acciaio 8 mesi", pairing: "Vitello tonnato" },
    ]),
    w("w-poggio-1", "p-poggio-ai-venti", "Brunello di Montalcino", { type: "Rosso", denomination: "Brunello di Montalcino", classification: "DOCG", grapes: "Sangiovese 100%", lists: ["Da comprare"],
      tastings: [{ id: "t-demo-2", date: "2026-11-14", vintage: 2020, occasion: "Presentazione della guida, Firenze", score: 93,
        sight: "Rubino con riflessi granato, limpido.", nose: "Amarena, viola, cuoio e sottobosco, finale balsamico.",
        palate: "Pieno e sapido, tannino fitto ma levigato, lunga persistenza.", pairing: "", notes: "Il migliore della serata: comprarne qualche bottiglia." }] }, [
      { edition: 2027, vintage: 2020, score: 94.5, viti: 4, tastevin: true, price: "€ 60", alcohol: "14,5%", bottles: "25.000", fermentation: "acciaio", maturation: "botte grande 36 mesi", pairing: "Peposo all'imprunetina" },
      { edition: 2026, vintage: 2019, viti: 4, tastevin: true, price: "€ 58" },
      { edition: 2025, vintage: 2018, viti: 4, price: "€ 55" },
    ]),
    w("w-poggio-2", "p-poggio-ai-venti", "Rosso di Montalcino", { type: "Rosso", denomination: "Rosso di Montalcino", classification: "DOC e DOP", grapes: "Sangiovese 100%" }, [
      { edition: 2027, vintage: 2023, score: 87.5, viti: 3, price: "€ 22", alcohol: "13,5%", bottles: "40.000", fermentation: "acciaio", maturation: "botte grande 12 mesi", pairing: "Pici all'aglione" },
    ]),
    w("w-terre-1", "p-terre-rosse", "Primitivo di Manduria Riserva", { type: "Rosso", denomination: "Primitivo di Manduria", classification: "DOC e DOP", grapes: "Primitivo 100%",
      tastings: [{ id: "t-demo-3", date: "2026-08-09", vintage: 2021, occasion: "In cantina, vacanze in Salento", score: 88,
        sight: "Rubino impenetrabile.", nose: "Prugna, fico secco, carruba, spezie dolci.",
        palate: "Caldo e morbido, alcol ben integrato, chiude su note di cacao.", pairing: "Orecchiette al ragù di braciole", notes: "Pagato 24 € in cantina." }] }, [
      { edition: 2027, vintage: 2022, score: 90, viti: 4, price: "€ 28", alcohol: "15%", bottles: "4.000", fermentation: "acciaio", maturation: "botte piccola 18 mesi", pairing: "Bombette pugliesi" },
      { edition: 2026, vintage: 2021, viti: 3, price: "€ 26" },
    ]),
    w("w-terre-2", "p-terre-rosse", "Salento Rosato", { type: "Rosato", denomination: "Salento Rosato", classification: "IGT e IGP", grapes: "Negroamaro 80%, Primitivo 20%" }, [
      { edition: 2027, vintage: 2025, score: 85, viti: 3, price: "€ 12", alcohol: "12,5%", bottles: "8.000", fermentation: "acciaio", maturation: "acciaio 4 mesi", pairing: "Frittura di paranza" },
    ]),
  ];
  return { producers, wines };
}

// ── Generatore ───────────────────────────────────────────────
function generated(rand, usedNames) {
  const pick = (a) => a[Math.floor(rand() * a.length)];
  const between = (a, b) => a + rand() * (b - a);
  const chance = (p) => rand() < p;
  const person = () => `${pick(FIRST)} ${pick(LAST)}`;

  const producers = [];
  const wines = [];
  const places = [...PLACES].filter((pl) => !usedNames.has(pl));
  const regions = Object.keys(R);

  // Circa 3 produttori per regione, di più dove la guida è più densa.
  const weight = { Piemonte: 6, Toscana: 6, Veneto: 4, "Trentino-Alto Adige": 4, Campania: 4, Sicilia: 4, Puglia: 4, Lombardia: 3, "Friuli-Venezia Giulia": 3, Marche: 3, Abruzzo: 3, Sardegna: 3, Umbria: 3 };
  for (const region of regions) {
    const n = weight[region] || 2;
    for (let i = 0; i < n && places.length; i++) {
      const place = places.splice(Math.floor(rand() * places.length), 1)[0];
      const name = `${pick(PREFIX_BY_REGION[region])} ${place}`;
      const id = `p-${slug(name)}`;
      const townFull = pick(R[region].pr);
      const town = townFull.replace(/\s*\(.*\)/, "");
      const family = pick(LAST);
      const owner = chance(0.5) ? `Famiglia ${family}` : chance(0.5) ? `${pick(FIRST)} e ${pick(FIRST)} ${family}` : person();
      const domain = `${slug(place).replace(/-/g, "")}.example`;
      producers.push({
        id, name, owner,
        address: `${pick(STREETS)} ${place}, ${1 + Math.floor(rand() * 60)} - ${townFull}`,
        town, region,
        phone: "",
        email: chance(0.8) ? `info@${domain}` : "",
        website: chance(0.85) ? `www.${domain}` : "",
        founded: String(chance(0.25) ? 1850 + Math.floor(rand() * 80) : 1930 + Math.floor(rand() * 90)),
        oenologist: chance(0.5) ? `${pick(FIRST)} ${family}` : person(),
        agronomist: chance(0.6) ? `${pick(FIRST)} ${family}` : person(),
        viticulture: pick(["Convenzionale", "Convenzionale", "Biologica", "Biologica", "Biodinamica", "Lotta integrata"]),
        bottles: fmtInt(Math.round(between(8, 400)) * 1000),
        visits: chance(0.6), shop: chance(0.55),
        favorite: false, notes: "", lists: [],
      });

      // 2–6 vini per produttore, da denominazioni della regione.
      const nWines = 2 + Math.floor(rand() * 5);
      const pool = [...R[region].wines];
      for (let k = 0; k < nWines && pool.length; k++) {
        const [denom, classification, type, grapes, pmin, pmax] = pool.splice(Math.floor(rand() * pool.length), 1)[0];
        const cru = chance(0.55) ? ` ${pick(CRU)}` : "";
        const wname = `${denom}${cru}`;
        const wid = `${id}-${k + 1}`;
        // Distribuzione realistica: la maggior parte tra 86 e 91, poche eccellenze.
        let base = 84 + 9 * (rand() + rand()) / 2;
        if (chance(0.1)) base += between(2, 4.5);
        const mkRating = (edition, vintageOffset, withScore) => {
          const score = Math.round((base + between(-1.5, 1.5)) * 2) / 2;
          const s = Math.min(97, Math.max(83, score));
          // Annata in uscita: anni di affinamento tipici prima della recensione.
          const bigRed = /Barolo|Barbaresco|Brunello|Amarone|Taurasi|Gran Selezione|Sagrantino|Sforzato|Bolgheri Superiore|Riserva/.test(denom);
          const age = type === "Rosso" ? (bigRed ? 5 : 3) : type === "Passito" ? 5 : type === "Spumante" ? 4 : type === "Bianco" ? 2 : 2;
          const vintage = edition - age - (chance(0.3) ? 1 : 0) - vintageOffset;
          const price = Math.round(between(pmin, pmax) * (1 + (2027 - edition) * -0.03));
          const [amin, amax] = ALC[type];
          return {
            id: `${wid}-${edition}`,
            edition,
            vintage: type === "Spumante" && chance(0.4) ? null : vintage,
            score: withScore ? s : null,
            viti: viti(s),
            tastevin: s >= 95,
            selection: "",
            price: `€ ${price}`,
            format: type === "Passito" || type === "Dolce" ? pick(["0,375l", "0,500l"]) : "0,750l",
            alcohol: `${(Math.round(between(amin, amax) * 2) / 2).toLocaleString("it-IT")}%`,
            bottles: fmtInt(Math.round(between(1.5, 60)) * 500),
            fermentation: pick(FERMENT),
            maturation: pick(MATUR[type]),
            pairing: pick(PAIR[type]),
          };
        };
        const ratings = [mkRating(2027, 0, true)];
        if (chance(0.7)) ratings.push(mkRating(2026, 0, false));
        if (ratings.length > 1 && chance(0.6)) ratings.push(mkRating(2025, 0, false));
        wines.push({ id: wid, producerId: id, name: wname, type, denomination: denom, classification, grapes, favorite: false, notes: "", lists: [], tastings: [], ratings });
      }
    }
  }
  return { producers, wines };
}

export function demoData() {
  const hand = handmade();
  const used = new Set(["Le Sorgive", "Poggio ai Venti", "Terre Rosse"]);
  const gen = generated(rng(20271114), used);
  const now = new Date().toISOString();
  const stamp = (x) => ({ ...x, createdAt: now, updatedAt: now });
  return {
    version: 1,
    dataVersion: DATA_VERSION,
    producers: [...hand.producers, ...gen.producers].map(stamp),
    wines: [...hand.wines, ...gen.wines].map(stamp),
    lists: ["Da provare", "Da comprare"],
    recent: [],
  };
}

// Quando il catalogo dimostrativo cambia versione, si rigenera mantenendo
// preferiti, liste e note che l'utente aveva già messo (per id).
export function refreshCatalog(saved) {
  const fresh = demoData();
  if (!saved || saved.dataVersion === DATA_VERSION) return saved || fresh;
  const keep = (list, old) => {
    const byId = Object.fromEntries((old || []).map((x) => [x.id, x]));
    return list.map((x) => (byId[x.id] ? { ...x, favorite: byId[x.id].favorite, notes: byId[x.id].notes, lists: byId[x.id].lists, ...(byId[x.id].tastings?.length ? { tastings: byId[x.id].tastings } : {}) } : x));
  };
  const ids = new Set([...fresh.producers, ...fresh.wines].map((x) => x.id));
  return {
    ...fresh,
    producers: keep(fresh.producers, saved.producers),
    wines: keep(fresh.wines, saved.wines),
    lists: saved.lists?.length ? saved.lists : fresh.lists,
    recent: (saved.recent || []).filter((r) => ids.has(r.id)),
  };
}

// Azzera tutto ciò che è personale (preferiti, liste, note, recenti).
export function resetPersonal() {
  return demoData();
}
