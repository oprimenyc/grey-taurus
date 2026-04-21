const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
    logout: () => request("/auth/logout", { method: "POST" }),
    session: () => request<{ authenticated: boolean; username?: string }>("/auth/session"),
  },
  grants: {
    list: (page = 1, limit = 20) => request<{ data: Grant[]; page: number }>(`/grants?page=${page}&limit=${limit}`),
  },
  subcontracts: {
    list: (page = 1, limit = 20) => request<{ data: SubcontractLead[] }>(`/subcontracts?page=${page}&limit=${limit}`),
  },
  reddit: {
    list: (page = 1, limit = 20) => request<{ data: RedditPost[] }>(`/reddit-intel?page=${page}&limit=${limit}`),
    updateAction: (id: number, actionTaken: string) =>
      request(`/reddit-intel/${id}/action`, { method: "PUT", body: JSON.stringify({ actionTaken }) }),
  },
  qaFlags: {
    list: () => request<{ data: QaFlag[] }>("/qa-flags"),
    resolve: (id: number) => request(`/qa-flags/${id}/resolve`, { method: "PUT" }),
  },
  opportunities: {
    list: (page = 1, limit = 20) => request<{ data: Opportunity[]; page: number }>(`/opportunities?page=${page}&limit=${limit}`),
    updateStatus: (id: number, status: string) =>
      request(`/opportunities/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  },
  pipeline: {
    list: (page = 1, limit = 100) => request<{ data: PipelineItem[]; page: number }>(`/pipeline?page=${page}&limit=${limit}`),
    updateStage: (id: number, stage: string) =>
      request(`/pipeline/${id}/stage`, { method: "PUT", body: JSON.stringify({ stage }) }),
    add: (data: { opportunityId?: number; title: string; agency?: string; score?: number; naicsCode?: string; responseDeadline?: string }) =>
      request<{ ok: boolean; data: PipelineItem }>("/pipeline", { method: "POST", body: JSON.stringify(data) }),
  },
  proposals: {
    list: (page = 1, limit = 20) => request<{ data: Proposal[]; page: number }>(`/proposals?page=${page}&limit=${limit}`),
    updateStatus: (id: number, status: string) =>
      request(`/proposals/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
    updateContent: (id: number, content: string) =>
      request(`/proposals/${id}/content`, { method: "PUT", body: JSON.stringify({ content }) }),
  },
  outreach: {
    list: (page = 1, limit = 20) => request<{ data: OutreachItem[]; page: number }>(`/outreach?page=${page}&limit=${limit}`),
    updateStatus: (id: number, status: string) =>
      request(`/outreach/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  },
  agents: {
    runs: (limit = 50) => request<{ data: AgentRun[] }>(`/agents/runs?limit=${limit}`),
    logs: (limit = 50) => request<{ data: AgentLog[] }>(`/agents/logs?limit=${limit}`),
    run: (agentName: string) =>
      request<{ ok: boolean; agentName: string; message: string }>(`/agents/run/${agentName}`, { method: "POST" }),
  },
  settings: {
    list: () => request<{ data: Setting[] }>("/settings"),
    set: (key: string, value: string) =>
      request(`/settings/${encodeURIComponent(key)}`, { method: "PUT", body: JSON.stringify({ value }) }),
  },
  scan: {
    run: () => request("/scan/run", { method: "POST" }),
  },
  email: {
    send: (payload: { to: string; subject: string; body: string; opportunityRef?: string }) =>
      request("/email/send", { method: "POST", body: JSON.stringify(payload) }),
  },
};

export interface Grant {
  id: number;
  grantId: string;
  title: string;
  agency: string | null;
  amount: number | null;
  deadline: string | null;
  score: number | null;
  status: string | null;
  eligibleEntity: string | null;
  description?: string | null;
  addedDate: string | null;
}

export interface SubcontractLead {
  id: number;
  primeContractor: string;
  contractTitle: string | null;
  awardAmount: number | null;
  agency: string | null;
  naicsCode: string | null;
  expiryDate: string | null;
  outreachStatus: string | null;
  score: number | null;
}

export interface RedditPost {
  id: number;
  postId: string;
  subreddit: string | null;
  title: string | null;
  category: string | null;
  score: number | null;
  redditScore: number | null;
  numComments: number | null;
  url: string | null;
  actionTaken: string | null;
  createdAt: string | null;
}

export interface QaFlag {
  id: number;
  entityType: string;
  entityId: number;
  flagType: string;
  flagDetail: string | null;
  resolved: boolean | null;
  createdAt: string | null;
}

export interface Opportunity {
  id: number;
  noticeId: string;
  title: string | null;
  agency: string | null;
  postedDate: Date | null;
  responseDeadline: Date | null;
  naicsCode: string | null;
  type: string | null;
  description: string | null;
  setAside: string | null;
  placeOfPerformance: string | null;
  score: number | null;
  source: string | null;
  status: string | null;
  addedDate: Date | null;
}

export interface PipelineItem {
  id: number;
  opportunityId: number | null;
  title: string;
  agency: string | null;
  stage: string | null;
  score: number | null;
  naicsCode: string | null;
  responseDeadline: Date | null;
  assignedTo: string | null;
  notes: string | null;
  addedDate: Date | null;
  updatedAt: Date | null;
}

export interface Proposal {
  id: number;
  opportunityId: number | null;
  title: string;
  agency: string | null;
  status: string | null;
  content: string | null;
  qaScore: number | null;
  qaFeedback: string | null;
  submittedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface OutreachItem {
  id: number;
  targetName: string | null;
  targetEmail: string | null;
  targetOrg: string | null;
  entityType: string | null;
  subject: string | null;
  body: string | null;
  status: string | null;
  qaScore: number | null;
  qaFeedback: string | null;
  linkedOpportunityId: number | null;
  sentAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface AgentRun {
  id: number;
  agentName: string;
  status: string;
  input: string | null;
  output: string | null;
  errorMessage: string | null;
  durationMs: number | null;
  triggeredBy: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface AgentLog {
  id: number;
  agentName: string;
  runAt: Date | null;
  status: string;
  opportunitiesFound: number | null;
  grantsFound: number | null;
  subcontractsFound: number | null;
  redditPostsFound: number | null;
  emailsQueued: number | null;
  errorMessage: string | null;
  durationMs: number | null;
}

export interface Setting {
  id: number;
  key: string;
  value: string | null;
  updatedAt: Date | null;
}
