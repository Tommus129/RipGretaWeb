import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { formatEuro, formatDate, formatDuration } from "../utils/helpers";
import { TrendingUp, Clock, BookOpen, AlertCircle, CheckCircle, Plus } from "lucide-react";
import LessonModal from "../components/LessonModal";

function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {label}
        </span>
        <div style={{
          width: 32, height: 32, borderRadius: "var(--radius-md)",
          background: color + "22",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={16} color={color} />
        </div>
      </div>
      <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-text)" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { lessons, students, getWeeklyStats, getMonthlyStats, addLesson, loading } = useApp();
  const navigate = useNavigate();

  // Apertura modale "Aggiungi lezione": null = chiusa, {} = nuova lezione
  const [lessonModal, setLessonModal] = useState(null);

  async function handleSaveLesson(data) {
    await addLesson(data);
    setLessonModal(null);
  }

  const now = new Date();
  const weekly = getWeeklyStats();
  const monthly = getMonthlyStats(now.getMonth(), now.getFullYear());

  const recentLessons = useMemo(() =>
    [...lessons]
      .sort((a, b) => {
        const da = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const db2 = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return db2 - da;
      })
      .slice(0, 5),
    [lessons]
  );

  const unpaidCount = lessons.filter((l) => !l.paid).length;

  if (loading) return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "var(--space-4)" }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 110, borderRadius: "var(--radius-lg)" }} />
      ))}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)" }}>

      {/* ── Saluto + azione rapida ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>
            Ciao Greta! 👋
          </h2>
          <p style={{ color: "var(--color-text-muted)", marginTop: "var(--space-1)", fontSize: "var(--text-sm)" }}>
            Ecco il riepilogo di oggi.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setLessonModal({})}
          disabled={students.length === 0}
          title={students.length === 0 ? "Aggiungi prima uno studente" : "Aggiungi lezione"}
        >
          <Plus size={16} /> Aggiungi lezione
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "var(--space-4)" }}>
        <StatCard
          label="Guadagno settimana"
          value={formatEuro(weekly.total)}
          sub={`Incassato: ${formatEuro(weekly.incassato)}`}
          color="var(--color-primary)"
          icon={TrendingUp}
        />
        <StatCard
          label="Guadagno mese"
          value={formatEuro(monthly.total)}
          sub={`Incassato: ${formatEuro(monthly.incassato)}`}
          color="var(--color-secondary)"
          icon={TrendingUp}
        />
        <StatCard
          label="Ore questo mese"
          value={formatDuration(monthly.oreTotal)}
          sub={`${monthly.oreTotal > 0 ? (monthly.total / monthly.oreTotal).toFixed(0) : 0}€/h medio`}
          color="var(--color-warning)"
          icon={Clock}
        />
        <StatCard
          label="Lezioni non pagate"
          value={unpaidCount}
          sub={`Da incassare: ${formatEuro(monthly.daIncassare)}`}
          color="var(--color-error)"
          icon={AlertCircle}
        />
      </div>

      {/* ── Lezioni recenti ── */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "var(--space-4) var(--space-6)",
          borderBottom: "1px solid var(--color-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h3 style={{ fontWeight: 700, fontSize: "var(--text-base)" }}>Ultime lezioni</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/calendario")}>
            Vedi calendario →
          </button>
        </div>

        {recentLessons.length === 0 ? (
          <div style={{
            padding: "var(--space-12)", textAlign: "center",
            color: "var(--color-text-muted)",
          }}>
            <BookOpen size={32} style={{ margin: "0 auto var(--space-3)", opacity: 0.4 }} />
            <p style={{ fontWeight: 600 }}>Nessuna lezione ancora</p>
            <p style={{ fontSize: "var(--text-sm)", marginTop: "var(--space-1)" }}>
              Vai al calendario per aggiungere la prima!
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--color-surface-offset)" }}>
                {["Studente", "Data", "Durata", "Importo", "Pagato"].map((h) => (
                  <th key={h} style={{
                    padding: "var(--space-2) var(--space-4)",
                    textAlign: "left", fontSize: "var(--text-xs)",
                    fontWeight: 600, color: "var(--color-text-muted)",
                    textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentLessons.map((lesson, i) => (
                <tr
                  key={lesson.id ?? i}
                  style={{
                    borderTop: "1px solid var(--color-divider)",
                    cursor: "pointer",
                    transition: "background var(--transition)",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-surface-offset)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  onClick={() => navigate(`/studenti/${lesson.studentId}`)}
                >
                  <td style={{ padding: "var(--space-3) var(--space-4)", fontWeight: 600, fontSize: "var(--text-sm)" }}>
                    {lesson.studentName}
                  </td>
                  <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                    {formatDate(lesson.date)}
                  </td>
                  <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                    {formatDuration(lesson.duration)}
                  </td>
                  <td style={{ padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
                    {formatEuro(lesson.duration * lesson.rate)}
                  </td>
                  <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                    {lesson.paid
                      ? <span className="badge badge-paid"><CheckCircle size={11} style={{ marginRight: 3 }} />Pagato</span>
                      : <span className="badge badge-unpaid"><AlertCircle size={11} style={{ marginRight: 3 }} />Non pagato</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Studenti rapidi ── */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "var(--space-4) var(--space-6)",
          borderBottom: "1px solid var(--color-border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h3 style={{ fontWeight: 700, fontSize: "var(--text-base)" }}>I tuoi studenti</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/studenti")}>
            Gestisci →
          </button>
        </div>
        {students.length === 0 ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--color-text-muted)" }}>
            <p style={{ fontWeight: 600 }}>Nessuno studente ancora</p>
          </div>
        ) : (
          <div style={{ padding: "var(--space-4) var(--space-6)", display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
            {students.map((s) => (
              <button
                key={s.id}
                className="badge badge-pink"
                style={{ cursor: "pointer", fontSize: "var(--text-sm)", padding: "var(--space-1) var(--space-3)" }}
                onClick={() => navigate(`/studenti/${s.id}`)}
              >
                {s.nome} {s.cognome}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Modale nuova lezione ── */}
      {lessonModal !== null && (
        <LessonModal
          onClose={() => setLessonModal(null)}
          onSave={handleSaveLesson}
          initial={null}
        />
      )}

    </div>
  );
}