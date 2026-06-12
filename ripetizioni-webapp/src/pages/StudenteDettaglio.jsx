import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { formatEuro, formatDate, formatDuration, getMonthName } from "../utils/helpers";
import LessonModal from "../components/LessonModal";
import ExportReportModal from "../components/ExportReportModal";
import {
  ArrowLeft, CheckCircle, AlertCircle, Pencil, Trash2,
  Coins, Plus, TrendingUp, Clock, FileDown
} from "lucide-react";

function toDate(x) {
  return x?.toDate ? x.toDate() : new Date(x);
}

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
            <input className="input" type="number" step="0.01" min="0" value={credito} onChange={(e) => setCredito(e.target.value)} autoFocus />
          </div>
          <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
            <button className="btn btn-ghost" onClick={onClose}>Annulla</button>
            <button className="btn btn-primary" onClick={() => onSave(parseFloat(credito) || 0)}>Salva</button>
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
      .sort((a, b) => toDate(b.date) - toDate(a.date)),
    [lessons, id]
  );

  // Raggruppamento per mese (i gruppi restano in ordine decrescente)
  const gruppi = useMemo(() => {
    const map = new Map();
    for (const l of studentLessons) {
      const d = toDate(l.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: `${getMonthName(d.getMonth())} ${d.getFullYear()}`.toUpperCase(),
          lessons: [],
        });
      }
      map.get(key).lessons.push(l);
    }
    return [...map.values()];
  }, [studentLessons]);

  const [lessonModal, setLessonModal] = useState(null);
  const [creditoModal, setCreditoModal] = useState(false);
  const [exportModal, setExportModal] = useState(false);

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

  const statCards = [
    { label: "Totale maturato", value: formatEuro(total), color: "var(--color-text)", icon: TrendingUp },
    { label: "Incassato", value: formatEuro(incassato), color: "var(--color-success)", icon: CheckCircle },
    { label: "Da incassare", value: formatEuro(daIncassare), color: "var(--color-error)", icon: AlertCircle },
    { label: "Ore totali", value: formatDuration(oreTotal), color: "var(--color-secondary)", icon: Clock },
  ];

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
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

      {/* Header studente */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <button className="btn btn-ghost btn-icon" onClick={() => navigate("/studenti")} style={{ width: 36, height: 36, flexShrink: 0 }}>
          <ArrowLeft size={17} />
        </button>
        <div style={{
          width: 44, height: 44, borderRadius: "var(--radius-full)",
          background: "var(--color-primary-light)", border: "2px solid var(--color-primary)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, color: "var(--color-primary)", fontSize: "var(--text-sm)", flexShrink: 0,
        }}>
          {student.nome[0]}{student.cognome[0]}
        </div>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: "var(--text-base)", letterSpacing: "-0.01em" }}>
            {student.nome} {student.cognome}
          </h2>
          <p style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", marginTop: 2 }}>
            {studentLessons.length} lezioni · {formatDuration(oreTotal)} di ripetizioni
          </p>
        </div>
        <button
          className="btn btn-secondary"
          style={{ marginLeft: "auto" }}
          onClick={() => setExportModal(true)}
          disabled={studentLessons.length === 0}
        >
          <FileDown size={15} /> Esporta PDF
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: "var(--space-3)" }}>
        {statCards.map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card" style={{ padding: "var(--space-4)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.35 }}>
                {label}
              </span>
              <div style={{ width: 28, height: 28, flexShrink: 0, borderRadius: "var(--radius-sm)", background: color + "22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={14} color={color} />
              </div>
            </div>
            <div style={{ fontSize: "var(--text-base)", fontWeight: 800, color, lineHeight: 1.15, letterSpacing: "-0.01em" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Credito residuo */}
      <div className="card" style={{
        background: "var(--color-secondary-light)", border: "1.5px solid var(--color-secondary)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "var(--space-4) var(--space-5)", flexWrap: "wrap", gap: "var(--space-3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: "var(--color-secondary)22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Coins size={18} color="var(--color-secondary)" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "var(--text-sm)" }}>Credito residuo</div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              Importo pagato in anticipo dallo studente
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--color-secondary)" }}>{formatEuro(credito)}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setCreditoModal(true)}>
            <Pencil size={13} /> Modifica
          </button>
        </div>
      </div>

      {/* Header lista + aggiungi */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "var(--space-2)" }}>
        <h3 style={{ fontWeight: 800, fontSize: "var(--text-base)" }}>Lezioni</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setLessonModal({})}>
          <Plus size={14} /> Aggiungi lezione
        </button>
      </div>

      {/* Lezioni raggruppate per mese */}
      {studentLessons.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-10)", color: "var(--color-text-muted)" }}>
          <p style={{ fontWeight: 700 }}>Nessuna lezione ancora</p>
          <p style={{ fontSize: "var(--text-xs)", fontWeight: 500, marginTop: "var(--space-2)" }}>
            Aggiungi la prima lezione con il pulsante qui sopra
          </p>
        </div>
      ) : (
        gruppi.map((g) => {
          const tot = g.lessons.reduce((s, l) => s + l.duration * l.rate, 0);
          const inc = g.lessons.filter((l) => l.paid).reduce((s, l) => s + l.duration * l.rate, 0);
          return (
            <div key={g.key} style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {/* Intestazione mese */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "var(--space-2)", borderBottom: "1.5px solid var(--color-border)", paddingBottom: "var(--space-2)" }}>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>{g.label}</span>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)" }}>
                  {g.lessons.length} lezioni · {formatEuro(tot)}
                  {inc < tot && (
                    <span style={{ color: "var(--color-error)", marginLeft: "var(--space-2)", fontWeight: 700 }}>
                      ({formatEuro(tot - inc)} da incassare)
                    </span>
                  )}
                </span>
              </div>

              {/* Card lezione */}
              {g.lessons.map((l) => (
                <div
                  key={l.id}
                  className="card"
                  style={{
                    padding: "var(--space-4) var(--space-5)",
                    display: "flex", flexDirection: "column", gap: "var(--space-2)",
                    borderLeft: `3px solid ${l.paid ? "var(--color-success)" : "var(--color-error)"}`,
                    transition: "box-shadow var(--transition)",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-md)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-sm)")}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-2)" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>{formatDate(l.date)}</div>
                      <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", marginTop: 2 }}>
                        {formatDuration(l.duration)} · {l.rate}€/h
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "var(--text-sm)", letterSpacing: "-0.01em" }}>
                      {formatEuro(l.duration * l.rate)}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <button
                        onClick={() => togglePaid(l)}
                        className={`badge ${l.paid ? "badge-paid" : "badge-unpaid"}`}
                        style={{ cursor: "pointer", border: "none", fontSize: "var(--text-xs)", fontWeight: 700, padding: "var(--space-1) var(--space-2)" }}
                      >
                        {l.paid
                          ? <><CheckCircle size={12} style={{ marginRight: 3 }} />Pagata</>
                          : <><AlertCircle size={12} style={{ marginRight: 3 }} />Non pagata</>}
                      </button>
                      <button className="btn btn-ghost btn-icon" style={{ width: 32, height: 32 }} onClick={() => setLessonModal(l)} aria-label="Modifica" title="Modifica">
                        <Pencil size={13} color="var(--color-text-muted)" />
                      </button>
                      <button className="btn btn-danger btn-icon" style={{ width: 32, height: 32 }} onClick={() => handleDelete(l.id)} aria-label="Elimina" title="Elimina">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })
      )}

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
      {exportModal && (
        <ExportReportModal
          student={student}
          lessons={lessons}
          onClose={() => setExportModal(false)}
        />
      )}
    </div>
  );
}
