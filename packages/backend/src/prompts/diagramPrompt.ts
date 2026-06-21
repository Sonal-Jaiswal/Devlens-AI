import type { RepositoryContext } from "@devlens/shared";

export function buildDiagramPrompt(repositoryContext: RepositoryContext) {
  const files = repositoryContext.importantFiles
    .map((file: RepositoryContext["importantFiles"][number]) => `- ${file.path}${file.content ? `\n  ${file.content.slice(0, 1200)}` : ""}`)
    .join("\n");

  const folders = repositoryContext.folderStructure.join("\n");

  return `
You are DevLens AI. Create a concise architecture analysis for the repository below.

Return ONLY valid JSON with these keys:
{
  "title": string,
  "diagram": string,
  "explanation": string,
  "summary": string
}

Requirements:
- The diagram must be Mermaid syntax and represent frontend, backend, database, and external services when present.
- Prefer graph TD layout.
- Keep the diagram simple, readable, and production-oriented.

Repository URL: ${repositoryContext.repositoryUrl}
Repository Name: ${repositoryContext.repositoryName}
Owner: ${repositoryContext.owner}

README:
${repositoryContext.readme || "No README provided."}

Folder Structure:
${folders || "No folder structure provided."}

Important Files:
${files || "No important files provided."}
`.trim();
}