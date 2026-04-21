import { useEffect, useState } from "react";
import { Play, RefreshCw, Bot } from "lucide-react";
import { api, type AgentRun } from "../lib/api.ts";
import { toast } from "../components/toast.ts";

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "Never";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const AGENTS: { name: string; label: string; description: string }[] = [
  { name: "opportunityScanner", label: "Opportunity Scanner", description: "Scans SAM.gov for new federal contract opportunities matching NAICS codes" },
  { name: "fastWinAgent", label: "Fast Win Agent", description: "Identifies quick-win opportunities with short timelines and high win probability" },
  { name: "scoringAgent", label: "Scoring Agent", description: "Re-scores all opportunities based on capability match and contract value" },
  { name: "capabilityMatcher", label: "Capability Matcher", description: "Matches opportunities to company capabilities and past performance" },
  { name: "proposalGenerator", label: "Proposal Generator", description: "Generates proposal drafts for high-priority opportunities" },
  { name: "partnerFinder", label: "Partner Finder", description: "Identifies teaming partners and subcontract opportunities" },
  { name: "competitorIntelligence", label: "Competitor Intelligence", description: "Analyzes incumbent contractors and the competitive landscape" },
  { name: "strategyAgent", label: "Strategy Agent", description: "Develops pursuit strategy for identified opportunities" },
  { name: "outreachDraftAgent", label: "Outreach Draft Agent", description: "Drafts personalized outreach emails to prime contractors" },
  { name: "pipelineBoardAgent", label: "Pipeline Board Agent", description: "Updates and organizes opportunity pipeline stages automatically" },
  { name: "followUpAgent", label: "Follow-Up Agent", description: "Generates follow-up communications for submitted proposals" },
  { name: "executionAgent", label: "Execution Agent", description: "Orchestrates daily execution across all platform functions" },
  { name: "subcontractHunter", label: "Subcontract Hunter", description: "Finds subcontracting opportunities from expiring prime contracts" },
  { name: "incumbentTakeoverAgent", label: "Incumbent Takeover Agent", description: "Identifies incumbents vulnerable to displacement in target NAICS" },
  { name: "dailyPriorityAgent", label: "Daily Priority Agent", description: "Generates daily prioritized action list based on deadlines and scores" },
];

type RunStatus = "idle" | "running" | "success" | "error";

const STATUS_META: Record<RunStatus, { color: string; label: string }> = {
  idle: { color: "#8a95a3", label: "Idle" },
  running: { color: "#3b82f6", label: "Running" },
  success: { color: "#22c55e", label: "Complete" },
  error: { color: "#ef4444", label: "Error" },
};

export default function Agents() {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAgents, setActiveAgents] = useState<Record<string, RunStatus>>({});
  const [runningAll, setRunningAll] = useState(false);
  const [expandedOutput, setExpandedOutput] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  function load() {
    setLoading(true);
    api.agents.runs(100).then((r) => setRuns(r.data)).catch(() => {}).finally(() => setLoading(false));
  }

  function getLastRun(agentName: string): AgentRun | undefined {
    return runs.find((r) => r.agentName === agentName);
  }

  async function runAgent(agentName: string) {
    setActiveAgents((a) => ({ ...a, [agentName]: "running" }));
    try {
      await api.agents.run(agentName);
      setActiveAgents((a) => ({ ...a, [agentName]: "success" }));
      toast(`${agentName} completed`, "success");
      setTimeout(() => {
        setActiveAgents((a) => ({ ...a, [agentName]: "idle" }));
        load();
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isNotFound = msg.includes("404");
      setActiveAgents((a) => ({ ...a, [agentName]: isNotFound ? "idle" : "error" }));
      toast(isNotFound ? `${agentName} not yet available` : `${agentName} failed`, isNotFound ? "info" : "error");
      setTimeout(() => setActiveAgents((a) => ({ ...a, [agentName]: "idle" })), 3000);
    }
  }

  async function runAll() {
    setRunningAll(true);
    try {
      await api.scan.run();
      toast("Full daily scan triggered — all agents running", "success");
      setTimeout(load, 5000);
    } catch {
      toast("Failed to trigger full scan", "error");
    }
    setRunningAll(false);
  }

  return (
    <div className="gt-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: "var(--gt-text)", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Agents</h1>
          <p style={{ color: "var(--gt-muted)", fontSize: 13 }}>{AGENTS.length} autonomous agents · Click Run to trigger individually</p>
        </div>
        <button
          onClick={runAll}
          disabled={runningAll}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 20px", background: runningAll ? "var(--gt-card)" : "var(--gt-gold)", color: runningAll ? "var(--gt-muted)" : "#0f1117", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: runningAll ? "not-allowed" : "pointer", transition: "all 0.2s" }}
        >
          {runningAll ? <RefreshCw size={14} className="gt-pulse" /> : <Play size={14} />}
          {runningAll ? "Running All…" : "Run All Agents"}
        </button>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {[...Array(15)].map((_, i) => (
            <div key={i} style={{ height: 160, background: "var(--gt-card)", borderRadius: 10 }} className="gt-pulse" />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {AGENTS.map((agent) => {
            const status: RunStatus = activeAgents[agent.name] ?? "idle";
            const lastRun = getLastRun(agent.name);
            const meta = STATUS_META[status];
            const isRunning = status === "running";

            return (
              <div
                key={agent.name}
                style={{
                  background: "var(--gt-card)",
                  border: `1px solid ${status === "running" ? "rgba(59,130,246,0.4)" : status === "error" ? "rgba(239,68,68,0.3)" : "var(--gt-border)"}`,
                  borderRadius: 10,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  transition: "border-color 0.2s var(--gt-ease)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ background: `${meta.color}18`, borderRadius: 7, padding: 7 }}>
                      <Bot size={14} color={meta.color} />
                    </div>
                    <div>
                      <div style={{ color: "var(--gt-text)", fontSize: 12, fontWeight: 600 }}>{agent.label}</div>
                    </div>
                  </div>
                  <span style={{
                    background: `${meta.color}18`,
                    color: meta.color,
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: 10,
                    fontWeight: 700,
                    border: `1px solid ${meta.color}33`,
                  }} className={isRunning ? "gt-pulse" : ""}>
                    {meta.label}
                  </span>
                </div>

                <p style={{ color: "var(--gt-muted)", fontSize: 11, lineHeight: 1.5 }}>{agent.description}</p>

                {lastRun && (
                  <div style={{ fontSize: 10, color: "var(--gt-muted)" }}>
                    <div>Last: {fmtDate(lastRun.startedAt?.toString())}</div>
                    {lastRun.output && (
                      <div
                        style={{ marginTop: 4, cursor: "pointer", color: "var(--gt-gold)" }}
                        onClick={() => setExpandedOutput(expandedOutput === agent.name ? null : agent.name)}
                      >
                        {expandedOutput === agent.name ? "Hide output ▲" : "Show output ▼"}
                      </div>
                    )}
                    {expandedOutput === agent.name && lastRun.output && (
                      <pre style={{ marginTop: 6, color: "var(--gt-muted)", fontSize: 10, whiteSpace: "pre-wrap", lineHeight: 1.5, maxHeight: 80, overflowY: "auto", background: "var(--gt-surface)", borderRadius: 5, padding: 8 }}>
                        {lastRun.output.slice(0, 300)}{lastRun.output.length > 300 ? "…" : ""}
                      </pre>
                    )}
                  </div>
                )}

                <button
                  onClick={() => runAgent(agent.name)}
                  disabled={isRunning}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "8px",
                    background: isRunning ? "var(--gt-surface)" : "var(--gt-surface)",
                    border: `1px solid ${isRunning ? "rgba(59,130,246,0.4)" : "var(--gt-border)"}`,
                    color: isRunning ? "#3b82f6" : "var(--gt-text)",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: isRunning ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                    marginTop: "auto",
                  }}
                  onMouseEnter={(e) => { if (!isRunning) (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,169,110,0.4)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = isRunning ? "rgba(59,130,246,0.4)" : "var(--gt-border)"; }}
                >
                  {isRunning ? <RefreshCw size={12} className="gt-pulse" /> : <Play size={12} />}
                  {isRunning ? "Running…" : "Run Now"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
