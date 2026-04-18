import { useEffect, useState } from "react";
import { api, type RedditPost } from "../lib/api.ts";

const CATEGORY_COLORS: Record<string, string> = {
  TEAMING_REQUEST: "#c9a96e",
  UNADVERTISED_OPPORTUNITY: "#22c55e",
  AGENCY_PAIN_POINT: "#f97316",
  COMPETITIVE_INTEL: "#3b82f6",
  MARKET_SIGNAL: "#8a95a3",
  UNCATEGORIZED: "#444",
};

const ACTION_OPTIONS = ["none", "contacted", "added_to_pipeline", "archived"] as const;

export default function RedditIntel() {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.reddit
      .list(page, 20)
      .then((r) => setPosts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  async function updateAction(id: number, action: string) {
    await api.reddit.updateAction(id, action);
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, actionTaken: action } : p));
  }

  return (
    <div>
      <h1 style={{ margin: "0 0 4px", color: "#e0e0e0", fontSize: 22, fontWeight: 700 }}>Reddit Intelligence</h1>
      <p style={{ margin: "0 0 4px", color: "#8a95a3", fontSize: 13 }}>
        Public Reddit posts matching contracting keywords — sourced daily.
      </p>
      <p style={{ margin: "0 0 24px", color: "#555", fontSize: 12, fontStyle: "italic" }}>
        Unverified. Review before acting on any lead.
      </p>

      {loading ? (
        <p style={{ color: "#8a95a3" }}>Loading…</p>
      ) : posts.length === 0 ? (
        <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: 32, textAlign: "center" }}>
          <p style={{ color: "#8a95a3" }}>No Reddit intel. Run a scan to populate.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {posts.map((r) => {
            const color = CATEGORY_COLORS[r.category || "UNCATEGORIZED"] ?? "#444";
            const isBold = r.category === "TEAMING_REQUEST" || r.category === "UNADVERTISED_OPPORTUNITY";
            return (
              <div
                key={r.id}
                style={{
                  background: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: 8,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                }}
              >
                <span style={{
                  background: color,
                  color: "#fff",
                  fontSize: 10,
                  padding: "3px 8px",
                  borderRadius: 4,
                  whiteSpace: "nowrap",
                  fontWeight: 700,
                  minWidth: 110,
                  textAlign: "center",
                  marginTop: 2,
                }}>
                  {r.category?.replace(/_/g, " ")}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ color: "#8a95a3", fontSize: 12 }}>r/{r.subreddit}</span>
                    <span style={{ color: "#555", fontSize: 11 }}>·</span>
                    <span style={{ color: "#555", fontSize: 11 }}>score: {r.redditScore}</span>
                    <span style={{ color: "#555", fontSize: 11 }}>·</span>
                    <span style={{ color: "#555", fontSize: 11 }}>{r.numComments} comments</span>
                  </div>
                  <p style={{
                    margin: 0,
                    color: "#e0e0e0",
                    fontSize: 13,
                    fontWeight: isBold ? 600 : 400,
                  }}>
                    {r.title}
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noreferrer" style={{ color: "#c9a96e", fontSize: 12 }}>
                      View ↗
                    </a>
                  )}
                  <select
                    value={r.actionTaken || "none"}
                    onChange={(e) => updateAction(r.id, e.target.value)}
                    style={{
                      background: "#111",
                      border: "1px solid #2a2a2a",
                      color: "#8a95a3",
                      borderRadius: 4,
                      padding: "3px 6px",
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    {ACTION_OPTIONS.map((a) => (
                      <option key={a} value={a}>{a.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
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
          disabled={posts.length < 20}
          style={{ padding: "6px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#e0e0e0", borderRadius: 6, cursor: "pointer" }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
