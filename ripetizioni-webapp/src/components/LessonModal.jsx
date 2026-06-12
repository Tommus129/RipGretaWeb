import { useState } from "react";
import { useApp } from "../context/AppContext";

function toDatePart(dateOrTimestamp) {
  if (!dateOrTimestamp) return "";
  const d = dateOrTimestamp?.toDate ? dateOrTimestamp.toDate() : new Date(dateOrTimestamp);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimePart(dateOrTimestamp) {
  if (!dateOrTimestamp) return "15:00";
  const d = dateOrTimestamp?.toDate ? dateOrTimestamp.toDate() : new Date(dateOrTimestamp);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Preset rapidi (in minuti)
const PRESET_MIN = [15, 30, 60, 90, 120, 150, 180, 210, 240, 300];

// Formatta una durata in minuti come testo leggibile
function fmtMinuti(m) {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (r === 0) return h === 1 ? "1 ora" : `${h} ore`;
  return `${h}h ${r}min`;
}

export default function LessonModal({ onClose, onSave, initial, defaultStudentId }) {
  const { students } = useApp();

  const [studentId, setStudentId] = useState(initial?.studentId ?? defaultStudentId ?? "");
  const [datePart, setDatePart] = useState(initial?.date ? toDatePart(initial.date) : toDatePart(new Date()));
  const [timePart, setTimePart] = useState(initial?.date ? toTimePart(initial.date) : "15:00");
  // Durata gestita in minuti per lo slider; nel modello dati è in ore.
  const [durationMin, setDurationMin] = useState(initial?.duration ? Math.round(initial.duration * 60) : 60);
  const [rate, setRate] = useState(initial?.rate ?? 20);
  const [paid, setPaid] = useState(initial?.paid ?? false);
  const [note, setNote] = useState(initial?.note ?? "");
  const [extraCredit, setExtraCredit] = useState(initial?.extraCredit ?? 0);

  const durationHours = durationMin / 60;
  const total = durationHours * (parseFloat(rate) || 0);

  function handleSubmit(e) {
    e.preventDefault();
    if (!studentId || !datePart) return;
    const student = students.find((s) => s.id === studentId);
    const combined = new Date(`${datePart}T${timePart}:00`);
    onSave({
      ...initial,
      id: initial?.id ?? crypto.randomUUID(),
      studentId,
      studentName: student ? `${student.nome} ${student.cognome}` : "",
      date: combined,
      duration: durationHours,
      rate: parseFloat(rate),
      paid,
      note: note.trim(),
      extraCredit: parseFloat(extraCredit) || 0,
    });
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-6)" }}>
          <h2 style={{ fontWeight: 700, fontSize: "var(--text-lg)" }}>
            {initial ? "Modifica lezione" : "Nuova lezione"}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

          {/* Studente */}
          <div className="form-group">
            <label className="label">Studente</label>
            <select className="select" value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
              <option value="">Seleziona studente...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.nome} {s.cognome}</option>
              ))}
            </select>
          </div>

          {/* Data e Ora */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div className="form-group">
              <label className="label">Data</label>
              <input className="input" type="date" value={datePart} onChange={(e) => setDatePart(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">Ora inizio</label>
              <input className="input" type="time" value={timePart} onChange={(e) => setTimePart(e.target.value)} step="300" />
            </div>
          </div>

          {/* Durata — slider */}
          <div className="form-group">
            <label className="label">Durata</label>
            <div style={{ textAlign: "center", margin: "var(--space-2) 0 var(--space-3)" }}>
              <span style={{ fontSize: "var(--text-xl)", fontWeight: 800, color: "var(--color-primary)", letterSpacing: "-0.02em" }}>
                {fmtMinuti(durationMin)}
              </span>
              <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>
                {durationMin} minuti
              </span>
            </div>
            <style>{`
              .duration-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: var(--radius-full); background: var(--color-primary-light); outline: none; }
              .duration-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; border-radius: 50%; background: var(--color-primary); cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.25); }
              .duration-slider::-moz-range-thumb { width: 22px; height: 22px; border: none; border-radius: 50%; background: var(--color-primary); cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,0.25); }
            `}</style>
            <input
              type="range"
              className="duration-slider"
              min={5} max={300} step={5}
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginTop: "var(--space-3)", justifyContent: "center" }}>
              {PRESET_MIN.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDurationMin(m)}
                  style={{
                    padding: "var(--space-1) var(--space-3)",
                    borderRadius: "var(--radius-full)",
                    fontSize: "var(--text-xs)", fontWeight: 600,
                    border: "1.5px solid",
                    cursor: "pointer", transition: "all var(--transition)",
                    borderColor: durationMin === m ? "var(--color-primary)" : "var(--color-border)",
                    background: durationMin === m ? "var(--color-primary)" : "transparent",
                    color: durationMin === m ? "#fff" : "var(--color-text-muted)",
                  }}
                >
                  {m < 60 ? `${m}m` : m % 60 === 0 ? `${m / 60}h` : `${Math.floor(m / 60)}h${m % 60}`}
                </button>
              ))}
            </div>
          </div>

          {/* Tariffa */}
          <div className="form-group">
            <label className="label">Tariffa (€/ora)</label>
            <input className="input" type="number" inputMode="decimal" step="0.5" min="1" value={rate} onChange={(e) => setRate(e.target.value)} required />
          </div>

          {/* Totale */}
          <div style={{
            background: "var(--color-primary-pale)", border: "1.5px solid var(--color-primary-light)",
            borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", fontWeight: 600 }}>Totale lezione</span>
            <span style={{ fontWeight: 800, fontSize: "var(--text-lg)", color: "var(--color-primary)" }}>
              €{total.toFixed(2)}
            </span>
          </div>

          {/* Extra credito */}
          <div className="form-group">
            <label className="label">Extra credito (€)</label>
            <input className="input" type="number" step="0.01" min="0" value={extraCredit} onChange={(e) => setExtraCredit(e.target.value)} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              Importo aggiuntivo pagato (es. anticipo)
            </span>
          </div>

          {/* Note */}
          <div className="form-group">
            <label className="label">Note (opzionale)</label>
            <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Es. ripasso equazioni..." style={{ resize: "vertical" }} />
          </div>

          {/* Pagato */}
          <label style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", cursor: "pointer" }}>
            <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} style={{ width: 20, height: 20, accentColor: "var(--color-primary)" }} />
            <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>Lezione già pagata</span>
          </label>

          {/* Bottoni */}
          <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annulla</button>
            <button type="submit" className="btn btn-primary">
              {initial ? "Salva modifiche" : "Aggiungi lezione"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
