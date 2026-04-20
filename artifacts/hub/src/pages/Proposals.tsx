import { useEffect, useState } from "react";
import { api, type Proposal } from "../lib/api.ts";

function fmtDate(d: string | null | undefined): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_COLORS: Record<string, string> = {
  draft: "#8a95a3",
  review: "#f59e0b",
  approved: "#3b82f6",
  submitted: "#a78bfa",
  awarded: "#22c55e",
  rejected: "#ef4444",
};

export default function Proposals() {
  const [items, setItems] = useState<Proposal[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    api.proposals
      .list(page, 20)
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  async function updateStatus(id: number, status: string) {
    setUpdatingId(id);
    try {
      await api.proposals.updateStatus(id, status);
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    } catch {}
    setUpdatingId(null);
  }

  return (
    <div>
      <h1 style={{ margin: "0 0 4px", color: "#e0e0e0", fontSize: 22, fontWeight: 700 }}>Proposals</h1>
      <p style={{ margin: "0 0 24px", color: "#8a95a3", fontSize: 13 }}>
        Draft and submitted proposals with QA scores
      </p>

      {loading ? (
        <p style={{ color: "#8a95a3" }}>Loading…</p>
      ) : items.length === 0 ? (
        <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: 32, textAlign: "center" }}>
          <p style={{ color: "#8a95a3" }}>No proposals found. Proposals are generated for pursued opportunities.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, overflow: "hidden" }}>
          {items.map((p) => (
            <div key={p.id} style={{ borderBottom: "1px solid #222" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 16px", cursor: "pointer" }}
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, color: "#e0e0e0", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.title}
                  </div>
                  <div style={{ color: "#8a95a3", fontSize: 11 }}>{p.agency || "No agency"} · Created {fmtDate(p.createdAt?.toString())}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                  {p.qaScore != null && (
                    <span style={{
                      background: p.qaScore >= 70 ? "#1e3a1e" : p.qaScore >= 40 ? "#2a1e00" : "#2a1a1a",
                      color: p.qaScore >= 70 ? "#22c55e" : p.qaScore >= 40 ? "#f59e0b" : "#ef4444",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                    }}>
                      QA {p.qaScore}
                    </span>
                  )}
                  <span style={{ color: STATUS_COLORS[p.status || "draft"] ?? "#8a95a3", fontSize: 12 }}>
                    {p.status || "draft"}
                  </span>
                  <select
                    value={p.status || "draft"}
                    disabled={updatingId === p.id}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateStatus(p.id, e.target.value)}
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
                    {["draft", "review", "approved", "submitted", "awarded", "rejected"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <span style={{ color: "#555", fontSize: 12 }}>{expanded === p.id ? "▲" : "▼"}</span>
                </div>
              </div>
              {expanded === p.id && (
                <div style={{ padding: "0 16px 16px" }}>
                  {p.qaFeedback && (
                    <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 6, padding: "10px 14px", marginBottom: 12 }}>
                      <div style={{ color: "#8a95a3", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>QA FEEDBACK</div>
                      <div style={{ color: "#e0e0e0", fontSize: 12 }}>{p.qaFeedback}</div>
                    </div>
                  )}
                  {p.content ? (
                    <div style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 6, padding: "10px 14px" }}>
                      <div style={{ color: "#8a95a3", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>CONTENT</div>
                      <pre style={{ color: "#e0e0e0", fontSize: 12, margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                        {p.content.slice(0, 1000)}{p.content.length > 1000 ? "…" : ""}
                      </pre>
                    </div>
                  ) : (
                    <p style={{ color: "#555", fontSize: 12 }}>No content yet.</p>
                  )}
                </div>
              )}
            </div>
          ))}
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
