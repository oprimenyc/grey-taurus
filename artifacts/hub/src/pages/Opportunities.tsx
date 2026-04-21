import { useEffect, useState } from "react";
import { X, Filter, Plus, FileText, Users, Target, ExternalLink, ChevronDown, ChevronUp, Search } from "lucide-react";
import { api, type Opportunity } from "../lib/api.ts";
import { toast } from "../components/toast.ts";

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ScorePill({ score }: { score: number | null | undefined }) {
  const s = score ?? 0;
  let bg = "#2d1a1a", color = "#ef4444";
  if (s >= 80) { bg = "#0f2d1a"; color = "#22c55e"; }
  else if (s >= 60) { bg = "#2d1f0a"; color = "#c9a96e"; }
  else if (s >= 40) { bg = "#2d2a0a"; color = "#f59e0b"; }
  return (
    <span style={{ background: bg, color, padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      {s}
    </span>
  );
}

function Badge({ label, color = "var(--gt-muted)" }: { label: string; color?: string }) {
  return (
    <span style={{ background: `${color}18`, color, padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 600, border: `1px solid ${color}33`, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{ height: 54, background: "var(--gt-card)", borderRadius: 4, opacity: 0.5 + i * 0.05 }} className="gt-pulse" />
      ))}
    </div>
  );
}

interface FilterState {
  naics: string;
  setAside: string;
  minScore: string;
  maxScore: string;
  status: string;
  sortBy: "score" | "deadline" | "postedDate";
  sortDir: "asc" | "desc";
  q: string;
}

export default function Opportunities() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    naics: "", setAside: "", minScore: "", maxScore: "", status: "", sortBy: "score", sortDir: "desc", q: "",
  });

  useEffect(() => {
    load();
  }, [page]);

  function load() {
    setLoading(true);
    setError(false);
    api.opportunities.list(page, 50)
      .then((r) => setItems(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  const naicsList = [...new Set(items.map((o) => o.naicsCode).filter(Boolean))].slice(0, 30);
  const setAsideList = [...new Set(items.map((o) => o.setAside).filter(Boolean))].slice(0, 20);

  const filtered = items.filter((o) => {
    if (filters.naics && o.naicsCode !== filters.naics) return false;
    if (filters.setAside && o.setAside !== filters.setAside) return false;
    if (filters.status && o.status !== filters.status) return false;
    if (filters.minScore && (o.score ?? 0) < Number(filters.minScore)) return false;
    if (filters.maxScore && (o.score ?? 0) > Number(filters.maxScore)) return false;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      if (!(o.title?.toLowerCase().includes(q) || o.agency?.toLowerCase().includes(q) || o.noticeId?.toLowerCase().includes(q))) return false;
    }
    return true;
  }).sort((a, b) => {
    const dir = filters.sortDir === "asc" ? 1 : -1;
    if (filters.sortBy === "score") return ((b.score ?? 0) - (a.score ?? 0)) * dir;
    if (filters.sortBy === "deadline") return (new Date(b.responseDeadline ?? 0).getTime() - new Date(a.responseDeadline ?? 0).getTime()) * dir;
    return (new Date(b.postedDate ?? 0).getTime() - new Date(a.postedDate ?? 0).getTime()) * dir;
  });

  async function addToPipeline(o: Opportunity) {
    setActing(`pipeline-${o.id}`);
    try {
      await api.pipeline.add({
        opportunityId: o.id,
        title: o.title ?? "Untitled",
        agency: o.agency ?? undefined,
        score: o.score ?? 0,
        naicsCode: o.naicsCode ?? undefined,
        responseDeadline: o.responseDeadline?.toString(),
      });
      toast(`"${o.title?.slice(0, 40)}" added to pipeline`, "success");
    } catch {
      toast("Failed to add to pipeline", "error");
    }
    setActing(null);
  }

  async function runAgent(o: Opportunity, agentName: string, label: string) {
    setActing(`${agentName}-${o.id}`);
    try {
      await api.agents.run(agentName);
      toast(`${label} triggered`, "success");
    } catch {
      toast(`Failed to run ${label}`, "error");
    }
    setActing(null);
  }

  function setFilter(k: keyof FilterState, v: string) {
    setFilters((f) => ({ ...f, [k]: v }));
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
          <h1 style={{ color: "var(--gt-text)", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Opportunities</h1>
          <p style={{ color: "var(--gt-muted)", fontSize: 13 }}>SAM.gov federal contract opportunities scored by relevance</p>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <Search size={12} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--gt-muted)" }} />
          <input
            type="text"
            placeholder="Search…"
            value={filters.q}
            onChange={(e) => setFilter("q", e.target.value)}
            style={{ paddingLeft: 26, paddingRight: 8, paddingTop: 6, paddingBottom: 6, width: 180, background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 6, color: "var(--gt-text)", fontSize: 12 }}
          />
        </div>
        <select value={filters.naics} onChange={(e) => setFilter("naics", e.target.value)}
          style={{ padding: "6px 8px", background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 6, color: filters.naics ? "var(--gt-text)" : "var(--gt-muted)", fontSize: 12 }}>
          <option value="">All NAICS</option>
          {naicsList.map((n) => <option key={n} value={n!}>{n}</option>)}
        </select>
        <select value={filters.setAside} onChange={(e) => setFilter("setAside", e.target.value)}
          style={{ padding: "6px 8px", background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 6, color: filters.setAside ? "var(--gt-text)" : "var(--gt-muted)", fontSize: 12 }}>
          <option value="">All Set-Asides</option>
          {setAsideList.map((s) => <option key={s} value={s!}>{s}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilter("status", e.target.value)}
          style={{ padding: "6px 8px", background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 6, color: filters.status ? "var(--gt-text)" : "var(--gt-muted)", fontSize: 12 }}>
          <option value="">All Statuses</option>
          {["queued", "reviewing", "pursuing", "submitted", "awarded", "closed"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="number" placeholder="Min score" value={filters.minScore} onChange={(e) => setFilter("minScore", e.target.value)}
          style={{ width: 90, padding: "6px 8px", background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 6, color: "var(--gt-text)", fontSize: 12 }} />
        <input type="number" placeholder="Max score" value={filters.maxScore} onChange={(e) => setFilter("maxScore", e.target.value)}
          style={{ width: 90, padding: "6px 8px", background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 6, color: "var(--gt-text)", fontSize: 12 }} />
        <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ color: "var(--gt-muted)", fontSize: 12 }}>Sort:</span>
          <select value={filters.sortBy} onChange={(e) => setFilter("sortBy", e.target.value as FilterState["sortBy"])}
            style={{ padding: "6px 8px", background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 6, color: "var(--gt-text)", fontSize: 12 }}>
            <option value="score">Score</option>
            <option value="deadline">Deadline</option>
            <option value="postedDate">Posted Date</option>
          </select>
          <button onClick={() => setFilter("sortDir", filters.sortDir === "asc" ? "desc" : "asc")}
            style={{ ...btnBase, padding: "6px 8px" }}>
            {filters.sortDir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {loading ? <Skeleton /> : error ? (
        <div style={{ background: "var(--gt-card)", border: "1px solid #ef444433", borderRadius: 10, padding: 40, textAlign: "center" }}>
          <p style={{ color: "#ef4444", marginBottom: 12 }}>Failed to load opportunities</p>
          <button onClick={load} style={{ ...btnBase, color: "#ef4444", borderColor: "#ef444444", margin: "0 auto" }}>Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 10, padding: 48, textAlign: "center" }}>
          <Search size={32} color="var(--gt-muted)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "var(--gt-muted)", marginBottom: 16 }}>No opportunities found — run a scan to populate</p>
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
                {["Title / Agency", "NAICS · Set-Aside", "Location", "Deadline", "Score", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "var(--gt-muted)", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr
                  key={o.id}
                  className="gt-row-hover"
                  onClick={() => setSelected(o)}
                  style={{ borderBottom: "1px solid var(--gt-border)", transition: "background 0.1s" }}
                >
                  <td style={{ padding: "11px 14px", maxWidth: 280 }}>
                    <div style={{ color: "var(--gt-text)", fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {o.title || "Untitled"}
                    </div>
                    <div style={{ color: "var(--gt-muted)", fontSize: 11, marginTop: 2 }}>{o.agency || "—"}</div>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {o.naicsCode && <Badge label={o.naicsCode} color="#3b82f6" />}
                      {o.setAside && <Badge label={o.setAside} color="#a78bfa" />}
                    </div>
                  </td>
                  <td style={{ padding: "11px 14px", color: "var(--gt-muted)", fontSize: 12 }}>
                    {o.placeOfPerformance ? o.placeOfPerformance.slice(0, 30) : "—"}
                  </td>
                  <td style={{ padding: "11px 14px", color: "var(--gt-text)", fontSize: 12, whiteSpace: "nowrap" }}>
                    {fmtDate(o.responseDeadline?.toString())}
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <ScorePill score={o.score} />
                  </td>
                  <td style={{ padding: "11px 14px" }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: 5, flexWrap: "nowrap" }}>
                      <button
                        disabled={acting === `pipeline-${o.id}`}
                        onClick={(e) => { e.stopPropagation(); addToPipeline(o); }}
                        title="Add to Pipeline"
                        style={{ ...btnBase, color: "var(--gt-gold)", borderColor: "rgba(201,169,110,0.3)" }}
                      >
                        <Plus size={11} /> Pipeline
                      </button>
                      <button
                        disabled={acting === `proposalGenerator-${o.id}`}
                        onClick={(e) => { e.stopPropagation(); runAgent(o, "proposalGenerator", "Proposal Generator"); }}
                        title="Generate Proposal"
                        style={btnBase}
                      >
                        <FileText size={11} />
                      </button>
                      <button
                        disabled={acting === `subcontractHunter-${o.id}`}
                        onClick={(e) => { e.stopPropagation(); runAgent(o, "subcontractHunter", "Subcontract Hunter"); }}
                        title="Find Subcontract"
                        style={btnBase}
                      >
                        <Users size={11} />
                      </button>
                      <button
                        disabled={acting === `strategyAgent-${o.id}`}
                        onClick={(e) => { e.stopPropagation(); runAgent(o, "strategyAgent", "Strategy Agent"); }}
                        title="View Strategy"
                        style={btnBase}
                      >
                        <Target size={11} />
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
        <span style={{ color: "var(--gt-muted)", fontSize: 13 }}>Page {page} · {filtered.length} shown</span>
        <button onClick={() => setPage((p) => p + 1)} disabled={items.length < 50}
          style={{ ...btnBase, opacity: items.length < 50 ? 0.4 : 1 }}>Next →</button>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex" }} onClick={() => setSelected(null)}>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.5)" }} />
          <div
            className="gt-slide-in"
            style={{ width: 480, background: "var(--gt-surface)", borderLeft: "1px solid var(--gt-border)", height: "100%", overflowY: "auto", padding: 28, display: "flex", flexDirection: "column", gap: 16 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <h2 style={{ color: "var(--gt-text)", fontSize: 16, fontWeight: 700, lineHeight: 1.4, flex: 1, paddingRight: 12 }}>{selected.title}</h2>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "var(--gt-muted)", cursor: "pointer", padding: 4 }}><X size={18} /></button>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <ScorePill score={selected.score} />
              {selected.naicsCode && <Badge label={`NAICS ${selected.naicsCode}`} color="#3b82f6" />}
              {selected.setAside && <Badge label={selected.setAside} color="#a78bfa" />}
              {selected.status && <Badge label={selected.status} color="var(--gt-muted)" />}
            </div>

            {[
              ["Agency", selected.agency],
              ["Notice ID", selected.noticeId],
              ["Type", selected.type],
              ["Place of Performance", selected.placeOfPerformance],
              ["Deadline", fmtDate(selected.responseDeadline?.toString())],
              ["Posted", fmtDate(selected.postedDate?.toString())],
            ].map(([label, val]) => val && (
              <div key={label}>
                <div style={{ color: "var(--gt-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
                <div style={{ color: "var(--gt-text)", fontSize: 13 }}>{val}</div>
              </div>
            ))}

            {selected.description && (
              <div>
                <div style={{ color: "var(--gt-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Description</div>
                <div style={{ color: "var(--gt-text)", fontSize: 13, lineHeight: 1.6, background: "var(--gt-card)", borderRadius: 8, padding: 14, maxHeight: 200, overflowY: "auto" }}>
                  {selected.description}
                </div>
              </div>
            )}

            {selected.source && (
              <a href={selected.source} target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--gt-gold)", fontSize: 13 }}>
                <ExternalLink size={13} /> View on SAM.gov
              </a>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8, borderTop: "1px solid var(--gt-border)", paddingTop: 16 }}>
              <div style={{ color: "var(--gt-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Actions</div>
              <button onClick={() => addToPipeline(selected)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "var(--gt-gold)", color: "#0f1117", border: "none", borderRadius: 7, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                <Plus size={14} /> Add to Pipeline
              </button>
              <button onClick={() => runAgent(selected, "proposalGenerator", "Proposal Generator")}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "var(--gt-card)", color: "var(--gt-text)", border: "1px solid var(--gt-border)", borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                <FileText size={14} /> Generate Proposal
              </button>
              <button onClick={() => runAgent(selected, "subcontractHunter", "Subcontract Hunter")}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "var(--gt-card)", color: "var(--gt-text)", border: "1px solid var(--gt-border)", borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                <Users size={14} /> Find Subcontract
              </button>
              <button onClick={() => runAgent(selected, "strategyAgent", "Strategy Agent")}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 14px", background: "var(--gt-card)", color: "var(--gt-text)", border: "1px solid var(--gt-border)", borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                <Target size={14} /> View Strategy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
