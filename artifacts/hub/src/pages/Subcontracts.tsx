import { useEffect, useState } from "react";
import { X, Mail, ExternalLink, Building2 } from "lucide-react";
import { api, type SubcontractLead } from "../lib/api.ts";
import { toast } from "../components/toast.ts";
import { ScorePill } from "./Opportunities.tsx";

function fmtMoney(n: number | null | undefined): string {
  if (!n) return "N/A";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000).toLocaleString()}K`;
  return `$${n.toLocaleString()}`;
}

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function expiryColor(expiryDate: string | null | undefined): string {
  if (!expiryDate) return "var(--gt-muted)";
  const months = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30);
  if (months < 6) return "#ef4444";
  if (months < 12) return "#c9a96e";
  return "#22c55e";
}

const STATUS_META: Record<string, string> = {
  queued: "#8a95a3",
  contacted: "#f59e0b",
  responded: "#3b82f6",
  teaming: "#22c55e",
  closed: "#555",
};

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{ height: 54, background: "var(--gt-card)", borderRadius: 4 }} className="gt-pulse" />
      ))}
    </div>
  );
}

export default function Subcontracts() {
  const [subs, setSubs] = useState<SubcontractLead[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<SubcontractLead | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [naicsFilter, setNaicsFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expiryFilter, setExpiryFilter] = useState("");

  useEffect(() => { load(); }, [page]);

  function load() {
    setLoading(true);
    setError(false);
    api.subcontracts.list(page, 50).then((r) => setSubs(r.data)).catch(() => setError(true)).finally(() => setLoading(false));
  }

  const naicsList = [...new Set(subs.map((s) => s.naicsCode).filter(Boolean))];

  const filtered = subs.filter((s) => {
    if (naicsFilter && s.naicsCode !== naicsFilter) return false;
    if (statusFilter && s.outreachStatus !== statusFilter) return false;
    if (expiryFilter) {
      const months = s.expiryDate ? (new Date(s.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30) : 999;
      if (expiryFilter === "under6" && months >= 6) return false;
      if (expiryFilter === "6to12" && (months < 6 || months >= 12)) return false;
      if (expiryFilter === "over12" && months < 12) return false;
    }
    return true;
  });

  async function generateOutreach(s: SubcontractLead) {
    setActing(`outreach-${s.id}`);
    try {
      await api.agents.run("outreachDraftAgent");
      toast(`Outreach drafts generating for ${s.primeContractor}`, "success");
    } catch {
      toast("Failed to generate outreach", "error");
    }
    setActing(null);
  }

  const btnBase: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
    borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: "pointer",
    border: "1px solid var(--gt-border)", background: "var(--gt-surface)",
    color: "var(--gt-muted)", transition: "all 0.15s", whiteSpace: "nowrap",
  };

  return (
    <div className="gt-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: "var(--gt-text)", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Subcontract Leads</h1>
          <p style={{ color: "var(--gt-muted)", fontSize: 13 }}>Prime contractors with expiring contracts in target NAICS codes</p>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <select value={naicsFilter} onChange={(e) => setNaicsFilter(e.target.value)}
          style={{ padding: "6px 8px", background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 6, color: naicsFilter ? "var(--gt-text)" : "var(--gt-muted)", fontSize: 12 }}>
          <option value="">All NAICS</option>
          {naicsList.map((n) => <option key={n} value={n!}>{n}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "6px 8px", background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 6, color: statusFilter ? "var(--gt-text)" : "var(--gt-muted)", fontSize: 12 }}>
          <option value="">All Statuses</option>
          {["queued", "contacted", "responded", "teaming", "closed"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={expiryFilter} onChange={(e) => setExpiryFilter(e.target.value)}
          style={{ padding: "6px 8px", background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 6, color: expiryFilter ? "var(--gt-text)" : "var(--gt-muted)", fontSize: 12 }}>
          <option value="">All Expiry</option>
          <option value="under6">Expiring &lt;6 months</option>
          <option value="6to12">Expiring 6–12 months</option>
          <option value="over12">Expiring 12+ months</option>
        </select>
        <span style={{ color: "var(--gt-muted)", fontSize: 12, marginLeft: "auto" }}>{filtered.length} leads</span>
      </div>

      {loading ? <Skeleton /> : error ? (
        <div style={{ background: "var(--gt-card)", border: "1px solid #ef444433", borderRadius: 10, padding: 40, textAlign: "center" }}>
          <p style={{ color: "#ef4444", marginBottom: 12 }}>Failed to load subcontract leads</p>
          <button onClick={load} style={{ ...btnBase, margin: "0 auto", color: "#ef4444", borderColor: "#ef444433" }}>Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 10, padding: 48, textAlign: "center" }}>
          <Building2 size={32} color="var(--gt-muted)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "var(--gt-muted)", marginBottom: 16 }}>No subcontract leads — run a scan to populate</p>
          <button onClick={async () => { try { await api.scan.run(); toast("Scan triggered", "success"); } catch { toast("Failed", "error"); } }}
            style={{ padding: "8px 18px", background: "var(--gt-gold)", color: "#0f1117", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Trigger Scan
          </button>
        </div>
      ) : (
        <div style={{ background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--gt-surface)", borderBottom: "1px solid var(--gt-border)" }}>
                {["Prime Contractor", "Contract Title", "Award Amount", "NAICS", "Expiry", "Score", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "var(--gt-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const expColor = expiryColor(s.expiryDate);
                const status = s.outreachStatus || "queued";
                return (
                  <tr
                    key={s.id}
                    className="gt-row-hover"
                    onClick={() => setSelected(s)}
                    style={{ borderBottom: "1px solid var(--gt-border)", transition: "background 0.1s" }}
                  >
                    <td style={{ padding: "11px 14px", color: "var(--gt-text)", fontSize: 13, fontWeight: 500 }}>{s.primeContractor}</td>
                    <td style={{ padding: "11px 14px", color: "var(--gt-muted)", fontSize: 12, maxWidth: 200 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{s.contractTitle || "—"}</span>
                    </td>
                    <td style={{ padding: "11px 14px", color: "var(--gt-gold)", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{fmtMoney(s.awardAmount)}</td>
                    <td style={{ padding: "11px 14px", color: "var(--gt-muted)", fontSize: 12 }}>{s.naicsCode || "—"}</td>
                    <td style={{ padding: "11px 14px", color: expColor, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{fmtDate(s.expiryDate)}</td>
                    <td style={{ padding: "11px 14px" }}><ScorePill score={s.score} /></td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ color: STATUS_META[status] ?? "var(--gt-muted)", fontSize: 12 }}>{status}</span>
                    </td>
                    <td style={{ padding: "11px 14px" }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button
                          disabled={acting === `outreach-${s.id}`}
                          onClick={(e) => { e.stopPropagation(); generateOutreach(s); }}
                          style={{ ...btnBase, color: "var(--gt-gold)", borderColor: "rgba(201,169,110,0.3)" }}>
                          <Mail size={11} /> Outreach
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelected(s); }}
                          style={btnBase}>
                          <ExternalLink size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
          style={{ ...btnBase, opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
        <span style={{ color: "var(--gt-muted)", fontSize: 13 }}>Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)} disabled={subs.length < 50}
          style={{ ...btnBase, opacity: subs.length < 50 ? 0.4 : 1 }}>Next →</button>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex" }} onClick={() => setSelected(null)}>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.5)" }} />
          <div
            className="gt-slide-in"
            style={{ width: 420, background: "var(--gt-surface)", borderLeft: "1px solid var(--gt-border)", height: "100%", overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 14 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h2 style={{ color: "var(--gt-text)", fontSize: 15, fontWeight: 700, flex: 1, paddingRight: 12 }}>{selected.primeContractor}</h2>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "var(--gt-muted)", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <ScorePill score={selected.score} />
              {selected.naicsCode && <span style={{ background: "#3b82f618", color: "#3b82f6", padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 600, border: "1px solid #3b82f633" }}>NAICS {selected.naicsCode}</span>}
            </div>
            {[
              ["Contract Title", selected.contractTitle],
              ["Agency", selected.agency],
              ["Award Amount", fmtMoney(selected.awardAmount)],
              ["Expiry Date", fmtDate(selected.expiryDate)],
              ["Outreach Status", selected.outreachStatus || "queued"],
            ].map(([label, val]) => val && (
              <div key={label}>
                <div style={{ color: "var(--gt-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{label}</div>
                <div style={{ color: label === "Expiry Date" ? expiryColor(selected.expiryDate) : "var(--gt-text)", fontSize: 13, fontWeight: label === "Award Amount" ? 600 : 400 }}>{val}</div>
              </div>
            ))}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid var(--gt-border)", paddingTop: 14 }}>
              <button onClick={() => generateOutreach(selected)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "var(--gt-gold)", color: "#0f1117", border: "none", borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                <Mail size={14} /> Generate Outreach
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
