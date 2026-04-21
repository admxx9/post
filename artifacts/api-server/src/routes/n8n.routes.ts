import { Router, type IRouter, type Request, type Response } from "express";
import { forwardToN8nWebhook } from "../services/n8n.service.js";

const router: IRouter = Router();

router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const data = await forwardToN8nWebhook(req.body);
    res.status(200).json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao chamar n8n";
    res.status(502).json({ error: "Bad Gateway", message });
  }
});

export default router;
