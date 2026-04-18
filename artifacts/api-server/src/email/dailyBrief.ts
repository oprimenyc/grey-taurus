import { db } from "@workspace/db";
import {
  opportunitiesTable,
  grantsTable,
  subcontractLeadsTable,
  redditIntelTable,
  qaFlagsTable,
  agentLogsTable,
} from "@workspace/db/schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import { sendHtmlBrief } from "./emailService.js";
import { logger } from "../lib/logger.js";

const CATEGORY_COLORS: Record<string, string> = {
  TEAMING_REQUEST: "#c9a96e",
  UNADVERTISED_OPPORTUNITY: "#22c55e",
  AGENCY_PAIN_POINT: "#f97316",
  COMPETITIVE_INTEL: "#3b82f6",
  MARKET_SIGNAL: "#8a95a3",
  UNCATEGORIZED: "#8a95a3",
};

function fmt(n: number | null | undefined): string {
  if (!n) return "N/A";
  return `$${n.toLocaleString()}`;
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export async function generateDailyBrief(gapNotes: string[]): Promise<void> {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const [opportunities, grants, subcontracts, redditPosts, qaFlags, lastLog] = await Promise.all([
    db.select().from(opportunitiesTable).orderBy(desc(opportunitiesTable.score)).limit(5),
    db.select().from(grantsTable).orderBy(desc(grantsTable.score)).limit(3),
    db.select().from(subcontractLeadsTable).orderBy(desc(subcontractLeadsTable.score)).limit(3),
    db.select().from(redditIntelTable).orderBy(desc(redditIntelTable.score)).limit(5),
    db.select().from(qaFlagsTable).where(eq(qaFlagsTable.resolved, false)),
    db.select().from(agentLogsTable).orderBy(desc(agentLogsTable.runAt)).limit(1),
  ]);

  const log = lastLog[0];
  const qaCount = qaFlags.length;

  const oppRows = opportunities
    .map(
      (o) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;">${o.title || "N/A"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;">${o.agency || "N/A"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;color:#c9a96e;font-weight:bold;">${o.score ?? 0}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;">${fmtDate(o.responseDeadline)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;">${o.naicsCode || "N/A"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;">${o.setAside || "Open"}</td>
      </tr>`,
    )
    .join("");

  const grantRows = grants
    .map(
      (g) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;">${g.title}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;">${g.agency || "N/A"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;">${fmtDate(g.deadline)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;">${fmt(g.amount)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;">${g.eligibleEntity || "greytaurus"}</td>
      </tr>`,
    )
    .join("");

  const subRows = subcontracts
    .map(
      (s) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;">${s.primeContractor}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;">${fmt(s.awardAmount)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;">${fmtDate(s.expiryDate)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;">${s.naicsCode || "N/A"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;">PRIME_OUTREACH</td>
      </tr>`,
    )
    .join("");

  const redditRows = redditPosts
    .map((r) => {
      const color = CATEGORY_COLORS[r.category || "UNCATEGORIZED"] ?? "#8a95a3";
      const bold = r.category === "TEAMING_REQUEST" || r.category === "UNADVERTISED_OPPORTUNITY";
      return `<tr style="${bold ? "font-weight:bold;" : ""}">
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;">
          <span style="background:${color};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;">${r.category}</span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;">r/${r.subreddit}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;">${r.title || ""}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;">${r.score ?? 0}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;"><a href="${r.url}" style="color:#c9a96e;">View</a></td>
      </tr>`;
    })
    .join("");

  const qaColor = qaCount >= 3 ? "#ef4444" : qaCount > 0 ? "#f59e0b" : "#22c55e";
  const gapSection = gapNotes.length > 0
    ? `<ul>${gapNotes.map((n) => `<li>${n}</li>`).join("")}</ul>`
    : "<p>No gaps detected.</p>";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Grey Taurus Daily Brief</title></head>
<body style="background:#0e0e0e;color:#e0e0e0;font-family:Arial,sans-serif;padding:24px;max-width:900px;margin:0 auto;">

<div style="border-bottom:2px solid #c9a96e;padding-bottom:16px;margin-bottom:24px;">
  <h1 style="color:#c9a96e;margin:0;">Grey Taurus Daily Brief</h1>
  <p style="color:#8a95a3;margin:4px 0 0;">${dateStr}</p>
</div>

<h2 style="color:#c9a96e;border-left:3px solid #c9a96e;padding-left:12px;">1. Top 5 Opportunities</h2>
<table style="width:100%;border-collapse:collapse;background:#1a1a1a;border-radius:8px;overflow:hidden;">
  <thead><tr style="background:#1f1f1f;">
    <th style="padding:10px 12px;text-align:left;color:#8a95a3;">Title</th>
    <th style="padding:10px 12px;text-align:left;color:#8a95a3;">Agency</th>
    <th style="padding:10px 12px;text-align:left;color:#8a95a3;">Score</th>
    <th style="padding:10px 12px;text-align:left;color:#8a95a3;">Deadline</th>
    <th style="padding:10px 12px;text-align:left;color:#8a95a3;">NAICS</th>
    <th style="padding:10px 12px;text-align:left;color:#8a95a3;">Set-Aside</th>
  </tr></thead>
  <tbody>${oppRows || "<tr><td colspan='6' style='padding:12px;color:#8a95a3;'>No opportunities found</td></tr>"}</tbody>
</table>

<h2 style="color:#c9a96e;border-left:3px solid #c9a96e;padding-left:12px;margin-top:32px;">2. Fast Grants Open Now</h2>
<table style="width:100%;border-collapse:collapse;background:#1a1a1a;border-radius:8px;overflow:hidden;">
  <thead><tr style="background:#1f1f1f;">
    <th style="padding:10px 12px;text-align:left;color:#8a95a3;">Title</th>
    <th style="padding:10px 12px;text-align:left;color:#8a95a3;">Agency</th>
    <th style="padding:10px 12px;text-align:left;color:#8a95a3;">Close Date</th>
    <th style="padding:10px 12px;text-align:left;color:#8a95a3;">Amount</th>
    <th style="padding:10px 12px;text-align:left;color:#8a95a3;">Eligible</th>
  </tr></thead>
  <tbody>${grantRows || "<tr><td colspan='5' style='padding:12px;color:#8a95a3;'>No grants found</td></tr>"}</tbody>
</table>

<h2 style="color:#c9a96e;border-left:3px solid #c9a96e;padding-left:12px;margin-top:32px;">3. Top Subcontract Leads</h2>
<table style="width:100%;border-collapse:collapse;background:#1a1a1a;border-radius:8px;overflow:hidden;">
  <thead><tr style="background:#1f1f1f;">
    <th style="padding:10px 12px;text-align:left;color:#8a95a3;">Prime Contractor</th>
    <th style="padding:10px 12px;text-align:left;color:#8a95a3;">Contract Value</th>
    <th style="padding:10px 12px;text-align:left;color:#8a95a3;">Expiry</th>
    <th style="padding:10px 12px;text-align:left;color:#8a95a3;">NAICS</th>
    <th style="padding:10px 12px;text-align:left;color:#8a95a3;">Template</th>
  </tr></thead>
  <tbody>${subRows || "<tr><td colspan='5' style='padding:12px;color:#8a95a3;'>No leads found</td></tr>"}</tbody>
</table>

<h2 style="color:#c9a96e;border-left:3px solid #c9a96e;padding-left:12px;margin-top:32px;">4. Reddit Intelligence</h2>
<p style="color:#8a95a3;font-size:12px;font-style:italic;">Sourced from public Reddit posts — unverified, review before acting.</p>
<table style="width:100%;border-collapse:collapse;background:#1a1a1a;border-radius:8px;overflow:hidden;">
  <thead><tr style="background:#1f1f1f;">
    <th style="padding:10px 12px;text-align:left;color:#8a95a3;">Category</th>
    <th style="padding:10px 12px;text-align:left;color:#8a95a3;">Subreddit</th>
    <th style="padding:10px 12px;text-align:left;color:#8a95a3;">Title</th>
    <th style="padding:10px 12px;text-align:left;color:#8a95a3;">Score</th>
    <th style="padding:10px 12px;text-align:left;color:#8a95a3;">Link</th>
  </tr></thead>
  <tbody>${redditRows || "<tr><td colspan='5' style='padding:12px;color:#8a95a3;'>No intel today</td></tr>"}</tbody>
</table>

<h2 style="color:#c9a96e;border-left:3px solid #c9a96e;padding-left:12px;margin-top:32px;">5. Daily Action Plan</h2>
<div style="background:#1a1a1a;border-radius:8px;padding:16px;">
  <p>☐ Contact 20 primes (emails queued — review at dashboard)</p>
  <p>☐ Submit 5 quotes/capability responses</p>
  <p>☐ Apply to 3 grants</p>
  <p>☐ Follow up with 10 contacts</p>
</div>

<h2 style="color:#c9a96e;border-left:3px solid #c9a96e;padding-left:12px;margin-top:32px;">6. Pipeline Summary</h2>
<div style="background:#1a1a1a;border-radius:8px;padding:16px;display:flex;gap:24px;flex-wrap:wrap;">
  <div><span style="color:#8a95a3;">Queued:</span> <strong>${opportunities.filter((o) => o.status === "queued").length}</strong></div>
  <div><span style="color:#8a95a3;">Contacted:</span> <strong>${opportunities.filter((o) => o.status === "contacted").length}</strong></div>
  <div><span style="color:#8a95a3;">Submitted:</span> <strong>${opportunities.filter((o) => o.status === "submitted").length}</strong></div>
  <div><span style="color:#8a95a3;">Awarded:</span> <strong>${opportunities.filter((o) => o.status === "awarded").length}</strong></div>
</div>

<h2 style="color:#c9a96e;border-left:3px solid #c9a96e;padding-left:12px;margin-top:32px;">7. QA Flags</h2>
<div style="background:#1a1a1a;border-radius:8px;padding:16px;">
  <p><span style="color:${qaColor};font-weight:bold;">${qaCount} unresolved flag${qaCount !== 1 ? "s" : ""}</span></p>
  <p>Review at: <a href="https://hub.greytaurus.com" style="color:#c9a96e;">hub.greytaurus.com</a></p>
  ${gapSection}
</div>

${log ? `<div style="margin-top:24px;color:#8a95a3;font-size:12px;">
  Last run: ${fmtDate(log.runAt)} | Duration: ${log.durationMs ?? 0}ms |
  Opps: ${log.opportunitiesFound ?? 0} | Grants: ${log.grantsFound ?? 0} |
  Subs: ${log.subcontractsFound ?? 0} | Reddit: ${log.redditPostsFound ?? 0}
</div>` : ""}

<div style="margin-top:32px;border-top:1px solid #2a2a2a;padding-top:16px;color:#8a95a3;font-size:12px;">
  Grey Taurus LLC | UEI: FMJFQ6R7B7P8 | CAGE: 1LXN7 | admin@greytaurus.com | greytaurus.com
</div>

</body>
</html>`;

  const recipient = process.env["BRIEF_RECIPIENT"] || "admin@greytaurus.com";
  await sendHtmlBrief({
    to: recipient,
    subject: `Grey Taurus Daily Brief — ${dateStr}`,
    html,
  });

  logger.info({ recipient, dateStr }, "Daily brief generated and sent");
}
