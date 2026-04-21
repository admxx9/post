import { Router, type IRouter } from "express";
import { processVideo, getVideoStatus } from "../controllers/video.controller.js";

const router: IRouter = Router();

router.post("/process", processVideo);
router.get("/status/:id", getVideoStatus);

export default router;
