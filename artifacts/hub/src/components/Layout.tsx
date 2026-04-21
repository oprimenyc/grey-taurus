import { type ReactNode, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Kanban, Search, FileText, Mail,
  Bot, Settings, TrendingUp, Building2, Globe,
  LogOut, ChevronRight, X,
} from "lucide-react";
import { api } from "../lib/api.ts";
import { useToasts } from "./toast.ts";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/opportunities", label: "Opportunities", icon: Search },
  { to: "/proposals", label: "Proposals", icon: FileText },
  { to: "/outreach", label: "Outreach", icon: Mail },
  { to: "/grants", label: "Grants", icon: TrendingUp },
  { to: "/subcontracts", label: "Subcontracts", icon: Building2 },
  { to: "/reddit-intel", label: "Reddit Intel", icon: Globe },
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/settings", label: "Settings", icon: Settings },
];

const MOBILE_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/opportunities", label: "Opportunities", icon: Search },
  { to: "/outreach", label: "Outreach", icon: Mail },
  { to: "/agents", label: "Agents", icon: Bot },
];

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  pipeline: "Pipeline",
  opportunities: "Opportunities",
  proposals: "Proposals",
  outreach: "Outreach",
  grants: "Grants",
  subcontracts: "Subcontracts",
  "reddit-intel": "Reddit Intel",
  agents: "Agents",
  settings: "Settings",
};

const TOAST_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  success: { bg: "#0f2d1a", border: "#22c55e44", icon: "#22c55e" },
  error: { bg: "#2d0f0f", border: "#ef444444", icon: "#ef4444" },
  info: { bg: "#0f1d2d", border: "#3b82f644", icon: "#3b82f6" },
};

function ToastContainer() {
  const toasts = useToasts();
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
      {toasts.map((t) => {
        const colors = TOAST_COLORS[t.type];
        return (
          <div
            key={t.id}
            className="gt-toast"
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: "10px 16px",
              color: "#e8eaf0",
              fontSize: 13,
              fontWeight: 500,
              maxWidth: 340,
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: colors.icon, flexShrink: 0 }} />
            {t.message}
          </div>
        );
      })}
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchVal, setSearchVal] = useState("");

  const segments = location.pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: BREADCRUMB_LABELS[seg] ?? seg,
    path: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  async function handleLogout() {
    await api.auth.logout();
    navigate("/login");
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchVal.trim()) return;
    navigate(`/opportunities?q=${encodeURIComponent(searchVal.trim())}`);
    setSearchVal("");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--gt-bg)" }}>
      {/* Sidebar */}
      <aside style={{
        width: 224,
        background: "var(--gt-surface)",
        borderRight: "1px solid var(--gt-border)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 100,
      }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--gt-border)" }}>
          <div style={{ color: "var(--gt-gold)", fontWeight: 700, fontSize: 15, letterSpacing: "0.08em" }}>GREY TAURUS</div>
          <div style={{ color: "var(--gt-muted)", fontSize: 11, marginTop: 2 }}>Autonomous Contracting</div>
        </div>

        <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 20px",
                color: isActive ? "var(--gt-gold)" : "var(--gt-muted)",
                background: isActive ? "var(--gt-gold-dim)" : "transparent",
                borderLeft: isActive ? "2px solid var(--gt-gold)" : "2px solid transparent",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                transition: "all 0.15s var(--gt-ease)",
                textDecoration: "none",
              })}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--gt-border)" }}>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "8px 10px",
              background: "transparent",
              border: "1px solid var(--gt-border)",
              color: "var(--gt-muted)",
              borderRadius: 6,
              fontSize: 12,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div style={{ marginLeft: 224, flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top header */}
        <header style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "var(--gt-surface)",
          borderBottom: "1px solid var(--gt-border)",
          padding: "0 32px",
          height: 52,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}>
          {/* Breadcrumbs */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.path} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {i > 0 && <ChevronRight size={12} color="var(--gt-muted)" />}
                {crumb.isLast ? (
                  <span style={{ color: "var(--gt-text)", fontSize: 13, fontWeight: 500 }}>{crumb.label}</span>
                ) : (
                  <NavLink to={crumb.path} style={{ color: "var(--gt-muted)", fontSize: 13 }}>{crumb.label}</NavLink>
                )}
              </span>
            ))}
          </div>

          {/* Global search */}
          <form onSubmit={handleSearch} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--gt-muted)" }} />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search opportunities…"
                style={{
                  paddingLeft: 30,
                  paddingRight: 10,
                  paddingTop: 6,
                  paddingBottom: 6,
                  width: 220,
                  background: "var(--gt-card)",
                  border: "1px solid var(--gt-border)",
                  borderRadius: 6,
                  color: "var(--gt-text)",
                  fontSize: 12,
                }}
              />
            </div>
          </form>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "28px 32px", maxWidth: "100%", paddingBottom: 80 }}>
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav style={{
        display: "none",
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--gt-surface)",
        borderTop: "1px solid var(--gt-border)",
        padding: "8px 0 12px",
        zIndex: 200,
      }} className="mobile-nav">
        {MOBILE_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              flex: 1,
              color: isActive ? "var(--gt-gold)" : "var(--gt-muted)",
              fontSize: 10,
              textDecoration: "none",
            })}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <ToastContainer />
    </div>
  );
}
