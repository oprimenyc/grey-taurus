import { useEffect, useState } from "react";
import { api, type Setting } from "../lib/api.ts";

const SETTING_DESCRIPTIONS: Record<string, string> = {
  scan_schedule: "Cron expression for automatic scans (e.g. '0 8 * * *' = 8am daily)",
  brief_schedule: "Cron expression for daily brief emails",
  min_opportunity_score: "Minimum score threshold to include in daily brief",
  naics_filter: "Comma-separated NAICS codes to prioritize",
  email_enabled: "Set to 'true' to enable automated email sends",
};

export default function Settings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.settings
      .list()
      .then((r) => {
        setSettings(r.data);
        const vals: Record<string, string> = {};
        for (const s of r.data) {
          vals[s.key] = s.value ?? "";
        }
        setEditing(vals);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function save(key: string) {
    setSaving(key);
    try {
      await api.settings.set(key, editing[key] ?? "");
      setSettings((prev) =>
        prev.map((s) => (s.key === key ? { ...s, value: editing[key] ?? "" } : s))
      );
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    } catch {}
    setSaving(null);
  }

  const allKeys = Array.from(
    new Set([...settings.map((s) => s.key), ...Object.keys(SETTING_DESCRIPTIONS)])
  );

  return (
    <div>
      <h1 style={{ margin: "0 0 4px", color: "#e0e0e0", fontSize: 22, fontWeight: 700 }}>Settings</h1>
      <p style={{ margin: "0 0 24px", color: "#8a95a3", fontSize: 13 }}>
        Platform configuration stored in the database
      </p>

      {loading ? (
        <p style={{ color: "#8a95a3" }}>Loading…</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {allKeys.map((key) => (
            <div key={key} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#c9a96e", fontSize: 13, fontFamily: "monospace", fontWeight: 600, marginBottom: 4 }}>
                    {key}
                  </div>
                  {SETTING_DESCRIPTIONS[key] && (
                    <div style={{ color: "#8a95a3", fontSize: 11, marginBottom: 10 }}>
                      {SETTING_DESCRIPTIONS[key]}
                    </div>
                  )}
                  <input
                    type="text"
                    value={editing[key] ?? ""}
                    onChange={(e) => setEditing((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder="(not set)"
                    style={{
                      width: "100%",
                      background: "#111",
                      border: "1px solid #2a2a2a",
                      color: "#e0e0e0",
                      borderRadius: 4,
                      padding: "6px 10px",
                      fontSize: 13,
                      fontFamily: "monospace",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <button
                  onClick={() => save(key)}
                  disabled={saving === key}
                  style={{
                    marginTop: 26,
                    padding: "6px 16px",
                    background: saved === key ? "#1e3a1e" : "#c9a96e",
                    color: saved === key ? "#22c55e" : "#111",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: saving === key ? "not-allowed" : "pointer",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {saved === key ? "Saved ✓" : saving === key ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
