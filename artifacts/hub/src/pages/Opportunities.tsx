import { useEffect, useState } from "react";
import { api, type Opportunity } from "../lib/api.ts";

function fmtDate(d: string | null | undefined): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_COLORS: Record<string, string> = {
  queued: "#8a95a3",
  reviewing: "#f59e0b",
  pursuing: "#3b82f6",
  submitted: "#a78bfa",
  awarded: "#22c55e",
  closed: "#555",
};

export default function Opportunities() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    api.opportunities
      .list(page, 20)
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  async function updateStatus(id: number, status: string) {
    setUpdatingId(id);
    try {
      await api.opportunities.updateStatus(id, status);
      setItems((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch {}
    setUpdatingId(null);
  }

  return (
    <div>
      <h1 style={{ margin: "0 0 4px", color: "#e0e0e0", fontSize: 22, fontWeight: 700 }}>Opportunities</h1>
      <p style={{ margin: "0 0 24px", color: "#8a95a3", fontSize: 13 }}>
        SAM.gov federal contract opportunities scored by relevance
      </p>

      {loading ? (
        <p style={{ color: "#8a95a3" }}>Loading…</p>
      ) : items.length === 0 ? (
        <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: 32, textAlign: "center" }}>
          <p style={{ color: "#8a95a3" }}>No opportunities found. Run a scan to populate.</p>
        </div>
      ) : (
        <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#111", borderBottom: "1px solid #2a2a2a" }}>
                {["Title", "Agency", "NAICS", "Deadline", "Score", "Status", "Action"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "#8a95a3", fontSize: 12, fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id} style={{ borderBottom: "1px solid #222" }}>
                  <td style={{ padding: "10px 16px", color: "#e0e0e0", fontSize: 13, maxWidth: 300 }}>
                    <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {o.title || "Untitled"}
                    </div>
                    <div style={{ color: "#8a95a3", fontSize: 11, fontFamily: "monospace" }}>{o.noticeId}</div>
                  </td>
                  <td style={{ padding: "10px 16px", color: "#8a95a3", fontSize: 12, maxWidth: 160 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.agency || "N/A"}</div>
                  </td>
                  <td style={{ padding: "10px 16px", color: "#8a95a3", fontSize: 12, fontFamily: "monospace" }}>
                    {o.naicsCode || "—"}
                  </td>
                  <td style={{ padding: "10px 16px", color: "#e0e0e0", fontSize: 12 }}>{fmtDate(o.responseDeadline?.toString())}</td>
                  <td style={{ padding: "10px 16px", color: "#c9a96e", fontWeight: 700, fontSize: 13 }}>
                    {o.score ?? 0}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ color: STATUS_COLORS[o.status || "queued"] ?? "#8a95a3", fontSize: 12 }}>
                      {o.status || "queued"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <select
                      value={o.status || "queued"}
                      disabled={updatingId === o.id}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      style={{
                        background: "#111",
                        border: "1px solid #2a2a2a",
                        color: "#e0e0e0",
                        borderRadius: 4,
                        padding: "3px 6px",
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      {["queued", "reviewing", "pursuing", "submitted", "awarded", "closed"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
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
          disabled={items.length < 20}
          style={{ padding: "6px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#e0e0e0", borderRadius: 6, cursor: "pointer" }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
