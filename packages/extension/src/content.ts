import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { ensureSidebarHost } from "./inject.js";
import { getGitHubPageContext, isGitHubPage } from "./utils/github.js";
import { SidebarApp } from "./sidebar.js";

if (isGitHubPage()) {
  const pageContext = getGitHubPageContext();
  if (pageContext) {
    const host = ensureSidebarHost();
    const rootElement = document.createElement("div");
    rootElement.id = "devlens-ai-root";
    host.appendChild(rootElement);

    createRoot(rootElement).render(createElement(SidebarApp, { pageContext }));
  }
}