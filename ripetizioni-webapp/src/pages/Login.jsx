import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Email o password errati. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--color-bg)",
      padding: "var(--space-4)",
    }}>
      <div style={{
        width: "100%", maxWidth: 400,
        background: "var(--color-surface)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-lg)",
        padding: "var(--space-8)",
      }}>

        {/* Logo / Titolo */}
        <div style={{ textAlign: "center", marginBottom: "var(--space-8)" }}>
          <div style={{
            width: 56, height: 56, borderRadius: "var(--radius-xl)",
            background: "var(--color-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto var(--space-4)",
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 style={{ fontWeight: 700, fontSize: "var(--text-xl)", marginBottom: "var(--space-1)" }}>
            Ripetizioni
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
            Accedi per continuare
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

          <div className="form-group">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="nome@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={{
              background: "var(--color-error-highlight)",
              color: "var(--color-error)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-3) var(--space-4)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: "var(--space-2)" }}
            disabled={loading}
          >
            {loading ? "Accesso in corso..." : "Accedi"}
          </button>

        </form>
      </div>
    </div>
  );
}