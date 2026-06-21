import { Router } from "express";
import { postGenerateDiagram } from "../controllers/diagramController.js";
import { validateBody } from "../middleware/validate.js";
import { generateDiagramRequestSchema } from "@devlens/shared";
import { asyncHandler } from "../utils/asyncHandler.js";

export const diagramRoutes = Router();

diagramRoutes.post(
  "/generate-diagram",
  validateBody(generateDiagramRequestSchema),
  asyncHandler(postGenerateDiagram)
);