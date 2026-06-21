import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";

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

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error("Gemini request timed out")), timeoutMs);
      })
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

export async function generateJsonResponse<T>(options: {
  prompt: string;
  fallback: T;
}): Promise<T> {
  if (!env.geminiApiKey) {
    return options.fallback;
  }

  try {
    const client = new GoogleGenerativeAI(env.geminiApiKey);
    const model = client.getGenerativeModel({ model: env.geminiModel });
    const result = await withTimeout(
      model.generateContent({
        contents: [{ role: "user", parts: [{ text: options.prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      }),
      45000
    );

    const parsed = JSON.parse(extractJson(result.response.text())) as T;
    return parsed;
  } catch {
    return options.fallback;
  }
}
