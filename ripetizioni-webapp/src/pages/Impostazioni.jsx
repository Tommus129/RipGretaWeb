import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { THEMES } from "../theme/themes";
import { useApp } from "../context/AppContext";
import { formatEuro } from "../utils/helpers";
import { LogOut, Plus, Trash2, Check, X, Pencil } from "lucide-react";

// Gestione dei tipi di valutazione: nome + prezzo. Sono le voci che si
// possono flaggare quando si crea una scheda nella sezione Valutazioni.
function TipiValutazione() {
  const { evaluationTypes, addEvaluationType, updateEvaluationType, deleteEvaluationType } = useApp();

  const [nuovoNome, setNuovoNome] = useState("");
  const [nuovoPrezzo, setNuovoPrezzo] = useState("");
  const [editId, setEditId] = useState(null);
  const [editNome, setEditNome] = useState("");
  const [editPrezzo, setEditPrezzo] = useState("");
  // Tipo in attesa di conferma quando il prezzo e' cambiato: il salvataggio
  // vero avviene solo dopo la scelta nel modal (propaga si' / no).
  const [confermaPrezzo, setConfermaPrezzo] = useState(null);

  async function handleAdd(e) {
    e.preventDefault();
    if (!nuovoNome.trim()) return;
    await addEvaluationType({ nome: nuovoNome.trim(), prezzo: parseFloat(nuovoPrezzo) || 0 });
    setNuovoNome("");
    setNuovoPrezzo("");
  }

  function apriEdit(t) {
    setEditId(t.id);
    setEditNome(t.nome);
    setEditPrezzo(String(t.prezzo ?? 0));
  }

  async function salvaEdit() {
    if (!editNome.trim()) return;
    const nuovoPrezzo = parseFloat(editPrezzo) || 0;
    const tipoOriginale = evaluationTypes.find((t) => t.id === editId);
    const prezzoCambiato = tipoOriginale && Number(tipoOriginale.prezzo) !== nuovoPrezzo;

    // Se il prezzo e' cambiato, apro il modal di conferma e aspetto la
    // scelta: il salvataggio vero avviene in confermaPropagazione.
    if (prezzoCambiato) {
      setConfermaPrezzo({ id: editId, nome: editNome.trim(), prezzoPrecedente: tipoOriginale.prezzo, prezzo: nuovoPrezzo });
      return;
    }

    await updateEvaluationType({ id: editId, nome: editNome.trim(), prezzo: nuovoPrezzo }, false);
    setEditId(null);
  }

  async function confermaPropagazione(propaga) {
    const dati = confermaPrezzo;
    setConfermaPrezzo(null);
    await updateEvaluationType({ id: dati.id, nome: dati.nome, prezzo: dati.prezzo }, propaga);
    setEditId(null);
  }

  async function handleDelete(t) {
    if (!confirm(`Elimina il tipo "${t.nome}"?\n\nLe schede già create non cambiano.`)) return;
    await deleteEvaluationType(t.id);
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>Tipi di valutazione</div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
          Le voci che puoi flaggare in una scheda, con quanto ti vengono pagate
        </div>
      </div>

      {/* Elenco tipi esistenti */}
      {evaluationTypes.length === 0 ? (
        <div style={{
          padding: "var(--space-4)",
          border: "1.5px dashed var(--color-border)",
          borderRadius: "var(--radius-md)",
          textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--text-sm)",
        }}>
          Nessun tipo ancora. Aggiungine uno qui sotto.
        </div>
      ) : (
        <div style={{ border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          {evaluationTypes.map((t, i) => (
            <div
              key={t.id}
              style={{
                display: "flex", alignItems: "center", gap: "var(--space-2)",
                padding: "var(--space-2) var(--space-3)",
                borderTop: i === 0 ? "none" : "1px solid var(--color-divider)",
              }}
            >
              {editId === t.id ? (
                <>
                  <input
                    className="input" value={editNome}
                    onChange={(e) => setEditNome(e.target.value)}
                    style={{ flex: 1, minWidth: 0 }} aria-label="Nome tipo"
                  />
                  <input
                    className="input" type="number" step="0.5" min="0" value={editPrezzo}
                    onChange={(e) => setEditPrezzo(e.target.value)}
                    style={{ width: 80, textAlign: "right" }} aria-label="Prezzo"
                  />
                  <button className="btn btn-primary btn-icon btn-sm" onClick={salvaEdit} aria-label="Salva">
                    <Check size={14} />
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditId(null)} aria-label="Annulla">
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: "var(--text-sm)", minWidth: 0 }}>
                    {t.nome}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--color-primary)" }}>
                    {formatEuro(t.prezzo)}
                  </span>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => apriEdit(t)} aria-label="Modifica">
                    <Pencil size={14} />
                  </button>
                  <button className="btn btn-danger btn-icon btn-sm" onClick={() => handleDelete(t)} aria-label="Elimina">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Nuovo tipo */}
      <form onSubmit={handleAdd} style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
          <label className="label">Nome valutazione</label>
          <input
            className="input" value={nuovoNome}
            onChange={(e) => setNuovoNome(e.target.value)}
            placeholder="Es. Correzione tema"
          />
        </div>
        <div className="form-group" style={{ width: 110 }}>
          <label className="label">Prezzo €</label>
          <input
            className="input" type="number" step="0.5" min="0" value={nuovoPrezzo}
            onChange={(e) => setNuovoPrezzo(e.target.value)}
            placeholder="0"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={!nuovoNome.trim()}>
          <Plus size={16} /> Aggiungi
        </button>
      </form>

      {/* Conferma prezzo: chiusura senza scegliere = non salva nulla,
          la riga resta in modifica. */}
      {confermaPrezzo && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setConfermaPrezzo(null)}>
          <div className="modal" style={{ maxWidth: 420 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
              <h2 style={{ fontWeight: 700, fontSize: "var(--text-lg)" }}>Prezzo cambiato</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setConfermaPrezzo(null)} aria-label="Chiudi">✕</button>
            </div>

            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "var(--space-2)" }}>
              Hai cambiato il prezzo di <strong style={{ color: "var(--color-text)" }}>{confermaPrezzo.nome}</strong>: da{" "}
              {formatEuro(confermaPrezzo.prezzoPrecedente)} a {formatEuro(confermaPrezzo.prezzo)}.
            </p>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", marginBottom: "var(--space-5)" }}>
              Vuoi applicarlo anche alle schede valutazione già create con questa voce, o solo a quelle future?
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <button type="button" className="btn btn-primary" onClick={() => confermaPropagazione(true)}>
                Aggiorna anche le schede già create
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => confermaPropagazione(false)}>
                Solo da ora in poi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Impostazioni() {
  const { tema, dark, setTema, setDark } = useTheme();
  const { user, logout } = useApp();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)", maxWidth: 600 }}>

      {/* Intestazione */}
      <div>
        <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>Impostazioni</h2>
        <p style={{ color: "var(--color-text-muted)", marginTop: "var(--space-1)", fontSize: "var(--text-sm)" }}>
          Configura le valutazioni e personalizza l'aspetto dell'app.
        </p>
      </div>

      {/* Tipi di valutazione */}
      <TipiValutazione />

      {/* Tema colore */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>Tema colore</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            Scegli la palette dell'app
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: "var(--space-3)" }}>
          {THEMES.map((t) => {
            const selected = t.id === tema;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTema(t.id)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)",
                  padding: "var(--space-3)",
                  borderRadius: "var(--radius-md)",
                  border: `2px solid ${selected ? "var(--color-primary)" : "var(--color-border)"}`,
                  background: selected ? "var(--color-primary-pale)" : "var(--color-surface-2)",
                  cursor: "pointer",
                  transition: "all var(--transition)",
                }}
              >
                <span
                  style={{
                    width: 28, height: 28, borderRadius: "var(--radius-full)",
                    background: t.vars["--color-primary"],
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14,
                  }}
                >
                  {t.emoji}
                </span>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: selected ? 700 : 600, color: selected ? "var(--color-primary)" : "var(--color-text-muted)" }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modalità scura */}
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>Modalità scura</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            Interfaccia con sfondo scuro
          </div>
        </div>
        <button
          onClick={() => setDark(!dark)}
          aria-label="Toggle dark mode"
          style={{
            width: 48, height: 28, borderRadius: "var(--radius-full)",
            background: dark ? "var(--color-primary)" : "var(--color-border)",
            position: "relative", transition: "background var(--transition)", flexShrink: 0,
          }}
        >
          <div style={{
            width: 22, height: 22, borderRadius: "var(--radius-full)",
            background: "#fff", position: "absolute", top: 3, left: dark ? 23 : 3,
            transition: "left var(--transition)", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          }} />
        </button>
      </div>

      {/* Anteprima */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>Anteprima</div>
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn btn-primary">Pulsante primario</button>
          <button className="btn btn-secondary">Secondario</button>
          <button className="btn btn-ghost">Ghost</button>
          <span className="badge badge-paid">Pagata</span>
          <span className="badge badge-unpaid">Non pagata</span>
          <span className="badge badge-pink">Studente</span>
        </div>
        <div style={{
          padding: "var(--space-3) var(--space-4)",
          background: "var(--color-primary-pale)",
          border: "1px solid var(--color-primary-light)",
          borderRadius: "var(--radius-md)",
          display: "flex", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>Totale lezione</span>
          <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>{formatEuro(25)}</span>
        </div>
      </div>

      {/* Account / logout */}
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)" }}>
        <div style={{ overflow: "hidden" }}>
          <div style={{ fontWeight: 700, fontSize: "var(--text-sm)" }}>Account</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user?.email}
          </div>
        </div>
        <button className="btn btn-danger" onClick={logout} style={{ flexShrink: 0 }}>
          <LogOut size={14} /> Esci
        </button>
      </div>

    </div>
  );
}
