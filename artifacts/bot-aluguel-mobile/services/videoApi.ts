export interface ScheduledPost {
  videoUrl: string;
  time: string;
  platforms: string[];
}

export interface BatchPayload {
  posts: ScheduledPost[];
}

export interface BatchResponse {
  success: boolean;
  jobId?: string;
  accepted?: number;
  error?: string;
  [key: string]: unknown;
}

function getBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) {
    if (domain.startsWith("http://") || domain.startsWith("https://")) return domain;
    return `https://${domain}`;
  }
  return "";
}

export async function schedulePostsBatch(payload: BatchPayload): Promise<BatchResponse> {
  const base = getBaseUrl();
  const response = await fetch(`${base}/api/video/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json()) as BatchResponse;
  if (!response.ok) {
    throw new Error(data.error ?? `HTTP ${response.status}`);
  }
  return data;
}

export async function generateDescription(videoUrl: string): Promise<{ description?: string; hashtags?: string[]; raw?: unknown }> {
  const base = getBaseUrl();
  const response = await fetch(`${base}/api/proxy/video-processor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoUrl }),
  });
  const data = await response.json();
  return data;
}
