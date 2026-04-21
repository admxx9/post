const N8N_WEBHOOK_URL = "https://lunexnynn.app.n8n.cloud/webhook-test/video-process-and-publish";

export interface ScheduledPost {
  videoUrl: string;
  time: string;
  platforms: string[];
  title?: string;
}

export interface BatchPayload {
  posts: ScheduledPost[];
}

export async function sendBatchToN8n(payload: BatchPayload): Promise<Record<string, unknown>> {
  const response = await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  if (!text?.trim()) {
    throw new Error("n8n não retornou dados. Configure o nó 'Respond to Webhook'.");
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Resposta inválida do n8n: ${text.slice(0, 200)}`);
  }
  if (!response.ok) {
    throw new Error(`n8n retornou erro ${response.status}`);
  }
  return data as Record<string, unknown>;
}

export async function forwardToN8nWebhook(payload: unknown): Promise<unknown> {
  const response = await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  if (!text?.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
