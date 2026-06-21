export function ensureSidebarHost() {
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

  document.documentElement.appendChild(host);
  return host;
}