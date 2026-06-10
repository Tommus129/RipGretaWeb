import { useMemo, useState } from "react";
import { FileDown } from "lucide-react";
import { buildClientReport, reportFileName } from "../utils/reportData";
import { getMonthName } from "../utils/helpers";

// Modal per esportare il report PDF di uno studente con filtri periodo/stato.
// La libreria @react-pdf/renderer e il template vengono caricati in lazy
// solo al momento della generazione, per non appesantire il bundle.
export default function ExportReportModal({ student, lessons, onClose }) {
  const [stato, setStato] = useState("tutte");
  const [periodo, setPeriodo] = useState("tutto"); // "tutto" | "anno" | "mese"
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Anni ricavati dalle lezioni dello studente (più l'anno corrente)
  const years = useMemo(() => {
    const set = new Set(
      lessons
        .filter((l) => l.studentId === student.id)
        .map((l) => {
          const d = l.date?.toDate ? l.date.toDate() : new Date(l.date);
          return d.getFullYear();
        })
    );
    set.add(new Date().getFullYear());
    return [...set].sort((a, b) => b - a);
  }, [lessons, student.id]);

  async function handleGenerate() {
    setError("");
    setGenerating(true);
    try {
      const opts = {
        stato,
        year: periodo === "tutto" ? null : year,
        month: periodo === "mese" ? month : null,
      };
      const report = buildClientReport(student, lessons, opts);

      // Lazy import: la libreria PDF entra nel bundle solo ora
      const [{ pdf }, { default: ClientReportPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./ClientReportPDF"),
      ]);

      const blob = await pdf(<ClientReportPDF report={report} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = reportFileName(report);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Errore nella generazione del PDF. Riprova.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-6)" }}>
          <h2 style={{ fontWeight: 700, fontSize: "var(--text-lg)" }}>Esporta report PDF</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            Report delle lezioni di <strong>{student.nome} {student.cognome}</strong>.
          </p>

          {/* Stato pagamento */}
          <div className="form-group">
            <label className="label">Stato pagamento</label>
            <select className="select" value={stato} onChange={(e) => setStato(e.target.value)}>
              <option value="tutte">Tutte le lezioni</option>
              <option value="daPagare">Solo da pagare</option>
              <option value="pagate">Solo pagate</option>
            </select>
          </div>

          {/* Periodo */}
          <div className="form-group">
            <label className="label">Periodo</label>
            <select className="select" value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
              <option value="tutto">Tutto lo storico</option>
              <option value="anno">Anno intero</option>
              <option value="mese">Mese specifico</option>
            </select>
          </div>

          {/* Selettori anno/mese */}
          {periodo !== "tutto" && (
            <div style={{ display: "flex", gap: "var(--space-3)" }}>
              {periodo === "mese" && (
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="label">Mese</label>
                  <select className="select" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i}>{getMonthName(i)}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group" style={{ flex: 1 }}>
                <label className="label">Anno</label>
                <select className="select" value={year} onChange={(e) => setYear(Number(e.target.value))}>
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          )}

          {error && (
            <div style={{
              background: "var(--color-error-highlight)", color: "var(--color-error)",
              borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)",
              fontSize: "var(--text-sm)", fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={generating}>
              Annulla
            </button>
            <button type="button" className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
              <FileDown size={15} />
              {generating ? "Generazione..." : "Genera PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
