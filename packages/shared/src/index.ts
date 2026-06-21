import { z } from "zod";

export const userPlanSchema = z.enum(["free", "pro"]);

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  plan: userPlanSchema,
  createdAt: z.string().optional()
});

export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const loginRequestSchema = registerRequestSchema;

export const repositoryContextSchema = z.object({
  repositoryUrl: z.string().url(),
  repositoryName: z.string().min(1),
  owner: z.string().min(1),
  branch: z.string().optional().default("main"),
  currentFilePath: z.string().optional().default(""),
  readme: z.string().max(50000).optional().default(""),
  folderStructure: z.array(z.string()).max(500).default([]),
  importantFiles: z.array(
    z.object({
      path: z.string().min(1),
      content: z.string().max(30000).optional().default("")
    })
  ).max(50).default([])
});

export const analysisBaseRequestSchema = z.object({
  repositoryContext: repositoryContextSchema,
  userId: z.string().optional()
});

export const askRepositoryRequestSchema = analysisBaseRequestSchema.extend({
  question: z.string().min(1),
  chatHistory: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().min(1)
    })
  ).default([])
});

export const generateReadmeRequestSchema = analysisBaseRequestSchema;

export const detectApisRequestSchema = analysisBaseRequestSchema;

export const generateDiagramRequestSchema = analysisBaseRequestSchema;

export const explainFileRequestSchema = analysisBaseRequestSchema.extend({
  filePath: z.string().min(1),
  fileContent: z.string().min(1)
});

export const explainFunctionRequestSchema = analysisBaseRequestSchema.extend({
  code: z.string().min(1),
  language: z.string().optional().default("typescript")
});

export const repositorySummarySchema = z.object({
  repositoryPurpose: z.string(),
  techStack: z.array(z.string()),
  mainComponents: z.array(z.string()),
  folderBreakdown: z.array(z.string()),
  authenticationMethod: z.string(),
  databaseLayer: z.string(),
  externalServices: z.array(z.string()),
  projectComplexity: z.string()
});

export const repositorySummaryResponseSchema = z.object({
  title: z.string(),
  summary: repositorySummarySchema
});

export const askRepositoryResponseSchema = z.object({
  answer: z.string(),
  sources: z.array(z.string()).default([])
});

export const generateReadmeResponseSchema = z.object({
  readme: z.string(),
  title: z.string()
});

export const detectApisResponseSchema = z.object({
  title: z.string(),
  endpoints: z.array(
    z.object({
      method: z.string(),
      path: z.string(),
      description: z.string()
    })
  ),
  notes: z.array(z.string()).default([])
});

export const generateDiagramResponseSchema = z.object({
  title: z.string(),
  diagram: z.string(),
  explanation: z.string(),
  summary: z.string()
});

export const explainFileResponseSchema = z.object({
  title: z.string(),
  purpose: z.string(),
  keyFunctions: z.array(z.string()),
  dependencies: z.array(z.string()),
  importantLogic: z.array(z.string())
});

export const explainFunctionResponseSchema = z.object({
  title: z.string(),
  purpose: z.string(),
  complexity: z.string(),
  inputs: z.array(z.string()),
  outputs: z.array(z.string()),
  improvements: z.array(z.string())
});

export type UserPlan = z.infer<typeof userPlanSchema>;
export type User = z.infer<typeof userSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RepositoryContext = z.infer<typeof repositoryContextSchema>;
export type AnalysisBaseRequest = z.infer<typeof analysisBaseRequestSchema>;
export type AskRepositoryRequest = z.infer<typeof askRepositoryRequestSchema>;
export type GenerateReadmeRequest = z.infer<typeof generateReadmeRequestSchema>;
export type DetectApisRequest = z.infer<typeof detectApisRequestSchema>;
export type GenerateDiagramRequest = z.infer<typeof generateDiagramRequestSchema>;
export type ExplainFileRequest = z.infer<typeof explainFileRequestSchema>;
export type ExplainFunctionRequest = z.infer<typeof explainFunctionRequestSchema>;

export type RepositorySummary = z.infer<typeof repositorySummarySchema>;
export type RepositorySummaryResponse = z.infer<typeof repositorySummaryResponseSchema>;
export type AskRepositoryResponse = z.infer<typeof askRepositoryResponseSchema>;
export type GenerateReadmeResponse = z.infer<typeof generateReadmeResponseSchema>;
export type DetectApisResponse = z.infer<typeof detectApisResponseSchema>;
export type GenerateDiagramResponse = z.infer<typeof generateDiagramResponseSchema>;
export type ExplainFileResponse = z.infer<typeof explainFileResponseSchema>;
export type ExplainFunctionResponse = z.infer<typeof explainFunctionResponseSchema>;

export const repositoryAnalysisSchema = z.object({
  repositoryUrl: z.string().url(),
  createdAt: z.string().optional()
});