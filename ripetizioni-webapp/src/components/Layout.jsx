import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, ClipboardList, BarChart2, Settings, Menu, GraduationCap, LogOut
} from "lucide-react";
import { useApp } from "../context/AppContext";

const navItems = [
  { to: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { to: "/studenti",     label: "Studenti",     icon: Users },
  { to: "/valutazioni",  label: "Valutazioni",  icon: ClipboardList },
  { to: "/report",       label: "Report",       icon: BarChart2 },
  { to: "/impostazioni", label: "Impostazioni", icon: Settings },
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
            background: "rgba(20,10,15,0.4)",
            backdropFilter: "blur(2px)",
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>

        {/* Logo */}
        <div style={{
          padding: "var(--space-5) var(--space-5)",
          borderBottom: "1.5px solid var(--color-border)",
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
          <div className="logo-text">
            <div style={{ fontWeight: 700, fontSize: "var(--text-sm)", lineHeight: 1.2 }}>
              Greta e le
            </div>
            <div style={{ fontWeight: 700, fontSize: "var(--text-sm)", lineHeight: 1.2, color: "var(--color-primary)" }}>
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
              data-label={label}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: "var(--space-3)",
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-md)",
                marginBottom: "var(--space-1)",
                fontWeight: 700, fontSize: "var(--text-sm)",
                color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
                background: isActive ? "var(--color-primary-light)" : "transparent",
                transition: "all var(--transition)",
              })}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer sidebar — utente + logout */}
        <div style={{
          padding: "var(--space-4) var(--space-5)",
          borderTop: "1.5px solid var(--color-border)",
          display: "flex", flexDirection: "column", gap: "var(--space-3)",
        }} className="sidebar-footer-inner">
          <div className="sidebar-footer-email" style={{
            display: "flex", alignItems: "center", gap: "var(--space-2)",
            fontSize: "var(--text-xs)", color: "var(--color-text-muted)", overflow: "hidden",
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: "var(--radius-full)",
              background: "var(--color-primary-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, fontWeight: 700, fontSize: 11, color: "var(--color-primary)",
            }}>
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email}
            </span>
          </div>
          <button
            onClick={logout}
            className="btn btn-ghost btn-sm"
            style={{ justifyContent: "center", width: "100%" }}
          >
            <LogOut size={13} /> <span className="nav-label">Esci</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-content">
        <header className="page-header">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <button
              className="btn btn-ghost btn-icon hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Apri menu"
            >
              <Menu size={20} />
            </button>
            <h1 style={{ fontSize: "var(--text-lg)", fontWeight: 700 }}>{pageTitle}</h1>
          </div>
        </header>

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
