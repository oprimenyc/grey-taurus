import { useEffect, useState } from "react";
import { Eye, EyeOff, Save } from "lucide-react";
import { api, type Setting } from "../lib/api.ts";
import { toast } from "../components/toast.ts";

interface SettingField { key: string; label: string; description?: string; secret?: boolean; defaultValue?: string }

const SECTIONS: { title: string; fields: SettingField[] }[] = [
  {
    title: "Company Info",
    fields: [
      { key: "company_name", label: "Company Name", defaultValue: "Grey Taurus LLC" },
      { key: "company_uei", label: "UEI", defaultValue: "FMJFQ6R7B7P8" },
      { key: "company_cage", label: "CAGE Code", defaultValue: "1LXN7" },
      { key: "company_email", label: "Email", defaultValue: "admin@greytaurus.com" },
      { key: "company_website", label: "Website", defaultValue: "greytaurus.com" },
    ],
  },
  {
    title: "API Keys",
    fields: [
      { key: "sam_api_key", label: "SAM.gov API Key", description: "Required for opportunity scanning", secret: true },
      { key: "anthropic_api_key", label: "Anthropic API Key", description: "Required for AI agents", secret: true },
      { key: "sendgrid_api_key", label: "SendGrid API Key", description: "Required for email sending", secret: true },
    ],
  },
  {
    title: "Email Config",
    fields: [
      { key: "email_enabled", label: "Email Enabled", description: "Set to 'true' to enable automated email sends", defaultValue: "false" },
      { key: "email_from", label: "From Address", description: "Sender email address", defaultValue: "outreach@greytaurus.com" },
      { key: "brief_schedule", label: "Brief Schedule", description: "Cron expression for daily brief emails (e.g. 0 8 * * *)", defaultValue: "0 8 * * *" },
    ],
  },
  {
    title: "Notification Preferences",
    fields: [
      { key: "scan_schedule", label: "Scan Schedule", description: "Cron expression for automatic scans (e.g. 0 6 * * *)", defaultValue: "0 6 * * *" },
      { key: "min_opportunity_score", label: "Minimum Opportunity Score", description: "Min score to include in daily brief (0–100)", defaultValue: "50" },
      { key: "naics_filter", label: "NAICS Codes", description: "Comma-separated NAICS codes to prioritize", defaultValue: "" },
    ],
  },
];

function SettingRow({ field, value, onChange, onSave, saving, saved }: {
  field: SettingField;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  const [show, setShow] = useState(false);
  const type = field.secret && !show ? "password" : "text";

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, padding: "14px 0", borderBottom: "1px solid var(--gt-border)" }}>
      <div style={{ flex: 1 }}>
        <label style={{ display: "block", color: "var(--gt-text)", fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{field.label}</label>
        {field.description && <div style={{ color: "var(--gt-muted)", fontSize: 11, marginBottom: 8 }}>{field.description}</div>}
        <div style={{ position: "relative" }}>
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.defaultValue ? `Default: ${field.defaultValue}` : "(not set)"}
            style={{
              width: "100%",
              padding: "8px 12px",
              paddingRight: field.secret ? 36 : 12,
              background: "var(--gt-bg)",
              border: "1px solid var(--gt-border)",
              borderRadius: 6,
              color: "var(--gt-text)",
              fontSize: 13,
              fontFamily: field.secret ? "monospace" : "inherit",
            }}
          />
          {field.secret && (
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--gt-muted)", cursor: "pointer", padding: 2 }}
            >
              {show ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          )}
        </div>
      </div>
      <button
        onClick={onSave}
        disabled={saving}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 16px",
          background: saved ? "#0f2d1a" : "var(--gt-gold)",
          color: saved ? "#22c55e" : "#0f1117",
          border: saved ? "1px solid #22c55e44" : "none",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 700,
          cursor: saving ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
          transition: "all 0.2s",
          marginBottom: 2,
        }}
      >
        <Save size={12} />
        {saved ? "Saved" : saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    api.settings.list().then((r) => {
      setSettings(r.data);
      const vals: Record<string, string> = {};
      for (const s of r.data) vals[s.key] = s.value ?? "";
      // Pre-fill company defaults if not set
      for (const section of SECTIONS) {
        for (const field of section.fields) {
          if (!vals[field.key] && field.defaultValue) vals[field.key] = field.defaultValue;
        }
      }
      setValues(vals);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function save(key: string) {
    setSaving(key);
    try {
      await api.settings.set(key, values[key] ?? "");
      setSettings((prev) => prev.map((s) => s.key === key ? { ...s, value: values[key] ?? "" } : s));
      setSaved(key);
      toast(`${key} saved`, "success");
      setTimeout(() => setSaved((s) => s === key ? null : s), 2500);
    } catch {
      toast("Failed to save setting", "error");
    }
    setSaving(null);
  }

  if (loading) {
    return (
      <div className="gt-fade-in">
        <h1 style={{ color: "var(--gt-text)", fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Settings</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 160, background: "var(--gt-card)", borderRadius: 10 }} className="gt-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="gt-fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: "var(--gt-text)", fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Settings</h1>
        <p style={{ color: "var(--gt-muted)", fontSize: 13 }}>Platform configuration stored in database</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>
        {SECTIONS.map((section) => (
          <div
            key={section.title}
            style={{ background: "var(--gt-card)", border: "1px solid var(--gt-border)", borderRadius: 10, overflow: "hidden" }}
          >
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--gt-border)", background: "var(--gt-surface)" }}>
              <h2 style={{ color: "var(--gt-text)", fontSize: 14, fontWeight: 700 }}>{section.title}</h2>
            </div>
            <div style={{ padding: "0 20px" }}>
              {section.fields.map((field) => (
                <SettingRow
                  key={field.key}
                  field={field}
                  value={values[field.key] ?? ""}
                  onChange={(v) => setValues((prev) => ({ ...prev, [field.key]: v }))}
                  onSave={() => save(field.key)}
                  saving={saving === field.key}
                  saved={saved === field.key}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
