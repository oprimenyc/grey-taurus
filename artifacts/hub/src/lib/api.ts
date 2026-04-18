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
