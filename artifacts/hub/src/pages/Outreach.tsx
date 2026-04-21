import { useEffect, useState } from "react";
import { Check, X, Mail, Clock } from "lucide-react";
import { api, type OutreachItem } from "../lib/api.ts";
import { toast } from "../components/toast.ts";

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const DAILY_LIMIT = 20;
type Tab = "all" | "pending" | "approved" | "skipped";

function RecipientBadge({ type }: { type: string | null }) {
  const colors: Record<string, string> = { prime: "#3b82f6", partner: "#a78bfa", agency: "#c9a96e", other: "#8a95a3" };
  const c = colors[type ?? "other"] ?? "#8a95a3";
  return <span style={{ background: `${c}18`, color: c, padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 600, border: `1px solid ${c}33`, flexShrink: 0 }}>{type ?? "other"}</span>;
}

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ height: 80, background: "var(--gt-card)", borderRadius: 8 }} className="gt-pulse" />
      ))}
    </div>
  );
}

function isToday(d: string | Date | null | undefined): boolean {
  if (!d) return false;
  const date = new Date(d);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

export default function Outreach() {
  const [items, setItems] = useState<OutreachItem[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>("all");
  const [acting, setActing] = useState<number | null>(null);

  useEffect(() => { load(); }, [page]);

  function load() {
    setLoading(true);
    setError(false);
    api.outreach.list(page, 50)
      .then((r) => setItems(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  const approvedToday = items.filter((o) => (o.status === "sent" || o.status === "approved") && isToday(o.sentAt ?? o.updatedAt)).length;
  const progress = Math.min(100, (approvedToday / DAILY_LIMIT) * 100);

  async function approve(item: OutreachItem) {
    if (!item.targetEmail || !item.subject || !item.body) {
      toast("Missing email address, subject, or body — cannot send", "error");
      return;
    }
    setActing(item.id);
    try {
      await api.email.send({ to: item.targetEmail, subject: item.subject, body: item.body });
      await api.outreach.updateStatus(item.id, "sent");
      setItems((prev) => prev.map((o) => o.id === item.id ? { ...o, status: "sent", sentAt: new Date() as unknown as Date } : o));
      toast(`Email sent to ${item.targetName ?? item.targetEmail}`, "success");
    } catch {
      toast("Failed to send email", "error");
    }
    setActing(null);
  }

  async function skip(item: OutreachItem) {
    setActing(item.id);
    try {
      await api.outreach.updateStatus(item.id, "skipped");
      setItems((prev) => prev.map((o) => o.id === item.id ? { ...o, status: "skipped" } : o));
      toast("Email skipped", "info");
    } catch {
      toast("Failed to skip", "error");
    }
    setActing(null);
  }

  const filtered = items.filter((o) => {
    if (tab === "pending") return o.status === "draft" || o.status === "review";
    if (tab === "approved") return o.status === "sent" || o.status === "approved";
    if (tab === "skipped") return o.status === "skipped";
    return true;
  });

  const btnBase: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 5, padding: "7px 14px",
    borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
    border: "1px solid var(--gt-border)", background: "var(--gt-card)",
    color: "var(--gt-muted)", transition: "all 0.15s",
  };

  return (
    <div className="gt-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "var(--gt-text)", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Outreach</h1>
        <p style={{ color: "var(--gt-muted)", fontSize: 13 }}>Prime contractor and teaming partner outreach messages</p>
      </div>

      {/* Daily counter */}
      <div style={{ background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ color: "var(--gt-text)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            <Mail size={14} color="var(--gt-gold)" />
            {approvedToday} of {DAILY_LIMIT} approved today
          </span>
          <span style={{ color: approvedToday >= DAILY_LIMIT ? "#22c55e" : "var(--gt-muted)", fontSize: 12 }}>
            {approvedToday >= DAILY_LIMIT ? "Daily limit reached" : `${DAILY_LIMIT - approvedToday} remaining`}
          </span>
        </div>
        <div style={{ height: 6, background: "var(--gt-surface)", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: "var(--gt-gold)", borderRadius: 999, transition: "width 0.5s var(--gt-ease)" }} />
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {(["all", "pending", "approved", "skipped"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "6px 14px",
              background: tab === t ? "var(--gt-gold)" : "var(--gt-card)",
              color: tab === t ? "#0f1117" : "var(--gt-muted)",
              border: `1px solid ${tab === t ? "var(--gt-gold)" : "var(--gt-border)"}`,
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              textTransform: "capitalize",
              transition: "all 0.15s",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? <Skeleton /> : error ? (
        <div style={{ background: "var(--gt-card)", border: "1px solid #ef444433", borderRadius: 10, padding: 40, textAlign: "center" }}>
          <p style={{ color: "#ef4444", marginBottom: 12 }}>Failed to load outreach</p>
          <button onClick={load} style={{ ...btnBase, margin: "0 auto" }}>Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 10, padding: 48, textAlign: "center" }}>
          <Mail size={32} color="var(--gt-muted)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "var(--gt-muted)" }}>No emails queued — run a scan to generate outreach</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((item) => {
            const isSent = item.status === "sent" || item.status === "approved";
            const isSkipped = item.status === "skipped";
            const isPending = !isSent && !isSkipped;
            return (
              <div
                key={item.id}
                style={{
                  background: "var(--gt-card)",
                  border: `1px solid ${isSent ? "#22c55e22" : isSkipped ? "var(--gt-border)" : "var(--gt-border)"}`,
                  borderRadius: 8,
                  padding: "14px 16px",
                  opacity: isSent || isSkipped ? 0.65 : 1,
                  transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                      <RecipientBadge type={item.entityType} />
                      <span style={{ color: "var(--gt-text)", fontSize: 13, fontWeight: 500, textDecoration: isSkipped ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.subject || "No subject"}
                      </span>
                      {isSent && <Check size={13} color="#22c55e" />}
                    </div>
                    <div style={{ color: "var(--gt-muted)", fontSize: 11, marginBottom: 6 }}>
                      To: {item.targetName || "Unknown"} {item.targetEmail ? `<${item.targetEmail}>` : ""} · {item.targetOrg || ""}
                    </div>
                    {item.body && (
                      <div style={{ color: "var(--gt-muted)", fontSize: 12, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {item.body}
                      </div>
                    )}
                  </div>
                  {isPending && (
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button
                        disabled={acting === item.id}
                        onClick={() => approve(item)}
                        style={{
                          display: "flex", alignItems: "center", gap: 5,
                          padding: "7px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                          border: "1px solid rgba(201,169,110,0.4)", background: "rgba(201,169,110,0.1)",
                          color: "var(--gt-gold)", cursor: acting === item.id ? "not-allowed" : "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <Check size={12} /> Approve
                      </button>
                      <button
                        disabled={acting === item.id}
                        onClick={() => skip(item)}
                        style={{ ...btnBase, padding: "7px 10px" }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                  {isSent && <span style={{ color: "#22c55e", fontSize: 11, flexShrink: 0, marginTop: 2 }}>Sent {fmtDate(item.sentAt?.toString())}</span>}
                  {isSkipped && (
                    <span style={{ color: "var(--gt-muted)", fontSize: 11, flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={11} /> Skipped
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
          style={{ ...btnBase, opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
        <span style={{ color: "var(--gt-muted)", fontSize: 13 }}>Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)} disabled={items.length < 50}
          style={{ ...btnBase, opacity: items.length < 50 ? 0.4 : 1 }}>Next →</button>
      </div>
    </div>
  );
}
