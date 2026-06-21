import { Router } from "express";
import { authRoutes } from "./authRoutes.js";
import { analysisRoutes } from "./analysisRoutes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_request, response) => {
  response.json({ ok: true, service: "devlens-ai-backend" });
});

apiRouter.use("/auth", authRoutes);
apiRouter.use(analysisRoutes);