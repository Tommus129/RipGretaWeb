import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import {
  formatEuro, formatDate, totaleValutazione, chiavePersona, vocePagata, incassoValutazione, chiaveVoce,
} from "../utils/helpers";
import {
  Plus, Search, ClipboardList, Trash2, CheckCircle, AlertCircle, FileDown, Pencil, FileText, Wallet, ChevronDown,
} from "lucide-react";
import EvaluationModal from "../components/EvaluationModal";
import PagamentoModal from "../components/PagamentoModal";

const FILTRI = [
  { id: "tutte", label: "Tutte" },
  { id: "daPagare", label: "Da pagare" },
  { id: "pagate", label: "Pagate" },
];

export default function Valutazioni() {
  const {
    evaluations, addEvaluation, updateEvaluation, deleteEvaluation, toggleEvaluationPaid,
    creditoGenerale,
  } = useApp();

  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("tutte");
  const [modal, setModal] = useState(null); // null | "add" | scheda
  const [parzialeAperto, setParzialeAperto] = useState(false); // pannello selezione parziale
  const [pagamento, setPagamento] = useState(false);
  const [exporting, setExporting] = useState(null); // id scheda in esportazione
  const [selected, setSelected] = useState(() => new Set()); // chiavi dei test scelti per il report PDF
  const [exportingReport, setExportingReport] = useState(false);

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
    const incassato = filtered.reduce((s, e) => s + incassoValutazione(e), 0);
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

  // Selezione per il report PDF: si sceglie la persona intera, internamente
  // tenuta come insieme di chiavi dei suoi test (id scheda + posizione). I preset agiscono su tutti i
  // test, non solo su quelli visibili nella lista.
  // Seleziona o toglie in blocco tutti i test di una persona
  function togglePersona(chiaviPersona) {
    setSelected((prev) => {
      const next = new Set(prev);
      const tutti = chiaviPersona.every((k) => next.has(k));
      chiaviPersona.forEach((k) => (tutti ? next.delete(k) : next.add(k)));
      return next;
    });
  }

  // Chiavi di tutti i test, di quelli da pagare e di quelli già pagati
  const chiavi = useMemo(() => {
    const tutte = [];
    const daPagare = [];
    const pagate = [];
    evaluations.forEach((e) => (e.voci ?? []).forEach((v, i) => {
      const k = chiaveVoce(e.id, i);
      tutte.push(k);
      (vocePagata(e, v) ? pagate : daPagare).push(k);
    }));
    return { tutte, daPagare, pagate };
  }, [evaluations]);

  function selezionaPreset(preset) {
    if (preset === "nessuna") { setSelected(new Set()); return; }
    if (preset === "tutte") setSelected(new Set(chiavi.tutte));
    if (preset === "daPagare") setSelected(new Set(chiavi.daPagare));
    if (preset === "pagate") setSelected(new Set(chiavi.pagate));
  }

  // Persone con le loro schede, per la lista nel banner Parziale
  const persone = useMemo(() => {
    const m = new Map();
    evaluations.forEach((e) => {
      const key = chiavePersona(e.nome, e.cognome);
      if (!m.has(key)) m.set(key, { key, label: `${e.nome} ${e.cognome}`, evals: [] });
      m.get(key).evals.push(e);
    });
    return [...m.values()].sort((a, b) => a.label.localeCompare(b.label, "it"));
  }, [evaluations]);

  // Schede ridotte ai soli test selezionati, pronte per il PDF
  const selectedEvaluations = useMemo(() => {
    const out = [];
    evaluations.forEach((e) => {
      const voci = (e.voci ?? []).filter((_, i) => selected.has(chiaveVoce(e.id, i)));
      if (voci.length === 0) return;
      out.push({ ...e, voci, paid: voci.every((v) => vocePagata(e, v)) });
    });
    return out;
  }, [evaluations, selected]);

  // Se la selezione coincide con un preset lo segnala, altrimenti è personalizzata
  const presetAttivo = useMemo(() => {
    const n = selected.size;
    const uguale = (lista) => lista.length === n && lista.every((k) => selected.has(k));
    if (n === 0) return "nessuna";
    if (uguale(chiavi.tutte)) return "tutte";
    if (uguale(chiavi.daPagare)) return "daPagare";
    if (uguale(chiavi.pagate)) return "pagate";
    return "personalizzata";
  }, [selected, chiavi]);

  const ETICHETTE_PRESET = {
    tutte: "Tutte le valutazioni",
    daPagare: "Valutazioni da pagare",
    pagate: "Valutazioni pagate",
    personalizzata: "Selezione personalizzata",
    nessuna: "",
  };
  const etichettaReport = ETICHETTE_PRESET[presetAttivo];

  // Export PDF del report riepilogativo delle valutazioni selezionate a
  // mano: mostra solo il totale per riga, mai il dettaglio delle voci/prezzi.
  async function handleExportReport() {
    if (selectedEvaluations.length === 0) return;
    setExportingReport(true);
    try {
      const [{ pdf }, { default: EvaluationsSummaryPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("../components/EvaluationsSummaryPDF"),
      ]);
      const blob = await pdf(
        <EvaluationsSummaryPDF valutazioni={selectedEvaluations} etichettaFiltro={etichettaReport} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "report_valutazioni.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Errore nella generazione del report PDF. Riprova.");
    } finally {
      setExportingReport(false);
    }
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
        <button className="btn btn-secondary" onClick={() => setPagamento(true)}>
          <Wallet size={16} /> Registra pagamento
        </button>
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
            aria-pressed={filtro === f.id}
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

      {/* Selezione per il report PDF: preset che agiscono su tutte le
          valutazioni (indipendentemente da ricerca/filtro di vista sopra),
          più le checkbox sulle righe per rifinire a mano e comporre un
          report ibrido. */}
      {evaluations.length > 0 && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", padding: "var(--space-3) var(--space-4)" }}>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Report:
            </span>
            {[
              { id: "tutte", label: "Tutte" },
              { id: "daPagare", label: "Da pagare" },
              { id: "pagate", label: "Pagate" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={presetAttivo === p.id}
                onClick={() => selezionaPreset(p.id)}
                style={{
                  padding: "var(--space-1) var(--space-4)",
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--text-xs)", fontWeight: 700,
                  border: "1.5px solid",
                  transition: "all var(--transition)",
                  borderColor: presetAttivo === p.id ? "var(--color-primary)" : "var(--color-border)",
                  background: presetAttivo === p.id ? "var(--color-primary)" : "transparent",
                  color: presetAttivo === p.id ? "#fff" : "var(--color-text-muted)",
                }}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={parzialeAperto || presetAttivo === "personalizzata"}
              aria-expanded={parzialeAperto}
              onClick={() => setParzialeAperto((v) => !v)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "var(--space-1) var(--space-4)",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--text-xs)", fontWeight: 700,
                border: "1.5px solid",
                transition: "all var(--transition)",
                borderColor: presetAttivo === "personalizzata" || parzialeAperto ? "var(--color-primary)" : "var(--color-border)",
                background: presetAttivo === "personalizzata" ? "var(--color-primary)" : "transparent",
                color: presetAttivo === "personalizzata" ? "#fff" : parzialeAperto ? "var(--color-primary)" : "var(--color-text-muted)",
              }}
            >
              Parziale{presetAttivo === "personalizzata" ? ` · ${selected.size} test` : ""}
              <ChevronDown size={13} aria-hidden="true" style={{ transform: parzialeAperto ? "rotate(180deg)" : "none", transition: "transform var(--transition)" }} />
            </button>
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => selezionaPreset("nessuna")}
                className="btn btn-ghost btn-sm"
                style={{ marginLeft: "auto" }}
              >
                Deseleziona tutto
              </button>
            )}
          </div>

          {/* Banner selezione parziale: una casella per persona, con tutti i suoi test */}
          {parzialeAperto && (
            <div style={{
              border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)",
              maxHeight: 380, overflowY: "auto", background: "var(--color-surface)",
            }}>
              {persone.map((p, pi) => {
                const chiaviPersona = p.evals.flatMap((ev) => (ev.voci ?? []).map((_, i) => chiaveVoce(ev.id, i)));
                const sel = chiaviPersona.filter((k) => selected.has(k)).length;
                const tutti = chiaviPersona.length > 0 && sel === chiaviPersona.length;
                return (
                  <label
                    key={p.key}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: "var(--space-3)", cursor: "pointer",
                      padding: "var(--space-3)",
                      borderTop: pi === 0 ? "none" : "1px solid var(--color-divider)",
                      background: tutti ? "var(--color-primary-pale)" : "transparent",
                    }}
                  >
                    <input
                      type="checkbox" checked={tutti} onChange={() => togglePersona(chiaviPersona)}
                      style={{ width: 18, height: 18, accentColor: "var(--color-primary)", flexShrink: 0, marginTop: 2 }}
                    />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: "var(--text-sm)" }}>{p.label}</strong>
                      <span style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1) var(--space-2)", marginTop: 4 }}>
                        {p.evals.flatMap((ev) => (ev.voci ?? []).map((v, i) => (
                          <span
                            key={chiaveVoce(ev.id, i)}
                            className="badge"
                            style={vocePagata(ev, v)
                              ? { background: "var(--color-success-light)", color: "var(--color-success)", fontWeight: 600 }
                              : { background: "var(--color-surface-offset)", color: "var(--color-text-muted)", fontWeight: 600 }}
                          >
                            {v.nome}{vocePagata(ev, v) ? " ✓" : ""}
                          </span>
                        )))}
                      </span>
                    </span>
                    <strong style={{ fontSize: "var(--text-sm)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                      {formatEuro(p.evals.reduce((t, ev) => t + totaleValutazione(ev), 0))}
                    </strong>
                  </label>
                );
              })}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-3)" }}>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
              {selected.size === 0
                ? "Nessuna persona selezionata: apri Parziale per sceglierle, oppure scegli un preset."
                : `${selected.size} ${selected.size === 1 ? "test selezionato" : "test selezionati"}${presetAttivo === "personalizzata" ? " · selezione personalizzata" : ""}`}
            </span>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleExportReport}
              disabled={selected.size === 0 || exportingReport}
            >
              <FileText size={14} /> {exportingReport ? "Genero..." : "Report PDF selezionate"}
            </button>
          </div>
        </div>
      )}

      {/* Credito residuo */}
      {creditoGenerale > 0 && (
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3) var(--space-4)" }}>
          <Wallet size={16} aria-hidden="true" style={{ color: "var(--color-success)", flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            Credito disponibile: <strong style={{ color: "var(--color-success)", fontVariantNumeric: "tabular-nums" }}>{formatEuro(creditoGenerale)}</strong>
            {" "}· verrà usato sulle prossime valutazioni
          </span>
        </div>
      )}

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
              <div style={{ fontSize: "var(--text-lg)", fontWeight: 700, color, marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
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
                    <div style={{ fontWeight: 800, fontSize: "var(--text-lg)", color: "var(--color-primary)", fontVariantNumeric: "tabular-nums" }}>
                      {formatEuro(totale)}
                    </div>
                    <button
                      onClick={() => toggleEvaluationPaid(e)}
                      className={`badge ${e.paid ? "badge-paid" : "badge-unpaid"}`}
                      style={{ cursor: "pointer", marginTop: 2 }}
                      title="Segna tutti i test come pagati o da pagare"
                    >
                      {e.paid
                        ? <><CheckCircle size={11} style={{ marginRight: 3 }} />Pagata</>
                        : incassoValutazione(e) > 0
                          ? <><AlertCircle size={11} style={{ marginRight: 3 }} />Parziale</>
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
                        style={vocePagata(e, v)
                          ? { background: "var(--color-success-light)", color: "var(--color-success)", fontWeight: 600 }
                          : { background: "var(--color-surface-offset)", color: "var(--color-text-muted)", fontWeight: 600 }}
                      >
                        {v.nome} · {formatEuro(v.prezzo)}{vocePagata(e, v) ? " ✓" : ""}
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

      {pagamento && (
        <PagamentoModal onClose={() => setPagamento(null)} />
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
