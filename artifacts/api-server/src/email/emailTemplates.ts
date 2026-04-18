export interface EmailContext {
  contactName?: string;
  contractTitleOrNaicsArea?: string;
  naicsCode?: string;
  opportunityTitle?: string;
  noticeId?: string;
  deadline?: string;
  grantTitle?: string;
  grantId?: string;
  originalSubject?: string;
  senderName?: string;
}

export type TemplateType = "PRIME_OUTREACH" | "SUBCONTRACT_INQUIRY" | "GRANT_INQUIRY" | "FOLLOW_UP";

function fill(template: string, ctx: EmailContext): string {
  return template
    .replace(/\{contactName\}/g, ctx.contactName || "Contracting Officer")
    .replace(/\{contractTitleOrNaicsArea\}/g, ctx.contractTitleOrNaicsArea || "your recent contract")
    .replace(/\{naicsCode\}/g, ctx.naicsCode || "541611")
    .replace(/\{opportunityTitle\}/g, ctx.opportunityTitle || "this opportunity")
    .replace(/\{noticeId\}/g, ctx.noticeId || "N/A")
    .replace(/\{deadline\}/g, ctx.deadline || "upcoming")
    .replace(/\{grantTitle\}/g, ctx.grantTitle || "this grant opportunity")
    .replace(/\{grantId\}/g, ctx.grantId || "N/A")
    .replace(/\{originalSubject\}/g, ctx.originalSubject || "our previous message")
    .replace(/\{senderName\}/g, ctx.senderName || "Grey Taurus Contracting Team");
}

const TEMPLATES: Record<TemplateType, { subject: string; body: string }> = {
  PRIME_OUTREACH: {
    subject: "Subcontracting Inquiry — Grey Taurus LLC | CAGE 1LXN7 | NAICS {naicsCode}",
    body: `Hello {contactName},

I am reaching out on behalf of Grey Taurus LLC regarding subcontracting opportunities related to {contractTitleOrNaicsArea}.

Grey Taurus is a Florida-based small business registered in SAM.gov providing operations, logistics, and program support services.

UEI: FMJFQ6R7B7P8 | CAGE: 1LXN7
NAICS: 541611 | 541614 | 561110 | 561210 | 561990 | 236220

Capability statement available at greytaurus.com.

Would you be open to a brief conversation or capability review?

{senderName}
Grey Taurus LLC | admin@greytaurus.com | greytaurus.com | CAGE: 1LXN7`,
  },

  SUBCONTRACT_INQUIRY: {
    subject: "Capability Inquiry — {opportunityTitle} | Grey Taurus LLC",
    body: `Hello,

Grey Taurus LLC is interested in {opportunityTitle} (Notice ID: {noticeId}).

We provide operations, logistics, and program support services aligned with NAICS {naicsCode}.

UEI: FMJFQ6R7B7P8 | CAGE: 1LXN7
Capability statement: greytaurus.com

We would welcome teaming or subcontracting discussion ahead of the {deadline} deadline.

{senderName}
Grey Taurus LLC | admin@greytaurus.com | greytaurus.com | CAGE: 1LXN7`,
  },

  GRANT_INQUIRY: {
    subject: "Grant Inquiry — {grantTitle} | Grey Taurus LLC / Rising Promise",
    body: `Hello,

I am writing regarding {grantTitle} (ID: {grantId}).

Grey Taurus LLC and our nonprofit partner Rising Promise (TX) provide operations, logistics, and community program support aligned with this opportunity.

We would welcome discussion on eligibility and application requirements.

Grey Taurus LLC
UEI: FMJFQ6R7B7P8 | CAGE: 1LXN7
admin@greytaurus.com | greytaurus.com`,
  },

  FOLLOW_UP: {
    subject: "Following Up — Grey Taurus LLC | CAGE 1LXN7",
    body: `Hello {contactName},

Following up on my previous message regarding {originalSubject}.

Grey Taurus LLC remains interested in exploring opportunities with your organization.

Please let me know if you would like our capability statement.

Grey Taurus LLC | admin@greytaurus.com | greytaurus.com | CAGE: 1LXN7`,
  },
};

export function buildEmail(type: TemplateType, ctx: EmailContext): { subject: string; body: string } {
  const tmpl = TEMPLATES[type];
  return {
    subject: fill(tmpl.subject, ctx),
    body: fill(tmpl.body, ctx),
  };
}
