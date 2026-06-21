import type { Response } from "express";
import {
  askRepositoryRequestSchema,
  detectApisRequestSchema,
  explainFileRequestSchema,
  explainFunctionRequestSchema,
  generateDiagramRequestSchema,
  generateReadmeRequestSchema,
  repositoryContextSchema,
  type AnalysisBaseRequest,
  type AskRepositoryResponse,
  type DetectApisResponse,
  type ExplainFileResponse,
  type ExplainFunctionResponse,
  type GenerateDiagramResponse,
  type GenerateReadmeResponse,
  type RepositorySummaryResponse
} from "@devlens/shared";
import { RepositoryAnalysisModel } from "../models/RepositoryAnalysis.js";
import { ChatHistoryModel } from "../models/ChatHistory.js";
import { UsageRecordModel } from "../models/UsageRecord.js";
import { generateJsonResponse } from "../services/geminiJsonService.js";
import {
  buildApiDetectionPrompt,
  buildAskRepositoryPrompt,
  buildDiagramPrompt,
  buildFileExplanationPrompt,
  buildFunctionExplanationPrompt,
  buildReadmePrompt,
  buildRepositorySummaryPrompt
} from "../prompts/featurePrompts.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { repositoryContextSchema as sharedRepositoryContextSchema } from "@devlens/shared";

function fallbackRepositorySummary(repositoryName: string): RepositorySummaryResponse {
  return {
    title: `${repositoryName} summary`,
    summary: {
      repositoryPurpose: "Repository context was insufficient for a deep summary.",
      techStack: ["TypeScript"],
      mainComponents: ["Frontend", "Backend"],
      folderBreakdown: [],
      authenticationMethod: "JWT",
      databaseLayer: "MongoDB",
      externalServices: [],
      projectComplexity: "medium"
    }
  };
}

function fallbackReadme(repositoryName: string): GenerateReadmeResponse {
  return {
    title: `${repositoryName} README`,
    readme: `# ${repositoryName}\n\n## Project Description\nGenerated README placeholder.\n\n## Installation\n\`npm install\`\n\n## Usage\n\`npm run dev\`\n\n## Environment Variables\nSee .env.example\n\n## API Documentation\nRefer to the backend routes.\n\n## Contributing\nOpen a pull request.`
  };
}

function fallbackDiagram(repositoryName: string): GenerateDiagramResponse {
  return {
    title: `${repositoryName} architecture`,
    diagram: [
      "graph TD",
      "A[Frontend] --> B[Backend]",
      "B --> C[Database]"
    ].join("\n"),
    explanation: "Fallback architecture diagram generated locally.",
    summary: "A basic frontend-backend-database flow was inferred."
  };
}

function fallbackApis(repositoryName: string): DetectApisResponse {
  return {
    title: `${repositoryName} API explorer`,
    endpoints: [],
    notes: ["No explicit API routes could be inferred from the current repository context."]
  };
}

function fallbackFileExplanation(filePath: string): ExplainFileResponse {
  return {
    title: filePath,
    purpose: "Explain the role of this file in the repository.",
    keyFunctions: [],
    dependencies: [],
    importantLogic: []
  };
}

function fallbackFunctionExplanation(filePath: string): ExplainFunctionResponse {
  return {
    title: filePath,
    purpose: "Explain the selected function or code block.",
    complexity: "medium",
    inputs: [],
    outputs: [],
    improvements: []
  };
}

async function saveRepositoryAnalysis(userId: string | undefined, repositoryUrl: string, summary: unknown) {
  if (!userId) {
    return;
  }

  await RepositoryAnalysisModel.create({
    userId,
    repositoryUrl,
    summary
  });
}

async function incrementQuestionUsage(userId: string) {
  const dateKey = new Date().toISOString().slice(0, 10);
  const record = await UsageRecordModel.findOneAndUpdate(
    { userId, dateKey },
    { $inc: { questionCount: 1 } },
    { upsert: true, new: true }
  );

  if ((record?.questionCount ?? 0) > 20) {
    throw new Error("DAILY_QUOTA_EXCEEDED");
  }
}

export async function postAnalyzeRepository(request: AuthenticatedRequest, response: Response) {
  const payload = repositoryContextSchema.parse(request.body.repositoryContext);
  const result = await generateJsonResponse<RepositorySummaryResponse>({
    prompt: buildRepositorySummaryPrompt(payload),
    fallback: fallbackRepositorySummary(payload.repositoryName)
  });

  await saveRepositoryAnalysis(request.user?.userId, payload.repositoryUrl, result);
  response.json({ ok: true, data: result });
}

export async function postAskRepository(request: AuthenticatedRequest, response: Response) {
  const payload = askRepositoryRequestSchema.parse(request.body);

  if (request.user?.plan === "free") {
    await incrementQuestionUsage(request.user.userId);
  }

  const result = await generateJsonResponse<AskRepositoryResponse>({
    prompt: buildAskRepositoryPrompt(payload.repositoryContext, payload.question, payload.chatHistory),
    fallback: {
      answer: "I could not generate a detailed answer right now.",
      sources: []
    }
  });

  if (request.user?.userId) {
    await ChatHistoryModel.findOneAndUpdate(
      { userId: request.user.userId, repositoryUrl: payload.repositoryContext.repositoryUrl },
      {
        $push: {
          messages: {
            $each: [
              { role: "user", content: payload.question },
              { role: "assistant", content: result.answer }
            ]
          }
        }
      },
      { upsert: true, new: true }
    );
  }

  response.json({ ok: true, data: result });
}

export async function postGenerateReadme(request: AuthenticatedRequest, response: Response) {
  const payload = generateReadmeRequestSchema.parse(request.body);
  const result = await generateJsonResponse<GenerateReadmeResponse>({
    prompt: buildReadmePrompt(payload.repositoryContext),
    fallback: fallbackReadme(payload.repositoryContext.repositoryName)
  });

  response.json({ ok: true, data: result });
}

export async function postDetectApis(request: AuthenticatedRequest, response: Response) {
  const payload = detectApisRequestSchema.parse(request.body);
  const result = await generateJsonResponse<DetectApisResponse>({
    prompt: buildApiDetectionPrompt(payload.repositoryContext),
    fallback: fallbackApis(payload.repositoryContext.repositoryName)
  });

  response.json({ ok: true, data: result });
}

export async function postGenerateDiagram(request: AuthenticatedRequest, response: Response) {
  const payload = generateDiagramRequestSchema.parse(request.body);
  const result = await generateJsonResponse<GenerateDiagramResponse>({
    prompt: buildDiagramPrompt(payload.repositoryContext),
    fallback: fallbackDiagram(payload.repositoryContext.repositoryName)
  });

  response.json({ ok: true, data: result });
}

export async function postExplainFile(request: AuthenticatedRequest, response: Response) {
  const payload = explainFileRequestSchema.parse(request.body);
  const result = await generateJsonResponse<ExplainFileResponse>({
    prompt: buildFileExplanationPrompt(payload.repositoryContext, payload.filePath, payload.fileContent),
    fallback: fallbackFileExplanation(payload.filePath)
  });

  response.json({ ok: true, data: result });
}

export async function postExplainFunction(request: AuthenticatedRequest, response: Response) {
  const payload = explainFunctionRequestSchema.parse(request.body);
  const result = await generateJsonResponse<ExplainFunctionResponse>({
    prompt: buildFunctionExplanationPrompt(payload.repositoryContext, payload.code, payload.language),
    fallback: fallbackFunctionExplanation(payload.repositoryContext.currentFilePath || "Selected code")
  });

  response.json({ ok: true, data: result });
}
