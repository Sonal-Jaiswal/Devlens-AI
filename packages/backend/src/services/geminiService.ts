import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
import type { GenerateDiagramResponse, RepositoryContext } from "@devlens/shared";
import { buildDiagramPrompt } from "../prompts/diagramPrompt.js";

function extractJson(text: string) {
  const trimmed = text.trim();
  const codeFenceMatch = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  if (codeFenceMatch?.[1]) {
    return codeFenceMatch[1];
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

export async function generateArchitectureDiagram(repositoryContext: RepositoryContext): Promise<GenerateDiagramResponse> {
  if (!env.geminiApiKey) {
    return {
      title: `${repositoryContext.repositoryName} architecture`,
      diagram: [
        "graph TD",
        "A[Frontend] --> B[Backend]",
        "B --> C[Database]"
      ].join("\n"),
      explanation: "Gemini is not configured yet. This is a safe fallback diagram.",
      summary: "Configure GEMINI_API_KEY to generate a repository-specific architecture diagram."
    };
  }

  const client = new GoogleGenerativeAI(env.geminiApiKey);
  const model = client.getGenerativeModel({ model: env.geminiModel });
  const prompt = buildDiagramPrompt(repositoryContext);
  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    });

    const text = result.response.text();
    const parsed = generateDiagramResponseFromText(text);
    return parsed;
  } catch {
    return {
      title: `${repositoryContext.repositoryName} architecture`,
      diagram: [
        "graph TD",
        "A[Frontend] --> B[Backend]",
        "B --> C[Database]"
      ].join("\n"),
      explanation: "Gemini returned an invalid response. This safe fallback diagram was returned instead.",
      summary: "The architecture diagram request completed, but the model response could not be parsed."
    };
  }
}

function generateDiagramResponseFromText(text: string): GenerateDiagramResponse {
  const parsed = JSON.parse(extractJson(text)) as Partial<GenerateDiagramResponse>;

  return {
    title: parsed.title || "Repository architecture",
    diagram: parsed.diagram || [
      "graph TD",
      "A[Frontend] --> B[Backend]",
      "B --> C[Database]"
    ].join("\n"),
    explanation: parsed.explanation || "No explanation was returned by Gemini.",
    summary: parsed.summary || "No summary was returned by Gemini."
  };
}