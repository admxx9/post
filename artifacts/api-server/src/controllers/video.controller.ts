import type { Request, Response } from "express";
import { sendBatchToN8n } from "../services/n8n.service.js";

interface JobEntry {
  id: string;
  status: "processing" | "done" | "failed";
  accepted: number;
  posts: Array<{ videoUrl: string; time: string; platforms: string[] }>;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: string;
}

const jobStore = new Map<string, JobEntry>();

export async function processVideo(req: Request, res: Response): Promise<void> {
  const body = req.body as {
    posts?: Array<{ videoUrl?: string; time?: string; platforms?: string[] }>;
  };
  if (!body.posts || !Array.isArray(body.posts) || body.posts.length === 0) {
    res.status(400).json({ error: "Campo 'posts' deve ser um array não vazio." });
    return;
  }
  const allowed = ["instagram", "tiktok", "youtube"];
  const validPosts: Array<{ videoUrl: string; time: string; platforms: string[] }> = [];
  for (const p of body.posts) {
    if (!p.videoUrl?.trim()) continue;
    if (!p.platforms?.length) continue;
    if (p.platforms.some((pl) => !allowed.includes(pl))) continue;
    validPosts.push({
      videoUrl: p.videoUrl.trim(),
      time: p.time ?? new Date().toISOString(),
      platforms: p.platforms,
    });
  }
  if (validPosts.length === 0) {
    res.status(400).json({ error: "Nenhum post válido. Verifique videoUrl e platforms." });
    return;
  }
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  jobStore.set(jobId, {
    id: jobId,
    status: "processing",
    accepted: validPosts.length,
    posts: validPosts,
    createdAt: new Date().toISOString(),
  });
  try {
    const result = await sendBatchToN8n({ posts: validPosts });
    jobStore.set(jobId, {
      id: jobId,
      status: "done",
      accepted: validPosts.length,
      posts: validPosts,
      result,
      createdAt: new Date().toISOString(),
    });
    res.status(200).json({ success: true, jobId, accepted: validPosts.length, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    jobStore.set(jobId, {
      id: jobId,
      status: "failed",
      accepted: 0,
      posts: validPosts,
      error: message,
      createdAt: new Date().toISOString(),
    });
    res.status(502).json({ success: false, jobId, error: message });
  }
}

export function getVideoStatus(req: Request, res: Response): void {
  const entry = jobStore.get(req.params.id ?? "");
  if (!entry) {
    res.status(404).json({ error: "Job não encontrado." });
    return;
  }
  res.status(200).json(entry);
}
