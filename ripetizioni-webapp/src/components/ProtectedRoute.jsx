import { useApp } from "../context/AppContext";
import Login from "../pages/Login";

export default function ProtectedRoute({ children }) {
  const { user, authLoading } = useApp();

  if (authLoading) {
    return (
      <div style={{
        minHeight: "100dvh", display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "var(--color-bg)",
      }}>
        <div style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
          <div className="spinner" style={{
            width: 32, height: 32,
            border: "3px solid var(--color-border)",
            borderTopColor: "var(--color-primary)",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
            margin: "0 auto var(--space-4)",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: "var(--text-sm)" }}>Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return children;
}