import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Grant, type SubcontractLead, type RedditPost, type QaFlag } from "../lib/api.ts";

const CATEGORY_COLORS: Record<string, string> = {
  TEAMING_REQUEST: "#c9a96e",
  UNADVERTISED_OPPORTUNITY: "#22c55e",
  AGENCY_PAIN_POINT: "#f97316",
  COMPETITIVE_INTEL: "#3b82f6",
  MARKET_SIGNAL: "#8a95a3",
  UNCATEGORIZED: "#555",
};

function Card({ title, linkTo, linkLabel, children }: {
  title: string;
  linkTo?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: "#1a1a1a",
      border: "1px solid #2a2a2a",
      borderRadius: 10,
      padding: 20,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, color: "#e0e0e0", fontSize: 15, fontWeight: 600 }}>{title}</h3>
        {linkTo && (
          <Link to={linkTo} style={{ color: "#c9a96e", fontSize: 12 }}>{linkLabel || "View all →"}</Link>
        )}
      </div>
      {children}
    </div>
  );
}

function fmtMoney(n: number | null | undefined): string {
  if (!n) return "N/A";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Dashboard() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [subs, setSubs] = useState<SubcontractLead[]>([]);
  const [reddit, setReddit] = useState<RedditPost[]>([]);
  const [qaFlags, setQaFlags] = useState<QaFlag[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState("");

  useEffect(() => {
    api.grants.list(1, 3).then((r) => setGrants(r.data)).catch(() => {});
    api.subcontracts.list(1, 3).then((r) => setSubs(r.data)).catch(() => {});
    api.reddit.list(1, 5).then((r) => setReddit(r.data)).catch(() => {});
    api.qaFlags.list().then((r) => setQaFlags(r.data)).catch(() => {});
  }, []);

  const qaCount = qaFlags.length;
  const qaColor = qaCount >= 3 ? "#ef4444" : qaCount > 0 ? "#f59e0b" : "#22c55e";

  async function triggerScan() {
    setScanning(true);
    setScanMsg("");
    try {
      await api.scan.run();
      setScanMsg("Scan triggered — check back in a few minutes");
    } catch {
      setScanMsg("Failed to trigger scan");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, color: "#e0e0e0", fontSize: 22, fontWeight: 700 }}>Dashboard</h1>
          <p style={{ margin: "4px 0 0", color: "#8a95a3", fontSize: 13 }}>
            Grey Taurus LLC · UEI: FMJFQ6R7B7P8 · CAGE: 1LXN7
          </p>
        </div>
        <div>
          <button
            onClick={triggerScan}
            disabled={scanning}
            style={{
              padding: "8px 16px",
              background: scanning ? "#444" : "#c9a96e",
              color: "#0e0e0e",
              border: "none",
              borderRadius: 6,
              fontWeight: 700,
              fontSize: 13,
              cursor: scanning ? "not-allowed" : "pointer",
            }}
          >
            {scanning ? "Scanning…" : "Run Full Scan"}
          </button>
          {scanMsg && <div style={{ color: "#8a95a3", fontSize: 12, marginTop: 4 }}>{scanMsg}</div>}
        </div>
      </div>

      {/* QA Status Banner */}
      <div style={{
        background: "#1a1a1a",
        border: `1px solid ${qaColor}44`,
        borderRadius: 8,
        padding: "12px 16px",
        marginBottom: 24,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <span style={{
          background: qaColor,
          color: "#fff",
          borderRadius: 999,
          padding: "2px 10px",
          fontSize: 13,
          fontWeight: 700,
        }}>
          {qaCount}
        </span>
        <span style={{ color: "#e0e0e0", fontSize: 14 }}>
          {qaCount === 0
            ? "No unresolved QA flags"
            : `${qaCount} unresolved QA flag${qaCount !== 1 ? "s" : ""} — `}
          {qaCount > 0 && (
            <>
              <Link to="/proposals" style={{ color: qaColor }}>Review proposals</Link>
              {" · "}
              <Link to="/outreach" style={{ color: qaColor }}>Review outreach</Link>
            </>
          )}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* Grants Widget */}
        <Card title="Fast Grants Open Now" linkTo="/grants">
          {grants.length === 0 ? (
            <p style={{ color: "#8a95a3", fontSize: 13 }}>No grants loaded. Run a scan to populate.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {grants.map((g) => (
                  <tr key={g.id} style={{ borderBottom: "1px solid #2a2a2a" }}>
                    <td style={{ padding: "8px 0", color: "#e0e0e0", fontSize: 13 }}>
                      <div style={{ fontWeight: 500 }}>{g.title}</div>
                      <div style={{ color: "#8a95a3", fontSize: 11 }}>{g.agency}</div>
                    </td>
                    <td style={{ padding: "8px 0", textAlign: "right", fontSize: 12 }}>
                      <div style={{ color: "#c9a96e" }}>{fmtMoney(g.amount)}</div>
                      <div style={{ color: "#8a95a3" }}>{fmtDate(g.deadline)}</div>
                    </td>
                    <td style={{ padding: "8px 0 8px 8px", fontSize: 11 }}>
                      <span style={{
                        background: g.eligibleEntity === "risingpromise" ? "#1e3a1e" : "#1a2a3a",
                        color: g.eligibleEntity === "risingpromise" ? "#22c55e" : "#60a5fa",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}>
                        {g.eligibleEntity || "gt"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Subcontracts Widget */}
        <Card title="Top Subcontract Leads" linkTo="/subcontracts">
          {subs.length === 0 ? (
            <p style={{ color: "#8a95a3", fontSize: 13 }}>No leads loaded. Run a scan to populate.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid #2a2a2a" }}>
                    <td style={{ padding: "8px 0", color: "#e0e0e0", fontSize: 13 }}>
                      <div style={{ fontWeight: 500 }}>{s.primeContractor}</div>
                      <div style={{ color: "#8a95a3", fontSize: 11 }}>{s.agency} · {s.naicsCode}</div>
                    </td>
                    <td style={{ padding: "8px 0", textAlign: "right", fontSize: 12 }}>
                      <div style={{ color: "#c9a96e" }}>{fmtMoney(s.awardAmount)}</div>
                      <div style={{ color: "#8a95a3" }}>exp: {fmtDate(s.expiryDate)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* Reddit Intel Widget */}
      <Card title="Reddit Intelligence" linkTo="/reddit-intel" linkLabel="View all →">
        <p style={{ color: "#8a95a3", fontSize: 11, margin: "0 0 10px", fontStyle: "italic" }}>
          Public Reddit posts. Unverified.
        </p>
        {reddit.length === 0 ? (
          <p style={{ color: "#8a95a3", fontSize: 13 }}>No intel loaded. Run a scan to populate.</p>
        ) : (
          <div>
            {reddit.map((r) => {
              const color = CATEGORY_COLORS[r.category || "UNCATEGORIZED"] ?? "#555";
              const isBold = r.category === "TEAMING_REQUEST" || r.category === "UNADVERTISED_OPPORTUNITY";
              return (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "7px 0",
                    borderBottom: "1px solid #222",
                    fontWeight: isBold ? 600 : 400,
                  }}
                >
                  <span style={{
                    background: color,
                    color: "#fff",
                    fontSize: 10,
                    padding: "2px 7px",
                    borderRadius: 4,
                    whiteSpace: "nowrap",
                    minWidth: 90,
                    textAlign: "center",
                  }}>
                    {r.category?.replace(/_/g, " ")}
                  </span>
                  <span style={{ color: "#8a95a3", fontSize: 11, whiteSpace: "nowrap" }}>
                    r/{r.subreddit}
                  </span>
                  <span style={{ color: "#e0e0e0", fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.title}
                  </span>
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noreferrer" style={{ color: "#c9a96e", fontSize: 11 }}>
                      ↗
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
