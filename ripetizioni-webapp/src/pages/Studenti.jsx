import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { formatEuro } from "../utils/helpers";
import { Plus, Search, User, Trash2, ChevronRight, Coins } from "lucide-react";

function StudentModal({ onClose, onSave, initial }) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [cognome, setCognome] = useState(initial?.cognome ?? "");
  const [credito, setCredito] = useState(initial?.creditoResiduo ?? 0);

  function handleSubmit(e) {
    e.preventDefault();
    if (!nome.trim() || !cognome.trim()) return;
    onSave({ ...initial, nome: nome.trim(), cognome: cognome.trim(), creditoResiduo: parseFloat(credito) || 0 });
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-6)" }}>
          <h2 style={{ fontWeight: 700, fontSize: "var(--text-lg)" }}>
            {initial ? "Modifica studente" : "Nuovo studente"}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div className="form-group">
            <label className="label">Nome</label>
            <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Es. Mario" required />
          </div>
          <div className="form-group">
            <label className="label">Cognome</label>
            <input className="input" value={cognome} onChange={(e) => setCognome(e.target.value)} placeholder="Es. Rossi" required />
          </div>
          <div className="form-group">
            <label className="label">Credito residuo (€)</label>
            <input className="input" type="number" step="0.01" min="0" value={credito} onChange={(e) => setCredito(e.target.value)} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              Importo che lo studente ha già pagato in anticipo
            </span>
          </div>
          <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annulla</button>
            <button type="submit" className="btn btn-primary">
              {initial ? "Salva modifiche" : "Aggiungi studente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Studenti() {
  const { students, addStudent, updateStudent, deleteStudent, getStudentStats } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | "add" | { student }

  const filtered = students.filter((s) =>
    `${s.nome} ${s.cognome}`.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSave(data) {
    if (modal === "add") await addStudent(data);
    else await updateStudent(data);
    setModal(null);
  }

  async function handleDelete(s) {
    if (!confirm(`Elimina ${s.nome} ${s.cognome} e tutte le sue lezioni?`)) return;
    await deleteStudent(s);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-faint)" }} />
          <input
            className="input"
            style={{ paddingLeft: "var(--space-8)" }}
            placeholder="Cerca studente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => setModal("add")}>
          <Plus size={16} /> Nuovo studente
        </button>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-12)", color: "var(--color-text-muted)" }}>
          <User size={36} style={{ margin: "0 auto var(--space-3)", opacity: 0.3 }} />
          <p style={{ fontWeight: 600 }}>Nessuno studente trovato</p>
          <p style={{ fontSize: "var(--text-sm)", marginTop: "var(--space-1)" }}>
            {search ? "Prova con un altro nome" : "Aggiungi il tuo primo studente!"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {filtered.map((s) => {
            const stats = getStudentStats(s.id);
            return (
              <div
                key={s.id}
                className="card"
                style={{
                  display: "flex", alignItems: "center", gap: "var(--space-4)",
                  padding: "var(--space-4) var(--space-5)", cursor: "pointer",
                  transition: "box-shadow var(--transition), transform var(--transition)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.transform = "none"; }}
                onClick={() => navigate(`/studenti/${s.id}`)}
              >
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: "var(--radius-full)",
                  background: "var(--color-primary-light)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, fontWeight: 700, color: "var(--color-primary)",
                  fontSize: "var(--text-base)",
                }}>
                  {s.nome[0]}{s.cognome[0]}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "var(--text-base)" }}>{s.nome} {s.cognome}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 2, display: "flex", gap: "var(--space-3)" }}>
                    <span>Totale: <strong style={{ color: "var(--color-text)" }}>{formatEuro(stats.total)}</strong></span>
                    <span>Incassato: <strong style={{ color: "var(--color-success)" }}>{formatEuro(stats.incassato)}</strong></span>
                    <span>Da pagare: <strong style={{ color: "var(--color-error)" }}>{formatEuro(stats.daIncassare)}</strong></span>
                  </div>
                </div>

                {/* Credito badge */}
                {(s.creditoResiduo ?? 0) > 0 && (
                  <span className="badge" style={{ background: "var(--color-secondary-light)", color: "var(--color-secondary)", flexShrink: 0 }}>
                    <Coins size={11} style={{ marginRight: 3 }} />
                    Credito: {formatEuro(s.creditoResiduo)}
                  </span>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: "var(--space-1)", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => setModal(s)}
                    aria-label="Modifica"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn btn-danger btn-icon btn-sm"
                    onClick={() => handleDelete(s)}
                    aria-label="Elimina"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <ChevronRight size={16} style={{ color: "var(--color-text-faint)", flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <StudentModal
          onClose={() => setModal(null)}
          onSave={handleSave}
          initial={modal === "add" ? null : modal}
        />
      )}
    </div>
  );
}