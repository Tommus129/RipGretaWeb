export function formatEuro(amount) {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(amount ?? 0);
  }
  
  export function formatDate(dateOrTimestamp) {
    if (!dateOrTimestamp) return "";
    const d = dateOrTimestamp?.toDate ? dateOrTimestamp.toDate() : new Date(dateOrTimestamp);
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit", month: "2-digit", year: "numeric",
    }).format(d);
  }
  
  export function formatDateTime(dateOrTimestamp) {
    if (!dateOrTimestamp) return "";
    const d = dateOrTimestamp?.toDate ? dateOrTimestamp.toDate() : new Date(dateOrTimestamp);
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(d);
  }
  
  export function formatDuration(hours) {
    if (hours === 1) return "1 ora";
    if (Number.isInteger(hours)) return `${hours} ore`;
    const h = Math.floor(hours);
    const min = Math.round((hours - h) * 60);
    if (h === 0) return `${min} min`;
    return `${h}h ${min}min`;
  }
  
  export function toInputDatetime(dateOrTimestamp) {
    if (!dateOrTimestamp) return "";
    const d = dateOrTimestamp?.toDate ? dateOrTimestamp.toDate() : new Date(dateOrTimestamp);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  
  export function getMonthName(month) {
    return new Intl.DateTimeFormat("it-IT", { month: "long" }).format(new Date(2000, month, 1));
  }
  
  export function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
  }

/** Totale di una scheda valutazione: somma dei prezzi delle voci flaggate. */
export function totaleValutazione(valutazione) {
  return (valutazione?.voci ?? []).reduce((s, v) => s + (Number(v.prezzo) || 0), 0);
}

/** Chiave stabile di una persona (le schede non hanno un id studente). */
export function chiavePersona(nome, cognome) {
  return `${nome ?? ""} ${cognome ?? ""}`.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Una voce (test) e' pagata se e' flaggata nella voce o se l'intera scheda
 * risulta pagata (schede salvate prima della gestione per test).
 */
export function vocePagata(valutazione, voce) {
  return !!(valutazione?.paid || voce?.paid);
}

/** Importo gia' incassato di una scheda, somma delle voci pagate. */
export function incassoValutazione(valutazione) {
  return (valutazione?.voci ?? [])
    .filter((v) => vocePagata(valutazione, v))
    .reduce((s, v) => s + (Number(v.prezzo) || 0), 0);
}

/** Chiave stabile di un test: id scheda + posizione della voce. */
export function chiaveVoce(valutazioneId, indice) {
  return `${valutazioneId}|${indice}`;
}

/**
 * Paga i test nell'ordine dato (dal piu' vecchio) finche' il disponibile
 * basta: si ferma al primo che non e' coperto per intero.
 * `voci` sono { key, prezzo } gia' ordinate. Ritorna le chiavi pagate,
 * il resto e quanto manca per il primo non coperto.
 */
export function allocaPagamento(voci, disponibile) {
  let resto = Math.round(disponibile * 100);
  const keys = [];
  let manca = 0;
  for (const v of voci) {
    const costo = Math.round(v.prezzo * 100);
    if (costo > resto) { manca = (costo - resto) / 100; break; }
    resto -= costo;
    keys.push(v.key);
  }
  return { keys, resto: resto / 100, manca };
}
