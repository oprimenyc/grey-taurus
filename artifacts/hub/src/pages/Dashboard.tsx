import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, RefreshCw, TrendingUp, FileText, Mail, Building2, CheckSquare, Square, AlertCircle } from "lucide-react";
import { api, type Opportunity, type Grant, type SubcontractLead, type OutreachItem } from "../lib/api.ts";
import { toast } from "../components/toast.ts";

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

function ScorePill({ score }: { score: number | null | undefined }) {
  const s = score ?? 0;
  let bg = "#2d1a1a", color = "#ef4444";
  if (s >= 80) { bg = "#0f2d1a"; color = "#22c55e"; }
  else if (s >= 60) { bg = "#2d1f0a"; color = "#c9a96e"; }
  else if (s >= 40) { bg = "#2d2a0a"; color = "#f59e0b"; }
  return (
    <span style={{ background: bg, color, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
      {s}
    </span>
  );
}

function StatCard({ label, value, to, icon: Icon, color }: {
  label: string; value: number | string; to: string;
  icon: React.ForwardRefExoticComponent<{ size?: number; color?: string } & React.RefAttributes<SVGSVGElement>>;
  color: string;
}) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(to)}
      style={{
        background: "var(--gt-card)",
        border: "1px solid var(--gt-border)",
        borderRadius: 10,
        padding: "18px 20px",
        cursor: "pointer",
        transition: "border-color 0.2s var(--gt-ease), background 0.2s",
        flex: 1,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,169,110,0.3)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--gt-border)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: "var(--gt-muted)", fontSize: 11, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
          <div style={{ color: "var(--gt-text)", fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{value}</div>
        </div>
        <div style={{ background: `${color}15`, borderRadius: 8, padding: 8 }}>
          <Icon size={18} color={color} />
        </div>
      </div>
    </div>
  );
}

const DEFAULT_TASKS = [
  "Review top-scored opportunities",
  "Approve pending outreach emails",
  "Check proposal QA scores",
  "Update pipeline stages",
  "Review agent run results",
];

export default function Dashboard() {
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [subs, setSubs] = useState<SubcontractLead[]>([]);
  const [outreach, setOutreach] = useState<OutreachItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [samStatus, setSamStatus] = useState<"checking" | "active" | "missing">("checking");
  const [tasks, setTasks] = useState<boolean[]>(() => {
    try { return JSON.parse(localStorage.getItem("gt_tasks") ?? "[]"); } catch { return new Array(DEFAULT_TASKS.length).fill(false); }
  });

  useEffect(() => {
    api.opportunities.list(1, 50).then((r) => setOpps(r.data)).catch(() => {});
    api.grants.list(1, 20).then((r) => setGrants(r.data)).catch(() => {});
    api.subcontracts.list(1, 20).then((r) => setSubs(r.data)).catch(() => {});
    api.outreach.list(1, 50).then((r) => setOutreach(r.data)).catch(() => {});
    api.settings.list().then((r) => {
      const samKey = r.data.find((s) => s.key === "sam_api_key");
      setSamStatus(samKey?.value ? "active" : "missing");
    }).catch(() => setSamStatus("missing"));
  }, []);

  function toggleTask(i: number) {
    const next = tasks.map((v, idx) => (idx === i ? !v : v));
    setTasks(next);
    localStorage.setItem("gt_tasks", JSON.stringify(next));
  }

  async function triggerScan() {
    setScanning(true);
    try {
      await api.scan.run();
      toast("Full scan triggered — check back in a few minutes", "success");
    } catch {
      toast("Failed to trigger scan", "error");
    } finally {
      setScanning(false);
    }
  }

  const pendingOutreach = outreach.filter((o) => o.status === "draft" || o.status === "review").length;
  const bestOpp = opps.length > 0 ? opps.reduce((a, b) => (b.score ?? 0) > (a.score ?? 0) ? b : a) : null;
  const bestSub = subs.length > 0 ? subs.reduce((a, b) => (b.score ?? 0) > (a.score ?? 0) ? b : a) : null;

  return (
    <div className="gt-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ color: "var(--gt-text)", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Dashboard</h1>
          <p style={{ color: "var(--gt-muted)", fontSize: 13 }}>
            Grey Taurus LLC · UEI: FMJFQ6R7B7P8 · CAGE: 1LXN7
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            background: samStatus === "active" ? "#0f2d1a" : "#2d1a1a",
            border: `1px solid ${samStatus === "active" ? "#22c55e44" : "#ef444444"}`,
            borderRadius: 6,
            fontSize: 12,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: samStatus === "active" ? "#22c55e" : "#ef4444" }} />
            <span style={{ color: samStatus === "active" ? "#22c55e" : "#ef4444" }}>
              SAM API {samStatus === "checking" ? "…" : samStatus === "active" ? "Active" : "Key Missing"}
            </span>
          </div>
          <button
            onClick={triggerScan}
            disabled={scanning}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 18px",
              background: scanning ? "var(--gt-card)" : "var(--gt-gold)",
              color: scanning ? "var(--gt-muted)" : "#0f1117",
              border: "none",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              cursor: scanning ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {scanning ? <RefreshCw size={13} className="gt-pulse" /> : <Play size={13} />}
            {scanning ? "Scanning…" : "Run Daily Scan"}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <StatCard label="Opportunities" value={opps.length} to="/opportunities" icon={TrendingUp} color="#c9a96e" />
        <StatCard label="Grants" value={grants.length} to="/grants" icon={FileText} color="#3b82f6" />
        <StatCard label="Subcontracts" value={subs.length} to="/subcontracts" icon={Building2} color="#22c55e" />
        <StatCard label="Emails Queued" value={pendingOutreach} to="/outreach" icon={Mail} color="#f59e0b" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Best Opportunity */}
        <div style={{ background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ color: "var(--gt-text)", fontSize: 14, fontWeight: 600 }}>Best Opportunity</h3>
            <Link to="/opportunities" style={{ color: "var(--gt-gold)", fontSize: 12 }}>View all →</Link>
          </div>
          {!bestOpp ? (
            <p style={{ color: "var(--gt-muted)", fontSize: 13 }}>No opportunities yet — run a scan to populate.</p>
          ) : (
            <Link to="/opportunities" style={{ display: "block", textDecoration: "none" }}>
              <div style={{ background: "var(--gt-surface)", border: "1px solid var(--gt-border)", borderRadius: 8, padding: 14, cursor: "pointer", transition: "border-color 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,169,110,0.3)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--gt-border)"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                  <div style={{ color: "var(--gt-text)", fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>{bestOpp.title}</div>
                  <ScorePill score={bestOpp.score} />
                </div>
                <div style={{ color: "var(--gt-muted)", fontSize: 11 }}>{bestOpp.agency}</div>
                <div style={{ color: "var(--gt-muted)", fontSize: 11, marginTop: 4 }}>Deadline: {fmtDate(bestOpp.responseDeadline?.toString())}</div>
              </div>
            </Link>
          )}
        </div>

        {/* Best Subcontract */}
        <div style={{ background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ color: "var(--gt-text)", fontSize: 14, fontWeight: 600 }}>Best Subcontract Lead</h3>
            <Link to="/subcontracts" style={{ color: "var(--gt-gold)", fontSize: 12 }}>View all →</Link>
          </div>
          {!bestSub ? (
            <p style={{ color: "var(--gt-muted)", fontSize: 13 }}>No leads yet — run a scan to populate.</p>
          ) : (
            <Link to="/subcontracts" style={{ display: "block", textDecoration: "none" }}>
              <div style={{ background: "var(--gt-surface)", border: "1px solid var(--gt-border)", borderRadius: 8, padding: 14, cursor: "pointer", transition: "border-color 0.15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,169,110,0.3)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--gt-border)"; }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                  <div style={{ color: "var(--gt-text)", fontSize: 13, fontWeight: 500 }}>{bestSub.primeContractor}</div>
                  <ScorePill score={bestSub.score} />
                </div>
                <div style={{ color: "var(--gt-muted)", fontSize: 11 }}>{bestSub.agency} · NAICS {bestSub.naicsCode}</div>
                <div style={{ color: "var(--gt-gold)", fontSize: 12, fontWeight: 600, marginTop: 4 }}>{fmtMoney(bestSub.awardAmount)}</div>
              </div>
            </Link>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Daily Action Plan */}
        <div style={{ background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ color: "var(--gt-text)", fontSize: 14, fontWeight: 600 }}>Daily Action Plan</h3>
            <span style={{ color: "var(--gt-muted)", fontSize: 11 }}>
              {tasks.filter(Boolean).length}/{DEFAULT_TASKS.length} done
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {DEFAULT_TASKS.map((task, i) => (
              <div
                key={i}
                onClick={() => toggleTask(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  background: "var(--gt-surface)",
                  borderRadius: 6,
                  cursor: "pointer",
                  opacity: tasks[i] ? 0.5 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {tasks[i]
                  ? <CheckSquare size={14} color="var(--gt-gold)" />
                  : <Square size={14} color="var(--gt-muted)" />}
                <span style={{ color: "var(--gt-text)", fontSize: 13, textDecoration: tasks[i] ? "line-through" : "none" }}>
                  {task}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Grants */}
        <div style={{ background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 10, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ color: "var(--gt-text)", fontSize: 14, fontWeight: 600 }}>Fast Grants Open Now</h3>
            <Link to="/grants" style={{ color: "var(--gt-gold)", fontSize: 12 }}>View all →</Link>
          </div>
          {grants.length === 0 ? (
            <p style={{ color: "var(--gt-muted)", fontSize: 13 }}>No grants — run a scan to populate.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {grants.slice(0, 4).map((g) => (
                <div key={g.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--gt-border)" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "var(--gt-text)", fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{g.title}</div>
                    <div style={{ color: "var(--gt-muted)", fontSize: 11 }}>{g.agency}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ color: "var(--gt-gold)", fontSize: 12, fontWeight: 600 }}>{fmtMoney(g.amount)}</div>
                    <div style={{ color: "var(--gt-muted)", fontSize: 11 }}>{fmtDate(g.deadline)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SAM key warning if missing */}
      {samStatus === "missing" && (
        <div style={{ marginTop: 20, background: "#2d1a0a", border: "1px solid #f59e0b44", borderRadius: 8, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <AlertCircle size={16} color="#f59e0b" />
          <span style={{ color: "#f59e0b", fontSize: 13 }}>
            SAM API key not configured. <Link to="/settings" style={{ color: "#f59e0b", textDecoration: "underline" }}>Add it in Settings</Link> to enable opportunity scanning.
          </span>
        </div>
      )}
    </div>
  );
}
