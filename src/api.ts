// Both URLs work, but api.z.ai is more consistent
const API_BASE = "https://api.z.ai";

export interface Subscription {
  productName: string;
  status: string;
  valid: string;
  nextRenewTime: string;
  billingCycle: string;
  actualPrice: number;
  autoRenew: number;
}

export interface QuotaLimit {
  type: string;
  unit: number;
  number: number;
  usage: number;
  currentValue: number;
  remaining: number;
  percentage: number;
  usageDetails?: Array<{ modelCode: string; usage: number }>;
  nextResetTime?: number;
}

export interface UsageData {
  x_time: string[];
  modelCallCount: (number | null)[];
  tokensUsage: (number | null)[];
  totalUsage: {
    totalModelCallCount: number;
    totalTokensUsage: number;
  };
}

export class ZaiApiError extends Error {
  constructor(
    message: string,
    public code?: number,
    public response?: any
  ) {
    super(message);
    this.name = "ZaiApiError";
  }
}

async function apiRequest(
  endpoint: string,
  token: string
): Promise<any> {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    accept: "application/json, text/plain, */*",
    "accept-language": "en",
    // Send as Authorization Bearer token
    authorization: `Bearer ${token.trim()}`,
    origin: "https://z.ai",
    referer: "https://z.ai/manage-apikey/subscription",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  };

  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new ZaiApiError(
      `API error: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  const data = await response.json();

  if (data.code !== 200) {
    throw new ZaiApiError(data.msg || "API request failed", data.code, data);
  }

  return data;
}

export async function getSubscription(cookie: string): Promise<Subscription[]> {
  const data = await apiRequest("/api/biz/subscription/list", cookie);
  return data.data;
}

export async function getQuotaLimit(cookie: string): Promise<QuotaLimit[]> {
  const data = await apiRequest("/api/monitor/usage/quota/limit", cookie);
  return data.data.limits;
}

export async function getModelUsage(
  cookie: string,
  startTime: string,
  endTime: string
): Promise<UsageData> {
  const params = new URLSearchParams({
    startTime,
    endTime,
  });
  const data = await apiRequest(`/api/monitor/usage/model-usage?${params}`, cookie);
  return data.data;
}
