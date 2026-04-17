import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { formatEuro, formatDate, formatDuration } from "../utils/helpers";
import LessonModal from "../components/LessonModal";
import {
  ArrowLeft, CheckCircle, AlertCircle, Pencil, Trash2,
  Coins, Plus, TrendingUp, Clock
} from "lucide-react";

function CreditoModal({ student, onClose, onSave }) {
  const [credito, setCredito] = useState(student.creditoResiduo ?? 0);
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 360 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-6)" }}>
          <h2 style={{ fontWeight: 700, fontSize: "var(--text-lg)" }}>Modifica credito</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            Il credito residuo è l'importo che lo studente ha pagato in anticipo e che verrà scalato dalle prossime lezioni.
          </p>
          <div className="form-group">
            <label className="label">Credito residuo (€)</label>
            <input
              className="input" type="number" step="0.01" min="0"
              value={credito} onChange={(e) => setCredito(e.target.value)}
              autoFocus
            />
          </div>
          <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={onClose}>Annulla</button>
            <button className="btn btn-primary" onClick={() => onSave(parseFloat(credito) || 0)}>
              Salva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudenteDettaglio() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { students, lessons, updateLesson, addLesson, deleteLesson, togglePaid, updateCredito } = useApp();

  const student = students.find((s) => s.id === id);
  const studentLessons = useMemo(() =>
    lessons
      .filter((l) => l.studentId === id)
      .sort((a, b) => {
        const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const db2 = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return db2 - da;
      }),
    [lessons, id]
  );

  const [lessonModal, setLessonModal] = useState(null);
  const [creditoModal, setCreditoModal] = useState(false);

  if (!student) return (
    <div style={{ textAlign: "center", padding: "var(--space-12)", color: "var(--color-text-muted)" }}>
      <p style={{ fontWeight: 600 }}>Studente non trovato</p>
      <button className="btn btn-primary" style={{ marginTop: "var(--space-4)" }} onClick={() => navigate("/studenti")}>
        Torna agli studenti
      </button>
    </div>
  );

  const total = studentLessons.reduce((s, l) => s + l.duration * l.rate, 0);
  const incassato = studentLessons.filter((l) => l.paid).reduce((s, l) => s + l.duration * l.rate, 0);
  const daIncassare = total - incassato;
  const oreTotal = studentLessons.reduce((s, l) => s + l.duration, 0);
  const credito = student.creditoResiduo ?? 0;

  async function handleSave(data) {
    if (lessonModal?.id) await updateLesson(data);
    else await addLesson(data);
    setLessonModal(null);
  }

  async function handleDelete(lessonId) {
    if (!confirm("Eliminare questa lezione?")) return;
    await deleteLesson(lessonId);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>

      {/* Back + header */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate("/studenti")}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "var(--radius-full)",
            background: "var(--color-primary-light)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, color: "var(--color-primary)", fontSize: "var(--text-lg)",
          }}>
            {student.nome[0]}{student.cognome[0]}
          </div>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: "var(--text-lg)" }}>{student.nome} {student.cognome}</h2>
            <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              {studentLessons.length} lezioni totali · {formatDuration(oreTotal)} di ripetizioni
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "var(--space-3)" }}>
        {[
          { label: "Totale maturato", value: formatEuro(total), color: "var(--color-text)", icon: TrendingUp },
          { label: "Incassato", value: formatEuro(incassato), color: "var(--color-success)", icon: CheckCircle },
          { label: "Da incassare", value: formatEuro(daIncassare), color: "var(--color-error)", icon: AlertCircle },
          { label: "Ore totali", value: formatDuration(oreTotal), color: "var(--color-secondary)", icon: Clock },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card" style={{ padding: "var(--space-4)" }}>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "var(--space-2)" }}>
              {label}
            </div>
            <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Sezione credito */}
      <div className="card" style={{
        background: "var(--color-secondary-light)",
        border: "1px solid #e8d5f0",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "var(--space-4) var(--space-6)", flexWrap: "wrap", gap: "var(--space-3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <Coins size={22} color="var(--color-secondary)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: "var(--text-base)" }}>Credito residuo</div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              Importo già pagato in anticipo dallo studente
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <span style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-secondary)" }}>
            {formatEuro(credito)}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => setCreditoModal(true)}>
            <Pencil size={13} /> Modifica
          </button>
        </div>
      </div>

      {/* Lista lezioni */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "var(--space-4) var(--space-6)",
          borderBottom: "1px solid var(--color-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h3 style={{ fontWeight: 700 }}>Lezioni</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setLessonModal({})}>
            <Plus size={14} /> Aggiungi lezione
          </button>
        </div>

        {studentLessons.length === 0 ? (
          <div style={{ padding: "var(--space-10)", textAlign: "center", color: "var(--color-text-muted)" }}>
            <p style={{ fontWeight: 600 }}>Nessuna lezione ancora</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--color-surface-offset)" }}>
                {["Data", "Durata", "Tariffa", "Totale", "Stato", ""].map((h) => (
                  <th key={h} style={{
                    padding: "var(--space-2) var(--space-4)", textAlign: "left",
                    fontSize: "var(--text-xs)", fontWeight: 600,
                    color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studentLessons.map((l, i) => (
                <tr key={l.id ?? i} style={{ borderTop: "1px solid var(--color-divider)" }}>
                  <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-sm)" }}>{formatDate(l.date)}</td>
                  <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{formatDuration(l.duration)}</td>
                  <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{l.rate}€/h</td>
                  <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-sm)", fontWeight: 700 }}>{formatEuro(l.duration * l.rate)}</td>
                  <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                    <button
                      onClick={() => togglePaid(l)}
                      className={`badge ${l.paid ? "badge-paid" : "badge-unpaid"}`}
                      style={{ cursor: "pointer", border: "none" }}
                    >
                      {l.paid
                        ? <><CheckCircle size={10} style={{ marginRight: 3 }} />Pagata</>
                        : <><AlertCircle size={10} style={{ marginRight: 3 }} />Non pagata</>
                      }
                    </button>
                  </td>
                  <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                    <div style={{ display: "flex", gap: "var(--space-1)" }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setLessonModal(l)} aria-label="Modifica">
                        <Pencil size={13} />
                      </button>
                      <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(l.id)} aria-label="Elimina">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modali */}
      {lessonModal !== null && (
        <LessonModal
          onClose={() => setLessonModal(null)}
          onSave={handleSave}
          initial={lessonModal?.id ? lessonModal : null}
          defaultStudentId={id}
        />
      )}
      {creditoModal && (
        <CreditoModal
          student={student}
          onClose={() => setCreditoModal(false)}
          onSave={async (val) => { await updateCredito(id, val); setCreditoModal(false); }}
        />
      )}
    </div>
  );
}