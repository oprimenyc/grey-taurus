import { useEffect, useState } from "react";
import { Plus, Save, Download, Copy, CheckCircle, AlertTriangle, X, FileText } from "lucide-react";
import { api, type Proposal } from "../lib/api.ts";
import { toast } from "../components/toast.ts";
import { ScorePill } from "./Opportunities.tsx";

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_META: Record<string, { color: string; label: string }> = {
  draft: { color: "#8a95a3", label: "Draft" },
  review: { color: "#f59e0b", label: "Review" },
  submitted: { color: "#22c55e", label: "Submitted" },
  awarded: { color: "#a78bfa", label: "Awarded" },
  rejected: { color: "#ef4444", label: "Rejected" },
};

function StatusBadge({ status }: { status: string | null }) {
  const meta = STATUS_META[status ?? "draft"] ?? STATUS_META.draft;
  return (
    <span style={{ background: `${meta.color}18`, color: meta.color, padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600, border: `1px solid ${meta.color}33` }}>
      {meta.label}
    </span>
  );
}

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{ height: 70, background: "var(--gt-card)", borderRadius: 8 }} className="gt-pulse" />
      ))}
    </div>
  );
}

export default function Proposals() {
  const [items, setItems] = useState<Proposal[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<Proposal | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { load(); }, [page]);

  function load() {
    setLoading(true);
    setError(false);
    api.proposals.list(page, 20)
      .then((r) => setItems(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  function openEditor(p: Proposal) {
    setEditing(p);
    setEditContent(p.content ?? "");
  }

  async function saveContent() {
    if (!editing) return;
    setSaving(true);
    try {
      await api.proposals.updateContent(editing.id, editContent);
      setItems((prev) => prev.map((p) => p.id === editing.id ? { ...p, content: editContent } : p));
      toast("Proposal saved", "success");
    } catch {
      toast("Failed to save", "error");
    }
    setSaving(false);
  }

  async function markSubmitted() {
    if (!editing) return;
    try {
      await api.proposals.updateStatus(editing.id, "submitted");
      setItems((prev) => prev.map((p) => p.id === editing.id ? { ...p, status: "submitted" } : p));
      setEditing({ ...editing, status: "submitted" });
      toast("Proposal marked as submitted", "success");
    } catch {
      toast("Failed to update status", "error");
    }
  }

  function exportTxt() {
    if (!editing) return;
    const blob = new Blob([editContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${editing.title.replace(/[^a-z0-9]/gi, "_").slice(0, 50)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Exported as TXT", "success");
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(editContent).then(() => toast("Copied to clipboard", "success")).catch(() => toast("Failed to copy", "error"));
  }

  async function generateNew() {
    setGenerating(true);
    try {
      await api.agents.run("proposalGenerator");
      toast("Proposal generator triggered — check back soon", "success");
    } catch {
      toast("Failed to trigger proposal generator", "error");
    }
    setGenerating(false);
  }

  const btnBase: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 6,
    padding: "7px 14px", borderRadius: 6, fontSize: 12,
    fontWeight: 600, cursor: "pointer", border: "1px solid var(--gt-border)",
    background: "var(--gt-card)", color: "var(--gt-text)", transition: "all 0.15s",
  };

  return (
    <div className="gt-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: "var(--gt-text)", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Proposals</h1>
          <p style={{ color: "var(--gt-muted)", fontSize: 13 }}>Draft and submitted proposals with QA scores</p>
        </div>
        <button
          onClick={generateNew}
          disabled={generating}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", background: generating ? "var(--gt-card)" : "var(--gt-gold)", color: generating ? "var(--gt-muted)" : "#0f1117", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: generating ? "not-allowed" : "pointer" }}
        >
          <Plus size={14} /> {generating ? "Generating…" : "Generate New Proposal"}
        </button>
      </div>

      {loading ? <Skeleton /> : error ? (
        <div style={{ background: "var(--gt-card)", border: "1px solid #ef444433", borderRadius: 10, padding: 40, textAlign: "center" }}>
          <p style={{ color: "#ef4444", marginBottom: 12 }}>Failed to load proposals</p>
          <button onClick={load} style={{ ...btnBase, margin: "0 auto", color: "#ef4444", borderColor: "#ef444433" }}>Retry</button>
        </div>
      ) : items.length === 0 ? (
        <div style={{ background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 10, padding: 48, textAlign: "center" }}>
          <FileText size={32} color="var(--gt-muted)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "var(--gt-muted)", marginBottom: 16 }}>No proposals — generate one from the Opportunities page or click above</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((p) => (
            <div
              key={p.id}
              className="gt-row-hover"
              onClick={() => openEditor(p)}
              style={{ background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, transition: "border-color 0.15s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,169,110,0.2)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--gt-border)"; }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  {p.qaScore != null && p.qaScore < 60 && <AlertTriangle size={13} color="#f59e0b" aria-label={`Low QA score: ${p.qaScore}`} />}
                  <span style={{ color: "var(--gt-text)", fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                </div>
                <div style={{ color: "var(--gt-muted)", fontSize: 11 }}>
                  {p.agency || "No agency"} · Updated {fmtDate(p.updatedAt?.toString())}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                {p.qaScore != null && <ScorePill score={p.qaScore} />}
                <StatusBadge status={p.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
          style={{ ...btnBase, opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
        <span style={{ color: "var(--gt-muted)", fontSize: 13 }}>Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)} disabled={items.length < 20}
          style={{ ...btnBase, opacity: items.length < 20 ? 0.4 : 1 }}>Next →</button>
      </div>

      {/* Inline Editor Drawer */}
      {editing && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex" }} onClick={() => setEditing(null)}>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.5)" }} />
          <div
            className="gt-slide-in"
            style={{ width: 600, background: "var(--gt-surface)", borderLeft: "1px solid var(--gt-border)", height: "100%", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--gt-border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, paddingRight: 12 }}>
                <div style={{ color: "var(--gt-text)", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{editing.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <StatusBadge status={editing.status} />
                  {editing.qaScore != null && <ScorePill score={editing.qaScore} />}
                </div>
              </div>
              <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", color: "var(--gt-muted)", cursor: "pointer" }}><X size={18} /></button>
            </div>

            {editing.qaFeedback && (
              <div style={{ padding: "10px 20px", background: editing.qaScore != null && editing.qaScore < 60 ? "#2d1a0a" : "#0f1a2d", borderBottom: "1px solid var(--gt-border)" }}>
                <div style={{ color: "var(--gt-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>QA Feedback</div>
                <div style={{ color: "var(--gt-text)", fontSize: 12 }}>{editing.qaFeedback}</div>
              </div>
            )}

            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              style={{
                flex: 1,
                resize: "none",
                padding: "16px 20px",
                background: "var(--gt-card)",
                border: "none",
                color: "var(--gt-text)",
                fontSize: 13,
                lineHeight: 1.7,
                fontFamily: "'Inter', system-ui, sans-serif",
                outline: "none",
              }}
              placeholder="Proposal content will appear here…"
            />

            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--gt-border)", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={saveContent} disabled={saving}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "var(--gt-gold)", color: "#0f1117", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: saving ? "not-allowed" : "pointer" }}>
                <Save size={13} /> {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={markSubmitted}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "#0f2d1a", color: "#22c55e", border: "1px solid #22c55e33", borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                <CheckCircle size={13} /> Mark Submitted
              </button>
              <button onClick={exportTxt}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--gt-card)", color: "var(--gt-text)", border: "1px solid var(--gt-border)", borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                <Download size={13} /> Export TXT
              </button>
              <button onClick={copyToClipboard}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", background: "var(--gt-card)", color: "var(--gt-text)", border: "1px solid var(--gt-border)", borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                <Copy size={13} /> Copy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
