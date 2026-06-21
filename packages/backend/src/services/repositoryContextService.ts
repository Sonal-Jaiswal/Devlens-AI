import type { RepositoryContext } from "@devlens/shared";

export function summarizeRepositoryContext(repositoryContext: RepositoryContext) {
  return {
    repositoryIdentity: `${repositoryContext.owner}/${repositoryContext.repositoryName}`,
    fileCount: repositoryContext.importantFiles.length,
    hasReadme: repositoryContext.readme.trim().length > 0,
    folderCount: repositoryContext.folderStructure.length
  };
}