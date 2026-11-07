import { useState } from "react";
import { useApp } from "../context/AppContext";
import { Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { vocePagata } from "../utils/helpers";

function toDatePart(dateOrTimestamp) {
  if (!dateOrTimestamp) return "";
  const d = dateOrTimestamp?.toDate ? dateOrTimestamp.toDate() : new Date(dateOrTimestamp);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Stato iniziale delle voci: per ogni tipo configurato in Impostazioni tiene
// se e' flaggato e con quale prezzo (di default quello del tipo, modificabile
// solo per questa scheda).
function vociIniziali(evaluationTypes, initial) {
  const salvate = new Map((initial?.voci ?? []).map((v) => [v.typeId, v]));
  const righe = evaluationTypes.map((t) => {
    const salvata = salvate.get(t.id);
    return {
      typeId: t.id,
      nome: t.nome,
      prezzo: String(salvata ? salvata.prezzo : (t.prezzo ?? 0)),
      checked: !!salvata,
      paid: salvata ? vocePagata(initial, salvata) : false,
      rimossa: false,
    };
  });

  // Voci presenti nella scheda ma il cui tipo e' stato eliminato dalle
  // impostazioni: restano visibili per non alterare lo storico.
  const idsAttivi = new Set(evaluationTypes.map((t) => t.id));
  (initial?.voci ?? []).forEach((v) => {
    if (!idsAttivi.has(v.typeId)) {
      righe.push({
        typeId: v.typeId,
        nome: v.nome,
        prezzo: String(v.prezzo ?? 0),
        checked: true,
        paid: vocePagata(initial, v),
        rimossa: true,
      });
    }
  });

  return righe;
}

export default function EvaluationModal({ onClose, onSave, initial }) {
  const { evaluationTypes } = useApp();
  const navigate = useNavigate();

  const [nome, setNome] = useState(initial?.nome ?? "");
  const [cognome, setCognome] = useState(initial?.cognome ?? "");
  const [datePart, setDatePart] = useState(
    initial?.date ? toDatePart(initial.date) : toDatePart(new Date())
  );
  const [voci, setVoci] = useState(() => vociIniziali(evaluationTypes, initial));
  const [note, setNote] = useState(initial?.note ?? "");
  // Stato pagamento per test: la casella "già pagata" li segna tutti insieme
  const [paid, setPaid] = useState(
    () => (initial?.voci ?? []).length > 0 && initial.voci.every((v) => vocePagata(initial, v))
  );

  function togglePaidTutti(valore) {
    setPaid(valore);
    setVoci((prev) => prev.map((v) => ({ ...v, paid: valore })));
  }

  const totale = voci
    .filter((v) => v.checked)
    .reduce((s, v) => s + (parseFloat(v.prezzo) || 0), 0);

  function aggiorna(typeId, patch) {
    setVoci((prev) => prev.map((v) => (v.typeId === typeId ? { ...v, ...patch } : v)));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!nome.trim() || !cognome.trim()) return;
    onSave({
      ...initial,
      id: initial?.id ?? crypto.randomUUID(),
      nome: nome.trim(),
      cognome: cognome.trim(),
      date: new Date(`${datePart}T12:00:00`),
      voci: voci
        .filter((v) => v.checked)
        .map((v) => ({ typeId: v.typeId, nome: v.nome, prezzo: parseFloat(v.prezzo) || 0, paid: !!v.paid })),
      note: note.trim(),
    });
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-6)" }}>
          <h2 style={{ fontWeight: 700, fontSize: "var(--text-lg)" }}>
            {initial ? "Modifica valutazione" : "Nuova valutazione"}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

          {/* Anagrafica */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div className="form-group">
              <label className="label">Nome</label>
              <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Es. Mario" required />
            </div>
            <div className="form-group">
              <label className="label">Cognome</label>
              <input className="input" value={cognome} onChange={(e) => setCognome(e.target.value)} placeholder="Es. Rossi" required />
            </div>
          </div>

          {/* Data */}
          <div className="form-group">
            <label className="label">Data</label>
            <input className="input" type="date" value={datePart} onChange={(e) => setDatePart(e.target.value)} required />
          </div>

          {/* Voci di valutazione */}
          <div className="form-group">
            <label className="label">Valutazioni incluse</label>

            {voci.length === 0 ? (
              <div style={{
                padding: "var(--space-4)",
                border: "1.5px dashed var(--color-border)",
                borderRadius: "var(--radius-md)",
                textAlign: "center",
                color: "var(--color-text-muted)",
                fontSize: "var(--text-sm)",
              }}>
                <p style={{ fontWeight: 600, marginBottom: "var(--space-2)" }}>
                  Nessun tipo di valutazione configurato
                </p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => { onClose(); navigate("/impostazioni"); }}
                >
                  <Settings2 size={13} /> Vai alle Impostazioni
                </button>
              </div>
            ) : (
              <div style={{
                border: "1.5px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
              }}>
                {voci.map((v, i) => (
                  <div
                    key={v.typeId}
                    style={{
                      display: "flex", alignItems: "center", gap: "var(--space-3)",
                      padding: "var(--space-2) var(--space-3)",
                      borderTop: i === 0 ? "none" : "1px solid var(--color-divider)",
                      background: v.checked ? "var(--color-primary-pale)" : "transparent",
                      transition: "background var(--transition)",
                    }}
                  >
                    <input
                      type="checkbox"
                      id={`voce-${v.typeId}`}
                      checked={v.checked}
                      onChange={(e) => aggiorna(v.typeId, { checked: e.target.checked })}
                      style={{ width: 18, height: 18, accentColor: "var(--color-primary)", flexShrink: 0 }}
                    />
                    <label
                      htmlFor={`voce-${v.typeId}`}
                      style={{
                        flex: 1, cursor: "pointer", fontSize: "var(--text-sm)",
                        fontWeight: v.checked ? 700 : 600,
                        color: v.checked ? "var(--color-text)" : "var(--color-text-muted)",
                      }}
                    >
                      {v.nome}
                      {v.rimossa && (
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-faint)", fontWeight: 600, marginLeft: 6 }}>
                          (tipo eliminato)
                        </span>
                      )}
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                      <input
                        className="input"
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        min="0"
                        value={v.prezzo}
                        disabled={!v.checked}
                        onChange={(e) => aggiorna(v.typeId, { prezzo: e.target.value })}
                        aria-label={`Prezzo ${v.nome}`}
                        style={{ width: 80, textAlign: "right", opacity: v.checked ? 1 : 0.45 }}
                      />
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", fontWeight: 600 }}>€</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              Il prezzo arriva dalle Impostazioni ma puoi correggerlo solo per questa scheda.
            </span>
          </div>

          {/* Totale */}
          <div style={{
            background: "var(--color-primary-pale)", border: "1.5px solid var(--color-primary-light)",
            borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", fontWeight: 600 }}>
              Totale scheda
            </span>
            <span style={{ fontWeight: 800, fontSize: "var(--text-lg)", color: "var(--color-primary)" }}>
              €{totale.toFixed(2)}
            </span>
          </div>

          {/* Note */}
          <div className="form-group">
            <label className="label">Note (opzionale)</label>
            <textarea
              className="input" rows={2} value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Es. consegna entro venerdì..."
              style={{ resize: "vertical" }}
            />
          </div>

          {/* Pagato */}
          <label style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", cursor: "pointer" }}>
            <input
              type="checkbox" checked={paid} onChange={(e) => togglePaidTutti(e.target.checked)}
              style={{ width: 20, height: 20, accentColor: "var(--color-primary)" }}
            />
            <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>Valutazione già pagata</span>
          </label>

          {/* Bottoni */}
          <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annulla</button>
            <button type="submit" className="btn btn-primary">
              {initial ? "Salva modifiche" : "Aggiungi valutazione"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
