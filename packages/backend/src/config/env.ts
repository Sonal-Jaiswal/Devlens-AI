import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const workspaceEnvPath = resolve(process.cwd(), "../../.env");
const localEnvPath = resolve(process.cwd(), ".env");

dotenv.config({ path: existsSync(workspaceEnvPath) ? workspaceEnvPath : localEnvPath });

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().default(""),
  JWT_SECRET: z.string().default(""),
  JWT_EXPIRES_IN: z.string().default("7d"),
  GEMINI_API_KEY: z.string().default(""),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  CORS_ORIGIN: z.string().default("http://localhost:5173")
});

const parsed = envSchema.parse(process.env);

export const env = {
  port: parsed.PORT,
  mongodbUri: parsed.MONGODB_URI,
  jwtSecret: parsed.JWT_SECRET || "dev-only-secret-replace-in-production",
  jwtExpiresIn: parsed.JWT_EXPIRES_IN,
  geminiApiKey: parsed.GEMINI_API_KEY,
  geminiModel: parsed.GEMINI_MODEL,
  corsOrigin: parsed.CORS_ORIGIN
};