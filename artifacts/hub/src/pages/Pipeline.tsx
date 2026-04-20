import { useEffect, useState } from "react";
import { api, type PipelineItem } from "../lib/api.ts";

function fmtDate(d: string | null | undefined): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STAGE_COLORS: Record<string, string> = {
  identified: "#8a95a3",
  qualifying: "#f59e0b",
  pursuing: "#3b82f6",
  proposal: "#a78bfa",
  submitted: "#60a5fa",
  awarded: "#22c55e",
  lost: "#ef4444",
};

export default function Pipeline() {
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    api.pipeline
      .list(page, 20)
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  async function updateStage(id: number, stage: string) {
    setUpdatingId(id);
    try {
      await api.pipeline.updateStage(id, stage);
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, stage } : p)));
    } catch {}
    setUpdatingId(null);
  }

  return (
    <div>
      <h1 style={{ margin: "0 0 4px", color: "#e0e0e0", fontSize: 22, fontWeight: 700 }}>Pipeline</h1>
      <p style={{ margin: "0 0 24px", color: "#8a95a3", fontSize: 13 }}>
        Opportunities actively being tracked through pursuit stages
      </p>

      {loading ? (
        <p style={{ color: "#8a95a3" }}>Loading…</p>
      ) : items.length === 0 ? (
        <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: 32, textAlign: "center" }}>
          <p style={{ color: "#8a95a3" }}>No pipeline items found. Move opportunities here to track them.</p>
        </div>
      ) : (
        <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#111", borderBottom: "1px solid #2a2a2a" }}>
                {["Title", "Agency", "Stage", "Deadline", "Score", "Assigned", "Action"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", color: "#8a95a3", fontSize: 12, fontWeight: 600 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #222" }}>
                  <td style={{ padding: "10px 16px", color: "#e0e0e0", fontSize: 13, maxWidth: 300 }}>
                    <div style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.title}
                    </div>
                    {item.naicsCode && (
                      <div style={{ color: "#8a95a3", fontSize: 11, fontFamily: "monospace" }}>NAICS {item.naicsCode}</div>
                    )}
                  </td>
                  <td style={{ padding: "10px 16px", color: "#8a95a3", fontSize: 12, maxWidth: 160 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.agency || "N/A"}</div>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{
                      background: "#111",
                      color: STAGE_COLORS[item.stage || "identified"] ?? "#8a95a3",
                      border: `1px solid ${STAGE_COLORS[item.stage || "identified"] ?? "#8a95a3"}33`,
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                    }}>
                      {item.stage || "identified"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px", color: "#e0e0e0", fontSize: 12 }}>{fmtDate(item.responseDeadline?.toString())}</td>
                  <td style={{ padding: "10px 16px", color: "#c9a96e", fontWeight: 700, fontSize: 13 }}>
                    {item.score ?? 0}
                  </td>
                  <td style={{ padding: "10px 16px", color: "#8a95a3", fontSize: 12 }}>
                    {item.assignedTo || "—"}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <select
                      value={item.stage || "identified"}
                      disabled={updatingId === item.id}
                      onChange={(e) => updateStage(item.id, e.target.value)}
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
                      {["identified", "qualifying", "pursuing", "proposal", "submitted", "awarded", "lost"].map((s) => (
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
