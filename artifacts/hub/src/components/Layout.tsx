import { type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { api } from "../lib/api.ts";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/pipeline", label: "Pipeline" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/proposals", label: "Proposals" },
  { to: "/outreach", label: "Outreach" },
  { to: "/grants", label: "Grants" },
  { to: "/subcontracts", label: "Subcontracts" },
  { to: "/reddit-intel", label: "Reddit Intel" },
  { to: "/agents", label: "Agents" },
  { to: "/settings", label: "Settings" },
];

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await api.auth.logout();
    navigate("/login");
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 220,
          background: "#111",
          borderRight: "1px solid #2a2a2a",
          display: "flex",
          flexDirection: "column",
          padding: "0 0 16px",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
        }}
      >
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #2a2a2a" }}>
          <div style={{ color: "#c9a96e", fontWeight: 700, fontSize: 16 }}>GREY TAURUS</div>
          <div style={{ color: "#8a95a3", fontSize: 11, marginTop: 2 }}>Autonomous Contracting</div>
        </div>
        <nav style={{ flex: 1, padding: "8px 0" }}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: "block",
                padding: "8px 20px",
                color: isActive ? "#c9a96e" : "#8a95a3",
                background: isActive ? "#1a1a1a" : "transparent",
                borderLeft: isActive ? "2px solid #c9a96e" : "2px solid transparent",
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                transition: "all 0.15s",
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          style={{
            margin: "0 16px",
            padding: "8px 12px",
            background: "transparent",
            border: "1px solid #2a2a2a",
            color: "#8a95a3",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Sign Out
        </button>
      </aside>
      <main style={{ marginLeft: 220, flex: 1, padding: "28px 32px", maxWidth: "100%" }}>
        {children}
      </main>
    </div>
  );
}
