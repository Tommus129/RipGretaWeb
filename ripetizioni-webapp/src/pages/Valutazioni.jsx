import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { formatEuro, formatDate, totaleValutazione } from "../utils/helpers";
import {
  Plus, Search, ClipboardList, Trash2, CheckCircle, AlertCircle, FileDown, Pencil,
} from "lucide-react";
import EvaluationModal from "../components/EvaluationModal";

const FILTRI = [
  { id: "tutte", label: "Tutte" },
  { id: "daPagare", label: "Da pagare" },
  { id: "pagate", label: "Pagate" },
];

export default function Valutazioni() {
  const {
    evaluations, addEvaluation, updateEvaluation, deleteEvaluation, toggleEvaluationPaid,
  } = useApp();

  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("tutte");
  const [modal, setModal] = useState(null); // null | "add" | scheda
  const [exporting, setExporting] = useState(null); // id scheda in esportazione

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return evaluations.filter((e) => {
      if (filtro === "pagate" && !e.paid) return false;
      if (filtro === "daPagare" && e.paid) return false;
      if (!q) return true;
      return `${e.nome} ${e.cognome}`.toLowerCase().includes(q);
    });
  }, [evaluations, search, filtro]);

  // Totali della lista attualmente visibile
  const totali = useMemo(() => {
    const total = filtered.reduce((s, e) => s + totaleValutazione(e), 0);
    const incassato = filtered.filter((e) => e.paid).reduce((s, e) => s + totaleValutazione(e), 0);
    return { total, incassato, daIncassare: total - incassato };
  }, [filtered]);

  async function handleSave(data) {
    if (modal === "add") await addEvaluation(data);
    else await updateEvaluation(data);
    setModal(null);
  }

  async function handleDelete(e) {
    if (!confirm(`Elimina la valutazione di ${e.nome} ${e.cognome}?`)) return;
    await deleteEvaluation(e.id);
  }

  // Export PDF della singola scheda. Libreria e template in lazy import,
  // come per il report studente, per non appesantire il bundle.
  async function handleExport(valutazione) {
    setExporting(valutazione.id);
    try {
      const [{ pdf }, { default: EvaluationPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("../components/EvaluationPDF"),
      ]);
      const blob = await pdf(<EvaluationPDF valutazione={valutazione} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `valutazione_${valutazione.cognome}_${valutazione.nome}`
        .toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") + ".pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Errore nella generazione del PDF. Riprova.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>

      {/* Header: ricerca + nuova scheda */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-faint)" }} />
          <input
            className="input"
            style={{ paddingLeft: "var(--space-8)" }}
            placeholder="Cerca per nome o cognome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={() => setModal("add")}>
          <Plus size={16} /> Nuova valutazione
        </button>
      </div>

      {/* Filtri stato */}
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        {FILTRI.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFiltro(f.id)}
            style={{
              padding: "var(--space-1) var(--space-4)",
              borderRadius: "var(--radius-full)",
              fontSize: "var(--text-xs)", fontWeight: 700,
              border: "1.5px solid",
              transition: "all var(--transition)",
              borderColor: filtro === f.id ? "var(--color-primary)" : "var(--color-border)",
              background: filtro === f.id ? "var(--color-primary)" : "transparent",
              color: filtro === f.id ? "#fff" : "var(--color-text-muted)",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Riepilogo della selezione corrente */}
      {filtered.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "var(--space-3)" }}>
          {[
            { label: "Totale", value: totali.total, color: "var(--color-primary)" },
            { label: "Incassato", value: totali.incassato, color: "var(--color-success)" },
            { label: "Da incassare", value: totali.daIncassare, color: "var(--color-error)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="card" style={{ padding: "var(--space-3) var(--space-4)" }}>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {label}
              </div>
              <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, color, marginTop: 2 }}>
                {formatEuro(value)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lista schede */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-12)", color: "var(--color-text-muted)" }}>
          <ClipboardList size={36} style={{ margin: "0 auto var(--space-3)", opacity: 0.3 }} />
          <p style={{ fontWeight: 600 }}>Nessuna valutazione trovata</p>
          <p style={{ fontSize: "var(--text-sm)", marginTop: "var(--space-1)" }}>
            {search || filtro !== "tutte"
              ? "Prova a cambiare ricerca o filtro"
              : "Crea la tua prima scheda di valutazione!"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {filtered.map((e) => {
            const totale = totaleValutazione(e);
            return (
              <div key={e.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>

                {/* Riga principale */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-4)", flexWrap: "wrap" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "var(--radius-full)",
                    background: "var(--color-secondary-light)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, fontWeight: 700, color: "var(--color-secondary)",
                    fontSize: "var(--text-base)",
                  }}>
                    {e.nome?.[0]}{e.cognome?.[0]}
                  </div>

                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontWeight: 700, fontSize: "var(--text-base)" }}>
                      {e.nome} {e.cognome}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 2 }}>
                      {formatDate(e.date)} · {(e.voci ?? []).length} {(e.voci ?? []).length === 1 ? "voce" : "voci"}
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: "var(--text-lg)", color: "var(--color-primary)" }}>
                      {formatEuro(totale)}
                    </div>
                    <button
                      onClick={() => toggleEvaluationPaid(e)}
                      className={`badge ${e.paid ? "badge-paid" : "badge-unpaid"}`}
                      style={{ cursor: "pointer", marginTop: 2 }}
                      title="Cambia stato pagamento"
                    >
                      {e.paid
                        ? <><CheckCircle size={11} style={{ marginRight: 3 }} />Pagata</>
                        : <><AlertCircle size={11} style={{ marginRight: 3 }} />Non pagata</>}
                    </button>
                  </div>
                </div>

                {/* Voci flaggate */}
                {(e.voci ?? []).length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                    {e.voci.map((v, i) => (
                      <span
                        key={`${v.typeId}-${i}`}
                        className="badge"
                        style={{ background: "var(--color-surface-offset)", color: "var(--color-text-muted)", fontWeight: 600 }}
                      >
                        {v.nome} · {formatEuro(v.prezzo)}
                      </span>
                    ))}
                  </div>
                )}

                {e.note && (
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                    {e.note}
                  </div>
                )}

                {/* Azioni */}
                <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-end", borderTop: "1px solid var(--color-divider)", paddingTop: "var(--space-3)" }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleExport(e)}
                    disabled={exporting === e.id}
                  >
                    <FileDown size={14} /> {exporting === e.id ? "Genero..." : "PDF"}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setModal(e)}>
                    <Pencil size={14} /> Modifica
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e)}>
                    <Trash2 size={14} /> Elimina
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale */}
      {modal && (
        <EvaluationModal
          onClose={() => setModal(null)}
          onSave={handleSave}
          initial={modal === "add" ? null : modal}
        />
      )}
    </div>
  );
}
