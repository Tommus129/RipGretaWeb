// Costruzione dati per il report PDF di uno studente.
// Funzione pura: filtra le lezioni e calcola i totali, senza occuparsi del rendering.

function toDate(dateOrTimestamp) {
  if (!dateOrTimestamp) return null;
  return dateOrTimestamp?.toDate ? dateOrTimestamp.toDate() : new Date(dateOrTimestamp);
}

/**
 * @param {object} student   Studente { id, nome, cognome, ... }
 * @param {array}  lessons   Tutte le lezioni (verranno filtrate per studentId)
 * @param {object} opts
 * @param {"tutte"|"pagate"|"daPagare"} opts.stato   Filtro stato pagamento
 * @param {number|null} opts.month   Mese 0-11 (null = tutti i mesi)
 * @param {number|null} opts.year    Anno (null = tutti gli anni)
 * @returns {object} report pronto per il template PDF
 */
export function buildClientReport(student, lessons, opts = {}) {
  const { stato = "tutte", month = null, year = null } = opts;

  const righe = lessons
    .filter((l) => l.studentId === student.id)
    .filter((l) => {
      const d = toDate(l.date);
      if (!d) return false;
      if (year !== null && d.getFullYear() !== year) return false;
      if (month !== null && d.getMonth() !== month) return false;
      if (stato === "pagate" && !l.paid) return false;
      if (stato === "daPagare" && l.paid) return false;
      return true;
    })
    .map((l) => {
      const d = toDate(l.date);
      const importo = (l.duration ?? 0) * (l.rate ?? 0);
      return {
        date: d,
        duration: l.duration ?? 0,
        rate: l.rate ?? 0,
        importo,
        paid: !!l.paid,
        note: l.note ?? "",
      };
    })
    .sort((a, b) => a.date - b.date);

  const total = righe.reduce((s, r) => s + r.importo, 0);
  const incassato = righe.filter((r) => r.paid).reduce((s, r) => s + r.importo, 0);
  const daIncassare = total - incassato;
  const oreTotal = righe.reduce((s, r) => s + r.duration, 0);

  return {
    student,
    righe,
    totali: { total, incassato, daIncassare, oreTotal, numLezioni: righe.length },
    filtro: { stato, month, year },
    generatoIl: new Date(),
  };
}

const STATO_LABEL = {
  tutte: "Tutte le lezioni",
  pagate: "Solo pagate",
  daPagare: "Solo da pagare",
};

/** Etichetta leggibile del periodo/filtro applicato. */
export function describeFiltro({ stato, month, year }) {
  const mesi = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
    "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  let periodo = "Tutto lo storico";
  if (year !== null && month !== null) periodo = `${mesi[month]} ${year}`;
  else if (year !== null) periodo = `Anno ${year}`;
  return { periodo, stato: STATO_LABEL[stato] ?? "Tutte le lezioni" };
}

/** Nome file suggerito per il download. */
export function reportFileName(report) {
  const { student, filtro } = report;
  const { periodo } = describeFiltro(filtro);
  const slug = `${student.cognome}_${student.nome}_${periodo}`
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return `report_${slug}.pdf`;
}
