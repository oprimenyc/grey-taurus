import { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import { api, type PipelineItem } from "../lib/api.ts";
import { toast } from "../components/toast.ts";
import { ScorePill } from "./Opportunities.tsx";

function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const COLUMNS: { stage: string; label: string; color: string }[] = [
  { stage: "identified", label: "Opportunities Found", color: "#8a95a3" },
  { stage: "qualifying", label: "Evaluating", color: "#f59e0b" },
  { stage: "pursuing", label: "Partner Contact", color: "#3b82f6" },
  { stage: "proposal", label: "Proposal Draft", color: "#a78bfa" },
  { stage: "submitted", label: "Submitted", color: "#60a5fa" },
  { stage: "follow-up", label: "Follow-Up", color: "#c9a96e" },
  { stage: "awarded", label: "Awarded", color: "#22c55e" },
];

const STAGE_OPTS = COLUMNS.map((c) => ({ value: c.stage, label: c.label }));

function KanbanCard({ item, onStageChange, onClick }: {
  item: PipelineItem;
  onStageChange: (id: number, stage: string) => void;
  onClick: () => void;
}) {
  const col = COLUMNS.find((c) => c.stage === (item.stage || "identified")) ?? COLUMNS[0];
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--gt-surface)",
        border: "1px solid var(--gt-border)",
        borderRadius: 8,
        padding: 12,
        cursor: "pointer",
        transition: "border-color 0.15s var(--gt-ease)",
        marginBottom: 8,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,169,110,0.25)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--gt-border)"; }}
    >
      <div style={{ color: "var(--gt-text)", fontSize: 12, fontWeight: 500, lineHeight: 1.4, marginBottom: 8 }}>
        {item.title}
      </div>
      <div style={{ color: "var(--gt-muted)", fontSize: 11, marginBottom: 8 }}>{item.agency || "—"}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <ScorePill score={item.score} />
          {item.naicsCode && (
            <span style={{ background: "#3b82f618", color: "#3b82f6", padding: "1px 5px", borderRadius: 3, fontSize: 9, fontWeight: 600, border: "1px solid #3b82f633" }}>
              {item.naicsCode}
            </span>
          )}
        </div>
        <span style={{ color: "var(--gt-muted)", fontSize: 10 }}>{fmtDate(item.responseDeadline?.toString())}</span>
      </div>
      <div style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
        <select
          value={item.stage || "identified"}
          onChange={(e) => onStageChange(item.id, e.target.value)}
          style={{
            width: "100%",
            padding: "4px 6px",
            background: "var(--gt-card)",
            border: `1px solid ${col.color}44`,
            color: col.color,
            borderRadius: 5,
            fontSize: 10,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {STAGE_OPTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
    </div>
  );
}

export default function Pipeline() {
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PipelineItem | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => { load(); }, []);

  function load() {
    setLoading(true);
    setError(false);
    api.pipeline.list(1, 200)
      .then((r) => setItems(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  async function updateStage(id: number, stage: string) {
    const prev = items;
    setItems((all) => all.map((i) => i.id === id ? { ...i, stage } : i));
    try {
      await api.pipeline.updateStage(id, stage);
      toast("Stage updated", "success");
    } catch {
      setItems(prev);
      toast("Failed to update stage", "error");
    }
  }

  const grouped = Object.fromEntries(COLUMNS.map((c) => [c.stage, items.filter((i) => (i.stage || "identified") === c.stage)]));

  return (
    <div className="gt-fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: "var(--gt-text)", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Pipeline</h1>
        <p style={{ color: "var(--gt-muted)", fontSize: 13 }}>Opportunities tracked through pursuit stages · {items.length} total</p>
      </div>

      {loading ? (
        <div style={{ display: "flex", gap: 12 }}>
          {COLUMNS.map((c) => (
            <div key={c.stage} style={{ flex: 1, minWidth: 160, background: "var(--gt-card)", borderRadius: 10, padding: 12, height: 200 }} className="gt-pulse" />
          ))}
        </div>
      ) : error ? (
        <div style={{ background: "var(--gt-card)", border: "1px solid #ef444433", borderRadius: 10, padding: 40, textAlign: "center" }}>
          <p style={{ color: "#ef4444", marginBottom: 12 }}>Failed to load pipeline</p>
          <button onClick={load} style={{ padding: "7px 16px", background: "var(--gt-surface)", border: "1px solid #ef444444", color: "#ef4444", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Retry</button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 16, alignItems: "flex-start" }}>
          {COLUMNS.map((col) => {
            const colItems = grouped[col.stage] ?? [];
            return (
              <div key={col.stage} style={{ minWidth: 200, flex: "0 0 200px" }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                  padding: "8px 10px",
                  background: `${col.color}12`,
                  borderRadius: 7,
                  borderLeft: `3px solid ${col.color}`,
                }}>
                  <span style={{ color: col.color, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{col.label}</span>
                  <span style={{ background: col.color, color: "#0f1117", borderRadius: 999, fontSize: 10, fontWeight: 700, width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {colItems.length}
                  </span>
                </div>
                <div>
                  {colItems.length === 0 ? (
                    <div style={{ border: "1px dashed var(--gt-border)", borderRadius: 8, padding: "18px 12px", textAlign: "center" }}>
                      <div style={{ color: "var(--gt-muted)", fontSize: 11, marginBottom: 8 }}>No items</div>
                      <button style={{ display: "flex", alignItems: "center", gap: 4, margin: "0 auto", background: "none", border: "1px solid var(--gt-border)", color: "var(--gt-muted)", borderRadius: 5, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>
                        <Plus size={11} /> Add
                      </button>
                    </div>
                  ) : (
                    colItems.map((item) => (
                      <KanbanCard
                        key={item.id}
                        item={item}
                        onStageChange={updateStage}
                        onClick={() => setSelected(item)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex" }} onClick={() => setSelected(null)}>
          <div style={{ flex: 1, background: "rgba(0,0,0,0.5)" }} />
          <div
            className="gt-slide-in"
            style={{ width: 400, background: "var(--gt-surface)", borderLeft: "1px solid var(--gt-border)", height: "100%", overflowY: "auto", padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <h2 style={{ color: "var(--gt-text)", fontSize: 15, fontWeight: 700, lineHeight: 1.4, flex: 1, paddingRight: 12 }}>{selected.title}</h2>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "var(--gt-muted)", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              <ScorePill score={selected.score} />
              {selected.naicsCode && (
                <span style={{ background: "#3b82f618", color: "#3b82f6", padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 600, border: "1px solid #3b82f633" }}>NAICS {selected.naicsCode}</span>
              )}
            </div>
            {[
              ["Agency", selected.agency],
              ["Stage", COLUMNS.find((c) => c.stage === selected.stage)?.label ?? selected.stage],
              ["Deadline", fmtDate(selected.responseDeadline?.toString())],
              ["Assigned To", selected.assignedTo],
              ["Added", fmtDate(selected.addedDate?.toString())],
            ].map(([label, val]) => val && (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ color: "var(--gt-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{label}</div>
                <div style={{ color: "var(--gt-text)", fontSize: 13 }}>{val}</div>
              </div>
            ))}
            {selected.notes && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: "var(--gt-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Notes</div>
                <div style={{ color: "var(--gt-text)", fontSize: 13, background: "var(--gt-card)", borderRadius: 7, padding: 12 }}>{selected.notes}</div>
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <div style={{ color: "var(--gt-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Move Stage</div>
              <select
                value={selected.stage || "identified"}
                onChange={async (e) => {
                  const stage = e.target.value;
                  await updateStage(selected.id, stage);
                  setSelected({ ...selected, stage });
                }}
                style={{ width: "100%", padding: "8px 10px", background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 6, color: "var(--gt-text)", fontSize: 13 }}
              >
                {STAGE_OPTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
