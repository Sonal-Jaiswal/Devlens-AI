type RepositoryContext = {
  repositoryUrl: string;
  repositoryName: string;
  owner: string;
  branch: string;
  currentFilePath: string;
  readme: string;
  folderStructure: string[];
  importantFiles: Array<{ path: string; content: string }>;
};

type GitHubPageContext = {
  kind: "repository" | "file";
  repositoryContext: RepositoryContext;
  filePath: string;
  fileContent: string;
};

const SIDEBAR_CONTEXT_KEY = "devlens:sidebar-context";

function isGitHubRepositoryPage() {
  return /^https:\/\/github\.com\/[^/]+\/[^/]+/.test(window.location.href);
}

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

function getGitHubPageContext(): GitHubPageContext | null {
  if (!isGitHubRepositoryPage()) {
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

  const importantFiles = Array.from(document.querySelectorAll("article.markdown-body code, article.markdown-body pre"))
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

function ensureSidebarHost() {
  const existing = document.getElementById("devlens-ai-sidebar-host");
  if (existing) {
    return existing;
  }

  const host = document.createElement("div");
  host.id = "devlens-ai-sidebar-host";
  host.style.position = "fixed";
  host.style.top = "0";
  host.style.right = "0";
  host.style.height = "100vh";
  host.style.width = "420px";
  host.style.zIndex = "2147483647";
  host.style.pointerEvents = "auto";
  host.style.background = "#020617";
  host.style.boxShadow = "0 0 40px rgba(15, 23, 42, 0.6)";

  document.documentElement.appendChild(host);
  return host;
}

async function mountSidebar(pageContext: GitHubPageContext) {
  await chrome.storage.local.set({ [SIDEBAR_CONTEXT_KEY]: pageContext });

  const host = ensureSidebarHost();
  if (host.querySelector("iframe")) {
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.src = chrome.runtime.getURL("sidebar.html");
  iframe.title = "DevLens AI Sidebar";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "0";
  iframe.style.display = "block";
  iframe.allow = "clipboard-write";

  host.appendChild(iframe);
}

if (isGitHubRepositoryPage()) {
  const pageContext = getGitHubPageContext();
  if (pageContext) {
    void mountSidebar(pageContext);
  }
}
