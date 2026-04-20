import { useEffect, useState } from "react";
import { api, type AgentRun, type AgentLog } from "../lib/api.ts";

function fmtDate(d: string | null | undefined): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function fmtDuration(ms: number | null | undefined): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const STATUS_COLORS: Record<string, string> = {
  success: "#22c55e",
  running: "#3b82f6",
  failed: "#ef4444",
  error: "#ef4444",
};

export default function Agents() {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"runs" | "logs">("runs");
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.agents.runs(), api.agents.logs()])
      .then(([r, l]) => {
        setRuns(r.data);
        setLogs(l.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function triggerScan() {
    setScanning(true);
    try {
      await api.scan.run();
      setTimeout(() => {
        Promise.all([api.agents.runs(), api.agents.logs()]).then(([r, l]) => {
          setRuns(r.data);
          setLogs(l.data);
        });
      }, 3000);
    } catch {}
    setScanning(false);
  }

  const tabStyle = (active: boolean) => ({
    padding: "6px 16px",
    background: active ? "#c9a96e" : "#1a1a1a",
    border: "1px solid #2a2a2a",
    color: active ? "#111" : "#e0e0e0",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: active ? 700 : 400,
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", color: "#e0e0e0", fontSize: 22, fontWeight: 700 }}>Agents</h1>
          <p style={{ margin: 0, color: "#8a95a3", fontSize: 13 }}>Agent run history and scheduler logs</p>
        </div>
        <button
          onClick={triggerScan}
          disabled={scanning}
          style={{
            padding: "8px 18px",
            background: scanning ? "#333" : "#c9a96e",
            color: scanning ? "#8a95a3" : "#111",
            border: "none",
            borderRadius: 6,
            fontWeight: 700,
            fontSize: 13,
            cursor: scanning ? "not-allowed" : "pointer",
          }}
        >
          {scanning ? "Running…" : "▶ Trigger Scan"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button style={tabStyle(tab === "runs")} onClick={() => setTab("runs")}>Agent Runs</button>
        <button style={tabStyle(tab === "logs")} onClick={() => setTab("logs")}>Scheduler Logs</button>
      </div>

      {loading ? (
        <p style={{ color: "#8a95a3" }}>Loading…</p>
      ) : tab === "runs" ? (
        runs.length === 0 ? (
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: 32, textAlign: "center" }}>
            <p style={{ color: "#8a95a3" }}>No agent runs yet. Trigger a scan above.</p>
          </div>
        ) : (
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#111", borderBottom: "1px solid #2a2a2a" }}>
                  {["Agent", "Status", "Started", "Duration", "Triggered By", "Error"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "#8a95a3", fontSize: 12, fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #222" }}>
                    <td style={{ padding: "10px 16px", color: "#e0e0e0", fontSize: 13, fontFamily: "monospace" }}>
                      {r.agentName}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ color: STATUS_COLORS[r.status] ?? "#8a95a3", fontSize: 12 }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 16px", color: "#8a95a3", fontSize: 12 }}>{fmtDate(r.startedAt?.toString())}</td>
                    <td style={{ padding: "10px 16px", color: "#8a95a3", fontSize: 12 }}>{fmtDuration(r.durationMs)}</td>
                    <td style={{ padding: "10px 16px", color: "#8a95a3", fontSize: 12 }}>{r.triggeredBy || "scheduler"}</td>
                    <td style={{ padding: "10px 16px", color: "#ef4444", fontSize: 11, maxWidth: 200 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {r.errorMessage || "—"}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        logs.length === 0 ? (
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: 32, textAlign: "center" }}>
            <p style={{ color: "#8a95a3" }}>No scheduler logs yet.</p>
          </div>
        ) : (
          <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#111", borderBottom: "1px solid #2a2a2a" }}>
                  {["Agent", "Status", "Run At", "Opps", "Grants", "Subs", "Reddit", "Emails", "Duration"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "#8a95a3", fontSize: 12, fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} style={{ borderBottom: "1px solid #222" }}>
                    <td style={{ padding: "10px 16px", color: "#e0e0e0", fontSize: 12, fontFamily: "monospace" }}>{l.agentName}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ color: STATUS_COLORS[l.status] ?? "#8a95a3", fontSize: 12 }}>{l.status}</span>
                    </td>
                    <td style={{ padding: "10px 16px", color: "#8a95a3", fontSize: 12 }}>{fmtDate(l.runAt?.toString())}</td>
                    <td style={{ padding: "10px 16px", color: "#c9a96e", fontSize: 12 }}>{l.opportunitiesFound ?? 0}</td>
                    <td style={{ padding: "10px 16px", color: "#c9a96e", fontSize: 12 }}>{l.grantsFound ?? 0}</td>
                    <td style={{ padding: "10px 16px", color: "#c9a96e", fontSize: 12 }}>{l.subcontractsFound ?? 0}</td>
                    <td style={{ padding: "10px 16px", color: "#c9a96e", fontSize: 12 }}>{l.redditPostsFound ?? 0}</td>
                    <td style={{ padding: "10px 16px", color: "#c9a96e", fontSize: 12 }}>{l.emailsQueued ?? 0}</td>
                    <td style={{ padding: "10px 16px", color: "#8a95a3", fontSize: 12 }}>{fmtDuration(l.durationMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
