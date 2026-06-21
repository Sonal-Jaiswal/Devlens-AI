import { Router } from "express";
import { attachUserIfPresent } from "../middleware/optionalAuth.js";
import { validateBody } from "../middleware/validate.js";
import {
  askRepositoryRequestSchema,
  detectApisRequestSchema,
  explainFileRequestSchema,
  explainFunctionRequestSchema,
  generateDiagramRequestSchema,
  generateReadmeRequestSchema,
  analysisBaseRequestSchema
} from "@devlens/shared";
import {
  postAnalyzeRepository,
  postAskRepository,
  postDetectApis,
  postExplainFile,
  postExplainFunction,
  postGenerateDiagram,
  postGenerateReadme
} from "../controllers/analysisController.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const analysisRoutes = Router();

analysisRoutes.post("/analyze-repository", attachUserIfPresent, validateBody(analysisBaseRequestSchema), asyncHandler(postAnalyzeRepository));
analysisRoutes.post("/ask-repository", attachUserIfPresent, validateBody(askRepositoryRequestSchema), asyncHandler(postAskRepository));
analysisRoutes.post("/generate-readme", attachUserIfPresent, validateBody(generateReadmeRequestSchema), asyncHandler(postGenerateReadme));
analysisRoutes.post("/detect-apis", attachUserIfPresent, validateBody(detectApisRequestSchema), asyncHandler(postDetectApis));
analysisRoutes.post("/generate-diagram", attachUserIfPresent, validateBody(generateDiagramRequestSchema), asyncHandler(postGenerateDiagram));
analysisRoutes.post("/explain-file", attachUserIfPresent, validateBody(explainFileRequestSchema), asyncHandler(postExplainFile));
analysisRoutes.post("/explain-function", attachUserIfPresent, validateBody(explainFunctionRequestSchema), asyncHandler(postExplainFunction));
