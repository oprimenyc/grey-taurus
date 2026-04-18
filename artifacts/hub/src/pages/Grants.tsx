import { useEffect, useState } from "react";
import { api, type Grant } from "../lib/api.ts";

function fmtMoney(n: number | null | undefined): string {
  if (!n) return "N/A";
  return `$${n.toLocaleString()}`;
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_COLORS: Record<string, string> = {
  queued: "#8a95a3",
  contacted: "#f59e0b",
  applied: "#3b82f6",
  awarded: "#22c55e",
  closed: "#555",
};

export default function Grants() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.grants
      .list(page, 20)
      .then((r) => setGrants(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <h1 style={{ margin: "0 0 4px", color: "#e0e0e0", fontSize: 22, fontWeight: 700 }}>Grants</h1>
      <p style={{ margin: "0 0 24px", color: "#8a95a3", fontSize: 13 }}>
        Federal and foundation grant opportunities
      </p>

      {loading ? (
        <p style={{ color: "#8a95a3" }}>Loading…</p>
      ) : grants.length === 0 ? (
        <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: 32, textAlign: "center" }}>
          <p style={{ color: "#8a95a3" }}>No grants found. Run a scan to populate.</p>
        </div>
      ) : (
        <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#111", borderBottom: "1px solid #2a2a2a" }}>
                {["Title", "Agency", "Amount", "Close Date", "Entity", "Score", "Status"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "#8a95a3", fontSize: 12, fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grants.map((g) => (
                <tr key={g.id} style={{ borderBottom: "1px solid #222" }}>
                  <td style={{ padding: "10px 16px", color: "#e0e0e0", fontSize: 13, maxWidth: 280 }}>
                    <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {g.title}
                    </div>
                    <div style={{ color: "#8a95a3", fontSize: 11, fontFamily: "monospace" }}>{g.grantId}</div>
                  </td>
                  <td style={{ padding: "10px 16px", color: "#8a95a3", fontSize: 12 }}>{g.agency || "N/A"}</td>
                  <td style={{ padding: "10px 16px", color: "#c9a96e", fontSize: 13 }}>{fmtMoney(g.amount)}</td>
                  <td style={{ padding: "10px 16px", color: "#e0e0e0", fontSize: 12 }}>{fmtDate(g.deadline)}</td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{
                      background: g.eligibleEntity === "risingpromise" ? "#1e3a1e" : "#1a2a3a",
                      color: g.eligibleEntity === "risingpromise" ? "#22c55e" : "#60a5fa",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                    }}>
                      {g.eligibleEntity || "greytaurus"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px", color: "#c9a96e", fontWeight: 700, fontSize: 13 }}>
                    {g.score ?? 0}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{
                      color: STATUS_COLORS[g.status || "queued"] ?? "#8a95a3",
                      fontSize: 12,
                    }}>
                      {g.status || "queued"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          style={{ padding: "6px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#e0e0e0", borderRadius: 6, cursor: "pointer" }}
        >
          ← Prev
        </button>
        <span style={{ padding: "6px 8px", color: "#8a95a3", fontSize: 13 }}>Page {page}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={grants.length < 20}
          style={{ padding: "6px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#e0e0e0", borderRadius: 6, cursor: "pointer" }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
