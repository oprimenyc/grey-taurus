import { useEffect, useState } from "react";
import { api, type SubcontractLead } from "../lib/api.ts";

function fmtMoney(n: number | null | undefined): string {
  if (!n) return "N/A";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_COLORS: Record<string, string> = {
  queued: "#8a95a3",
  contacted: "#f59e0b",
  responded: "#3b82f6",
  teaming: "#22c55e",
  closed: "#555",
};

export default function Subcontracts() {
  const [subs, setSubs] = useState<SubcontractLead[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.subcontracts
      .list(page, 20)
      .then((r) => setSubs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <h1 style={{ margin: "0 0 4px", color: "#e0e0e0", fontSize: 22, fontWeight: 700 }}>Subcontract Leads</h1>
      <p style={{ margin: "0 0 24px", color: "#8a95a3", fontSize: 13 }}>
        Prime contractors with expiring contracts in target NAICS codes
      </p>

      {loading ? (
        <p style={{ color: "#8a95a3" }}>Loading…</p>
      ) : subs.length === 0 ? (
        <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: 32, textAlign: "center" }}>
          <p style={{ color: "#8a95a3" }}>No subcontract leads. Run a scan to populate.</p>
        </div>
      ) : (
        <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#111", borderBottom: "1px solid #2a2a2a" }}>
                {["Prime Contractor", "Contract Title", "Award Amount", "NAICS", "Expiry", "Score", "Status"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "#8a95a3", fontSize: 12, fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #222" }}>
                  <td style={{ padding: "10px 16px", color: "#e0e0e0", fontSize: 13, fontWeight: 500 }}>
                    {s.primeContractor}
                  </td>
                  <td style={{ padding: "10px 16px", color: "#8a95a3", fontSize: 12, maxWidth: 200 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                      {s.contractTitle || "—"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px", color: "#c9a96e", fontSize: 13 }}>{fmtMoney(s.awardAmount)}</td>
                  <td style={{ padding: "10px 16px", color: "#8a95a3", fontSize: 12 }}>{s.naicsCode || "N/A"}</td>
                  <td style={{ padding: "10px 16px", color: "#e0e0e0", fontSize: 12 }}>{fmtDate(s.expiryDate)}</td>
                  <td style={{ padding: "10px 16px", color: "#c9a96e", fontWeight: 700, fontSize: 13 }}>
                    {s.score ?? 0}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ color: STATUS_COLORS[s.outreachStatus || "queued"] ?? "#8a95a3", fontSize: 12 }}>
                      {s.outreachStatus || "queued"}
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
          disabled={subs.length < 20}
          style={{ padding: "6px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#e0e0e0", borderRadius: 6, cursor: "pointer" }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
