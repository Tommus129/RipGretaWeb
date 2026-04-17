import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Calendar, Users, BarChart2, Menu, GraduationCap, LogOut
} from "lucide-react";
import { useApp } from "../context/AppContext";

const navItems = [
  { to: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { to: "/calendario", label: "Calendario", icon: Calendar },
  { to: "/studenti",   label: "Studenti",   icon: Users },
  { to: "/report",     label: "Report",     icon: BarChart2 },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useApp();

  const pageTitle = navItems.find((n) => location.pathname.startsWith(n.to))?.label ?? "Greta e le Ripetizioni";

  return (
    <div className="app-shell">

      {/* ── Overlay mobile ── */}
      {sidebarOpen && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 49,
            background: "rgba(45,31,34,0.3)",
            backdropFilter: "blur(2px)",
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>

        {/* Logo */}
        <div style={{
          padding: "var(--space-6) var(--space-5)",
          borderBottom: "1px solid var(--color-border)",
          display: "flex", alignItems: "center", gap: "var(--space-3)",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "var(--radius-md)",
            background: "var(--color-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <GraduationCap size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "var(--text-sm)", lineHeight: 1.2 }}>
              Greta e le
            </div>
            <div style={{
              fontWeight: 700, fontSize: "var(--text-sm)", lineHeight: 1.2,
              color: "var(--color-primary)",
            }}>
              Ripetizioni
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "var(--space-4) var(--space-3)" }}>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: "var(--space-3)",
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-md)",
                marginBottom: "var(--space-1)",
                fontWeight: 600, fontSize: "var(--text-sm)",
                color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
                background: isActive ? "var(--color-primary-light)" : "transparent",
                transition: "all var(--transition)",
              })}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer sidebar — utente + logout */}
        <div style={{
          padding: "var(--space-4) var(--space-5)",
          borderTop: "1px solid var(--color-border)",
          display: "flex", flexDirection: "column", gap: "var(--space-3)",
        }}>
          {/* Email utente */}
          <div style={{
            display: "flex", alignItems: "center", gap: "var(--space-2)",
            fontSize: "var(--text-xs)", color: "var(--color-text-muted)",
            overflow: "hidden",
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: "var(--radius-full)",
              background: "var(--color-primary-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              fontWeight: 700, fontSize: 11, color: "var(--color-primary)",
            }}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <span style={{
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {user?.email}
            </span>
          </div>

          {/* Bottone logout */}
          <button
            onClick={logout}
            style={{
              display: "flex", alignItems: "center", gap: "var(--space-2)",
              padding: "var(--space-2) var(--space-3)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--text-xs)", fontWeight: 600,
              color: "var(--color-text-muted)",
              background: "transparent",
              border: "1px solid var(--color-border)",
              cursor: "pointer",
              transition: "all var(--transition)",
              width: "100%",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--color-error-highlight)";
              e.currentTarget.style.color = "var(--color-error)";
              e.currentTarget.style.borderColor = "var(--color-error)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--color-text-muted)";
              e.currentTarget.style.borderColor = "var(--color-border)";
            }}
          >
            <LogOut size={13} />
            Esci
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-content">
        {/* Header */}
        <header className="page-header">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <button
              className="btn btn-ghost btn-icon"
              style={{ display: "none" }}
              id="menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Apri menu"
            >
              <Menu size={20} />
            </button>
            <h1 style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>{pageTitle}</h1>
          </div>
        </header>

        {/* Pagina corrente */}
        <main className="page-body">
          <Outlet />
        </main>
      </div>

      {/* ── Bottom Nav (mobile) ── */}
      <nav className="bottom-nav">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}
          >
            <Icon size={22} />
            {label}
          </NavLink>
        ))}
      </nav>

    </div>
  );
}