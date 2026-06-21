import type { RepositoryContext } from "@devlens/shared";

export type GitHubPageContext = {
  kind: "repository" | "file";
  repositoryContext: RepositoryContext;
  filePath: string;
  fileContent: string;
};

function textContentFromSelector(selector: string) {
  return document.querySelector(selector)?.textContent?.trim() ?? "";
}

function extractOwnerRepo() {
  const pathParts = window.location.pathname.replace(/^\//, "").split("/");
  return {
    owner: pathParts[0] || "",
    repositoryName: pathParts[1] || ""
  };
}

function extractFilePath() {
  const pathParts = window.location.pathname.replace(/^\//, "").split("/");
  const blobIndex = pathParts.indexOf("blob");
  if (blobIndex >= 0 && pathParts.length > blobIndex + 2) {
    return pathParts.slice(blobIndex + 2).join("/");
  }

  return "";
}

function extractFileContent() {
  return Array.from(document.querySelectorAll("pre, code"))
    .map((element) => element.textContent?.trim() ?? "")
    .filter(Boolean)
    .sort((left, right) => right.length - left.length)[0] ?? "";
}

export function getGitHubPageContext(): GitHubPageContext | null {
  if (!/^https:\/\/github\.com\/[^/]+\/[^/]+/.test(window.location.href)) {
    return null;
  }

  const { owner, repositoryName } = extractOwnerRepo();
  const isFilePage = window.location.pathname.includes("/blob/");
  const filePath = isFilePage ? extractFilePath() : "";
  const repositoryUrl = `${window.location.origin}/${owner}/${repositoryName}`;
  const readme = textContentFromSelector("article.markdown-body") || textContentFromSelector("[data-testid='readme-content']");

  const folderStructure = Array.from(document.querySelectorAll('div[role="row"] a, table[aria-labelledby] a'))
    .map((element) => element.textContent?.trim() ?? "")
    .filter(Boolean)
    .slice(0, 200);

  const importantFiles = Array.from(document.querySelectorAll('article.markdown-body code, article.markdown-body pre'))
    .slice(0, 10)
    .map((element, index) => ({
      path: `README-snippet-${index + 1}`,
      content: element.textContent?.trim() ?? ""
    }));

  return {
    kind: isFilePage ? "file" : "repository",
    repositoryContext: {
      repositoryUrl,
      repositoryName,
      owner,
      branch: "main",
      currentFilePath: filePath,
      readme,
      folderStructure,
      importantFiles
    },
    filePath,
    fileContent: isFilePage ? extractFileContent() : ""
  };
}

export function getSelectedCode() {
  return window.getSelection()?.toString().trim() ?? "";
}

export function isGitHubPage() {
  return /^https:\/\/github\.com\/[^/]+\/[^/]+/.test(window.location.href);
}