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

const DURATA_OPTIONS = [
  { label: "15 min", value: 0.25 },
  { label: "20 min", value: 0.333 },
  { label: "30 min", value: 0.5 },
  { label: "40 min", value: 0.667 },
  { label: "45 min", value: 0.75 },
  { label: "1 ora", value: 1 },
  { label: "1h 15min", value: 1.25 },
  { label: "1h 30min", value: 1.5 },
  { label: "1h 45min", value: 1.75 },
  { label: "2 ore", value: 2 },
  { label: "2h 30min", value: 2.5 },
  { label: "3 ore", value: 3 },
];

export default function LessonModal({ onClose, onSave, initial, defaultStudentId }) {
  const { students } = useApp();

  const [studentId, setStudentId] = useState(initial?.studentId ?? defaultStudentId ?? "");
  const [datePart, setDatePart] = useState(initial?.date ? toDatePart(initial.date) : toDatePart(new Date()));
  const [timePart, setTimePart] = useState(initial?.date ? toTimePart(initial.date) : "15:00");
  const [duration, setDuration] = useState(initial?.duration ?? 1);
  const [rate, setRate] = useState(initial?.rate ?? 20);
  const [paid, setPaid] = useState(initial?.paid ?? false);
  const [note, setNote] = useState(initial?.note ?? "");
  const [extraCredit, setExtraCredit] = useState(initial?.extraCredit ?? 0);

  const total = (parseFloat(duration) || 0) * (parseFloat(rate) || 0);

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
      duration: parseFloat(duration),
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

          {/* Data e Ora separati */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div className="form-group">
              <label className="label">Data</label>
              <input
                className="input"
                type="date"
                value={datePart}
                onChange={(e) => setDatePart(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Ora inizio</label>
              <input
                className="input"
                type="time"
                value={timePart}
                onChange={(e) => setTimePart(e.target.value)}
                step="300"
              />
            </div>
          </div>

          {/* Durata — bottoni rapidi */}
          <div className="form-group">
            <label className="label">Durata</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {DURATA_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDuration(opt.value)}
                  style={{
                    padding: "var(--space-1) var(--space-3)",
                    borderRadius: "var(--radius-full)",
                    fontSize: "var(--text-xs)",
                    fontWeight: 600,
                    border: "1.5px solid",
                    cursor: "pointer",
                    transition: "all var(--transition)",
                    borderColor: duration === opt.value ? "var(--color-primary)" : "var(--color-border)",
                    background: duration === opt.value ? "var(--color-primary)" : "transparent",
                    color: duration === opt.value ? "#fff" : "var(--color-text-muted)",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tariffa */}
          <div className="form-group">
            <label className="label">Tariffa (€/ora)</label>
            <input
              className="input"
              type="number"
              step="0.5"
              min="1"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              required
            />
          </div>

          {/* Totale calcolato */}
          <div style={{
            background: "var(--color-primary-pale)",
            border: "1px solid var(--color-primary-light)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3) var(--space-4)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>Totale lezione</span>
            <span style={{ fontWeight: 700, fontSize: "var(--text-lg)", color: "var(--color-primary)" }}>
              €{total.toFixed(2)}
            </span>
          </div>

          {/* Extra credito */}
          <div className="form-group">
            <label className="label">Extra credito (€)</label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              value={extraCredit}
              onChange={(e) => setExtraCredit(e.target.value)}
            />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              Importo aggiuntivo pagato (es. anticipo)
            </span>
          </div>

          {/* Note */}
          <div className="form-group">
            <label className="label">Note (opzionale)</label>
            <textarea
              className="input"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Es. ripasso equazioni..."
              style={{ resize: "vertical" }}
            />
          </div>

          {/* Pagato */}
          <label style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: "var(--color-primary)" }}
            />
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