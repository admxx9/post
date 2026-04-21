import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const N8N_AI_URL = "https://lunexnynn.app.n8n.cloud/webhook/video-processor";

router.post("/video-processor", async (req: Request, res: Response) => {
  try {
    const response = await fetch(N8N_AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const text = await response.text();
    let data: unknown = {};
    if (text.trim()) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }
    }
    res.status(response.status).json(data);
  } catch {
    res.status(502).json({ error: "Não foi possível conectar ao n8n" });
  }
});

export default router;
