import { useEffect, useState } from "react";
import { X, Plus, ExternalLink, TrendingUp } from "lucide-react";
import { api, type Grant } from "../lib/api.ts";
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

function EntityBadge({ entity }: { entity: string | null }) {
  const isRP = entity === "risingpromise" || entity === "rising-promise";
  return (
    <span style={{ background: isRP ? "#0f2d1a" : "#0f1d2d", color: isRP ? "#22c55e" : "#60a5fa", padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, border: `1px solid ${isRP ? "#22c55e33" : "#60a5fa33"}` }}>
      {isRP ? "Rising Promise" : entity || "Grey Taurus"}
    </span>
  );
}

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{ height: 54, background: "var(--gt-card)", borderRadius: 4 }} className="gt-pulse" />
      ))}
    </div>
  );
}

export default function Grants() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<Grant | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  useEffect(() => { load(); }, [page]);

  function load() {
    setLoading(true);
    setError(false);
    api.grants.list(page, 50).then((r) => setGrants(r.data)).catch(() => setError(true)).finally(() => setLoading(false));
  }

  const filtered = grants.filter((g) => {
    if (entityFilter === "risingpromise" && g.eligibleEntity !== "risingpromise") return false;
    if (entityFilter === "greytaurus" && g.eligibleEntity === "risingpromise") return false;
    if (minAmount && (g.amount ?? 0) < Number(minAmount)) return false;
    if (maxAmount && (g.amount ?? 0) > Number(maxAmount)) return false;
    return true;
  });

  async function addToPipeline(g: Grant) {
    setActing(`pipeline-${g.id}`);
    try {
      await api.pipeline.add({ title: g.title, agency: g.agency ?? undefined, score: g.score ?? 0 });
      toast(`"${g.title.slice(0, 40)}" added to pipeline`, "success");
    } catch {
      toast("Failed to add to pipeline", "error");
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
          <h1 style={{ color: "var(--gt-text)", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Grants</h1>
          <p style={{ color: "var(--gt-muted)", fontSize: 13 }}>Federal and foundation grant opportunities</p>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}
          style={{ padding: "6px 8px", background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 6, color: entityFilter ? "var(--gt-text)" : "var(--gt-muted)", fontSize: 12 }}>
          <option value="">All Entities</option>
          <option value="greytaurus">Grey Taurus</option>
          <option value="risingpromise">Rising Promise</option>
        </select>
        <input type="number" placeholder="Min amount" value={minAmount} onChange={(e) => setMinAmount(e.target.value)}
          style={{ width: 110, padding: "6px 8px", background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 6, color: "var(--gt-text)", fontSize: 12 }} />
        <input type="number" placeholder="Max amount" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)}
          style={{ width: 110, padding: "6px 8px", background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 6, color: "var(--gt-text)", fontSize: 12 }} />
        <span style={{ color: "var(--gt-muted)", fontSize: 12, marginLeft: "auto" }}>{filtered.length} grants</span>
      </div>

      {loading ? <Skeleton /> : error ? (
        <div style={{ background: "var(--gt-card)", border: "1px solid #ef444433", borderRadius: 10, padding: 40, textAlign: "center" }}>
          <p style={{ color: "#ef4444", marginBottom: 12 }}>Failed to load grants</p>
          <button onClick={load} style={{ ...btnBase, margin: "0 auto", color: "#ef4444", borderColor: "#ef444433" }}>Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 10, padding: 48, textAlign: "center" }}>
          <TrendingUp size={32} color="var(--gt-muted)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "var(--gt-muted)", marginBottom: 16 }}>No grants found — run a scan to populate</p>
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
                {["Title / Agency", "Amount", "Close Date", "Entity", "Score", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "var(--gt-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((g) => (
                <tr
                  key={g.id}
                  className="gt-row-hover"
                  onClick={() => setSelected(g)}
                  style={{ borderBottom: "1px solid var(--gt-border)", transition: "background 0.1s" }}
                >
                  <td style={{ padding: "11px 14px", maxWidth: 280 }}>
                    <div style={{ color: "var(--gt-text)", fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.title}</div>
                    <div style={{ color: "var(--gt-muted)", fontSize: 11 }}>{g.agency || "—"} · {g.grantId}</div>
                  </td>
                  <td style={{ padding: "11px 14px", color: "var(--gt-gold)", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{fmtMoney(g.amount)}</td>
                  <td style={{ padding: "11px 14px", color: "var(--gt-text)", fontSize: 12, whiteSpace: "nowrap" }}>{fmtDate(g.deadline)}</td>
                  <td style={{ padding: "11px 14px" }}><EntityBadge entity={g.eligibleEntity} /></td>
                  <td style={{ padding: "11px 14px" }}><ScorePill score={g.score} /></td>
                  <td style={{ padding: "11px 14px" }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); toast("Apply feature coming soon", "info"); }}
                        style={{ ...btnBase, color: "var(--gt-gold)", borderColor: "rgba(201,169,110,0.3)" }}>
                        Apply
                      </button>
                      <button
                        disabled={acting === `pipeline-${g.id}`}
                        onClick={(e) => { e.stopPropagation(); addToPipeline(g); }}
                        style={btnBase}>
                        <Plus size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
          style={{ ...btnBase, opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
        <span style={{ color: "var(--gt-muted)", fontSize: 13 }}>Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)} disabled={grants.length < 50}
          style={{ ...btnBase, opacity: grants.length < 50 ? 0.4 : 1 }}>Next →</button>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex" }} onClick={() => setSelected(null)}>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.5)" }} />
          <div
            className="gt-slide-in"
            style={{ width: 440, background: "var(--gt-surface)", borderLeft: "1px solid var(--gt-border)", height: "100%", overflowY: "auto", padding: 28, display: "flex", flexDirection: "column", gap: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h2 style={{ color: "var(--gt-text)", fontSize: 15, fontWeight: 700, lineHeight: 1.4, flex: 1, paddingRight: 12 }}>{selected.title}</h2>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "var(--gt-muted)", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <ScorePill score={selected.score} />
              <EntityBadge entity={selected.eligibleEntity} />
              {selected.status && <span style={{ background: "var(--gt-card)", color: "var(--gt-muted)", padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{selected.status}</span>}
            </div>
            {[
              ["Agency", selected.agency],
              ["Grant ID", selected.grantId],
              ["Amount", fmtMoney(selected.amount)],
              ["Close Date", fmtDate(selected.deadline)],
              ["Added", fmtDate(selected.addedDate)],
            ].map(([label, val]) => val && val !== "N/A" && (
              <div key={label}>
                <div style={{ color: "var(--gt-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{label}</div>
                <div style={{ color: "var(--gt-text)", fontSize: 13 }}>{val}</div>
              </div>
            ))}
            {selected.description && (
              <div>
                <div style={{ color: "var(--gt-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Description</div>
                <div style={{ color: "var(--gt-text)", fontSize: 13, lineHeight: 1.6, background: "var(--gt-card)", borderRadius: 8, padding: 12 }}>{selected.description}</div>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid var(--gt-border)", paddingTop: 16 }}>
              <button onClick={() => addToPipeline(selected)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "var(--gt-gold)", color: "#0f1117", border: "none", borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                <Plus size={14} /> Add to Pipeline
              </button>
              <button onClick={() => toast("Apply feature coming soon", "info")}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "var(--gt-card)", color: "var(--gt-text)", border: "1px solid var(--gt-border)", borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                <ExternalLink size={14} /> Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
