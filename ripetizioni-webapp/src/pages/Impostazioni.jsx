import { useTheme } from "../context/ThemeContext";
import { THEMES } from "../theme/themes";
import { useApp } from "../context/AppContext";
import { LogOut } from "lucide-react";

export default function Impostazioni() {
  const { tema, dark, setTema, setDark } = useTheme();
  const { user, logout } = useApp();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-8)", maxWidth: 600 }}>

      {/* Intestazione */}
      <div>
        <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>Impostazioni</h2>
        <p style={{ color: "var(--color-text-muted)", marginTop: "var(--space-1)", fontSize: "var(--text-sm)" }}>
          Personalizza l'aspetto dell'app.
        </p>
      </div>

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
          <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>€25.00</span>
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
