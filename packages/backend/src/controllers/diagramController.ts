import type { Request, Response } from "express";
import { generateDiagramRequestSchema } from "@devlens/shared";
import { generateArchitectureDiagram } from "../services/geminiService.js";
import { summarizeRepositoryContext } from "../services/repositoryContextService.js";

export async function postGenerateDiagram(request: Request, response: Response) {
  const payload = generateDiagramRequestSchema.parse(request.body);
  const diagram = await generateArchitectureDiagram(payload.repositoryContext);
  const contextSummary = summarizeRepositoryContext(payload.repositoryContext);

  response.json({
    ok: true,
    contextSummary,
    data: diagram
  });
}