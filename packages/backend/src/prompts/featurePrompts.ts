import type { RepositoryContext } from "@devlens/shared";

function compactFiles(repositoryContext: RepositoryContext) {
  return repositoryContext.importantFiles
    .map((file) => `- ${file.path}${file.content ? `\n  ${file.content.slice(0, 2000)}` : ""}`)
    .join("\n");
}

function compactFolders(repositoryContext: RepositoryContext) {
  return repositoryContext.folderStructure.slice(0, 200).join("\n");
}

export function buildRepositorySummaryPrompt(repositoryContext: RepositoryContext) {
  return `
Return ONLY JSON with keys: title, summary.
summary must contain: repositoryPurpose, techStack, mainComponents, folderBreakdown, authenticationMethod, databaseLayer, externalServices, projectComplexity.

Repository URL: ${repositoryContext.repositoryUrl}
Repository Name: ${repositoryContext.repositoryName}
Owner: ${repositoryContext.owner}
README:
${repositoryContext.readme || "No README available."}

Folder Structure:
${compactFolders(repositoryContext)}

Important Files:
${compactFiles(repositoryContext)}
`.trim();
}

export function buildAskRepositoryPrompt(repositoryContext: RepositoryContext, question: string, chatHistory: Array<{ role: string; content: string }>) {
  const history = chatHistory.map((message) => `${message.role.toUpperCase()}: ${message.content}`).join("\n");

  return `
Return ONLY JSON with keys: answer, sources.
Answer the user's question using repository context. Prefer precise file references when possible.

Repository URL: ${repositoryContext.repositoryUrl}
Repository Name: ${repositoryContext.repositoryName}
Owner: ${repositoryContext.owner}
Question: ${question}

Conversation History:
${history || "No previous messages."}

README:
${repositoryContext.readme || "No README available."}

Folder Structure:
${compactFolders(repositoryContext)}

Important Files:
${compactFiles(repositoryContext)}
`.trim();
}

export function buildReadmePrompt(repositoryContext: RepositoryContext) {
  return `
Return ONLY JSON with keys: title, readme.
Generate a polished README for the repository with these sections:
- Project Description
- Installation
- Usage
- Environment Variables
- API Documentation
- Contributing

Repository URL: ${repositoryContext.repositoryUrl}
Repository Name: ${repositoryContext.repositoryName}
Owner: ${repositoryContext.owner}
README:
${repositoryContext.readme || "No README available."}

Folder Structure:
${compactFolders(repositoryContext)}

Important Files:
${compactFiles(repositoryContext)}
`.trim();
}

export function buildApiDetectionPrompt(repositoryContext: RepositoryContext) {
  return `
Return ONLY JSON with keys: title, endpoints, notes.
endpoints must be an array of { method, path, description }.
Detect API endpoints, routes, and controllers from the repository context.

Repository URL: ${repositoryContext.repositoryUrl}
Repository Name: ${repositoryContext.repositoryName}
Owner: ${repositoryContext.owner}
README:
${repositoryContext.readme || "No README available."}

Folder Structure:
${compactFolders(repositoryContext)}

Important Files:
${compactFiles(repositoryContext)}
`.trim();
}

export function buildDiagramPrompt(repositoryContext: RepositoryContext) {
  return `
Return ONLY JSON with keys: title, diagram, explanation, summary.
The diagram must be Mermaid syntax using graph TD.

Repository URL: ${repositoryContext.repositoryUrl}
Repository Name: ${repositoryContext.repositoryName}
Owner: ${repositoryContext.owner}
README:
${repositoryContext.readme || "No README available."}

Folder Structure:
${compactFolders(repositoryContext)}

Important Files:
${compactFiles(repositoryContext)}
`.trim();
}

export function buildFileExplanationPrompt(repositoryContext: RepositoryContext, filePath: string, fileContent: string) {
  return `
Return ONLY JSON with keys: title, purpose, keyFunctions, dependencies, importantLogic.
Explain the file in practical terms.

Repository URL: ${repositoryContext.repositoryUrl}
Repository Name: ${repositoryContext.repositoryName}
Owner: ${repositoryContext.owner}
File Path: ${filePath}
File Content:
${fileContent}

Repository README:
${repositoryContext.readme || "No README available."}
`.trim();
}

export function buildFunctionExplanationPrompt(repositoryContext: RepositoryContext, code: string, language: string) {
  return `
Return ONLY JSON with keys: title, purpose, complexity, inputs, outputs, improvements.
Explain the selected ${language} code.

Repository URL: ${repositoryContext.repositoryUrl}
Repository Name: ${repositoryContext.repositoryName}
Owner: ${repositoryContext.owner}
Code:
${code}

Repository README:
${repositoryContext.readme || "No README available."}
`.trim();
}
