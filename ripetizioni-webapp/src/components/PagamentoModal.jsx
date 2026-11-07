import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { formatEuro, formatDate, allocaPagamento, vocePagata, chiaveVoce } from "../utils/helpers";

// Registra un pagamento ricevuto: inserisci l'importo e i singoli test non
// pagati vengono coperti in automatico dal più vecchio al più recente, finché
// i soldi bastano. Il resto resta come credito. La proposta si può correggere
// spuntando o togliendo i singoli test a mano.
export default function PagamentoModal({ onClose }) {
  const { evaluations, creditoGenerale, registraPagamento } = useApp();

  const [importo, setImporto] = useState("");
  const [manuali, setManuali] = useState(null); // null = proposta automatica
  const [saving, setSaving] = useState(false);

  const valore = parseFloat(importo) || 0;
  const disponibile = Math.round((creditoGenerale + valore) * 100) / 100;

  // Tutti i test non pagati, dal più vecchio (chi aspetta da più tempo)
  const nonPagate = useMemo(() => {
    const out = [];
    evaluations.forEach((e) => (e.voci ?? []).forEach((v, i) => {
      if (vocePagata(e, v)) return;
      out.push({
        key: chiaveVoce(e.id, i),
        nome: e.nome, cognome: e.cognome, data: e.date,
        voce: v.nome, prezzo: Number(v.prezzo) || 0,
        ts: e.date?.toMillis?.() ?? new Date(e.date).getTime() ?? 0,
      });
    }));
    return out.sort((a, b) => a.ts - b.ts);
  }, [evaluations]);

  const proposta = useMemo(() => allocaPagamento(nonPagate, disponibile), [nonPagate, disponibile]);
  const scelte = manuali ?? new Set(proposta.keys);

  const coperto = nonPagate.filter((v) => scelte.has(v.key)).reduce((s, v) => s + v.prezzo, 0);
  const nuovoCredito = Math.round((disponibile - coperto) * 100) / 100;
  const sforato = nuovoCredito < 0;
  // Prima valutazione non coperta (solo nella proposta automatica): è quella a cui manca qualcosa
  const primaScoperta = manuali ? null : nonPagate.find((v) => !scelte.has(v.key));

  function toggle(key) {
    const next = new Set(scelte);
    next.has(key) ? next.delete(key) : next.add(key);
    setManuali(next);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (valore <= 0 || sforato) return;
    setSaving(true);
    try {
      await registraPagamento({ importo: valore, chiavi: [...scelte] });
      onClose();
    } catch (err) {
      console.error(err);
      alert("Errore nel salvataggio del pagamento. Riprova.");
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-6)" }}>
          <h2 style={{ fontWeight: 700, fontSize: "var(--text-lg)" }}>Registra pagamento</h2>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Chiudi">✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div className="form-group">
            <label className="label">Importo ricevuto (€)</label>
            <input
              className="input" type="number" inputMode="decimal" step="0.5" min="0"
              value={importo} placeholder="Es. 40"
              onChange={(e) => { setImporto(e.target.value); setManuali(null); }}
              required autoFocus
            />
            {creditoGenerale > 0 && (
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-success)", fontWeight: 600 }}>
                + {formatEuro(creditoGenerale)} di credito già disponibile
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="label">Test non pagati, dal più vecchio</label>
            {nonPagate.length === 0 ? (
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                Nessun test da pagare: l'importo andrà tutto a credito.
              </span>
            ) : (
              <div style={{ border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden", maxHeight: 320, overflowY: "auto" }}>
                {nonPagate.map((v, i) => {
                  const pagato = scelte.has(v.key);
                  const mancante = primaScoperta?.key === v.key ? v.prezzo - proposta.resto : 0;
                  return (
                    <label
                      key={v.key}
                      style={{
                        display: "flex", alignItems: "center", gap: "var(--space-3)", cursor: "pointer",
                        padding: "var(--space-2) var(--space-3)",
                        borderTop: i === 0 ? "none" : "1px solid var(--color-divider)",
                        background: pagato ? "var(--color-primary-pale)" : "transparent",
                      }}
                    >
                      <input
                        type="checkbox" checked={pagato} onChange={() => toggle(v.key)}
                        style={{ width: 18, height: 18, accentColor: "var(--color-primary)", flexShrink: 0 }}
                      />
                      <span style={{ flex: 1, minWidth: 0, fontSize: "var(--text-sm)" }}>
                        <strong>{v.nome} {v.cognome}</strong> · {v.voce}
                        <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                          {formatDate(v.data)}
                        </span>
                        {mancante > 0 && valore > 0 && (
                          <span style={{ display: "block", fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-error)" }}>
                            Mancano {formatEuro(mancante)}
                          </span>
                        )}
                      </span>
                      <strong style={{ fontSize: "var(--text-sm)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                        {formatEuro(v.prezzo)}
                      </strong>
                    </label>
                  );
                })}
              </div>
            )}
            {manuali && (
              <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => setManuali(null)}>
                Ripristina proposta automatica
              </button>
            )}
          </div>

          {/* Riepilogo */}
          <div style={{
            background: "var(--color-primary-pale)", border: "1.5px solid var(--color-primary-light)",
            borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)",
            display: "flex", flexDirection: "column", gap: 4, fontSize: "var(--text-sm)",
          }}>
            <Riga label="Disponibile (credito + importo)" value={formatEuro(disponibile)} />
            <Riga label={`Test pagati: ${scelte.size}`} value={formatEuro(coperto)} />
            <Riga
              label={sforato ? "Mancano" : "Resta come credito"}
              value={formatEuro(Math.abs(nuovoCredito))}
              color={sforato ? "var(--color-error)" : "var(--color-success)"} forte
            />
          </div>

          <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annulla</button>
            <button type="submit" className="btn btn-primary" disabled={saving || valore <= 0 || sforato}>
              {saving ? "Salvo..." : "Conferma pagamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Riga({ label, value, color, forte }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", color: color ?? "var(--color-text-muted)", fontWeight: forte ? 800 : 600 }}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
