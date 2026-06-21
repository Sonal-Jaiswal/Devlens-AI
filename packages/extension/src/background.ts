import type {
  AskRepositoryRequest,
  AskRepositoryResponse,
  DetectApisRequest,
  DetectApisResponse,
  ExplainFileRequest,
  ExplainFileResponse,
  ExplainFunctionRequest,
  ExplainFunctionResponse,
  GenerateDiagramRequest,
  GenerateDiagramResponse,
  GenerateReadmeRequest,
  GenerateReadmeResponse,
  RepositorySummaryResponse,
  User
} from "@devlens/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

type StoredSession = {
  token?: string;
  user?: User;
};

async function getSession() {
  return new Promise<StoredSession>((resolve) => {
    chrome.storage.local.get(["devlens:session"], (items) => {
      resolve((items["devlens:session"] as StoredSession | undefined) ?? {});
    });
  });
}

async function setSession(session: StoredSession) {
  return new Promise<void>((resolve) => {
    chrome.storage.local.set({ "devlens:session": session }, () => resolve());
  });
}

async function clearSession() {
  await setSession({});
}

async function requestBackend<TResponse>(path: string, body: unknown, authenticated = false): Promise<TResponse> {
  const session = await getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (authenticated && session.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  const data = (await response.json()) as { data: TResponse };
  return data.data;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    switch (message?.type) {
      case "DEVLENS_GET_SESSION": {
        sendResponse({ ok: true, data: await getSession() });
        return;
      }
      case "DEVLENS_LOGOUT": {
        await clearSession();
        sendResponse({ ok: true, data: { ok: true } });
        return;
      }
      case "DEVLENS_REGISTER": {
        const result = await requestBackend<{ user: User; token: string }>("/auth/register", message.payload, false);
        await setSession({ token: result.token, user: result.user });
        sendResponse({ ok: true, data: result });
        return;
      }
      case "DEVLENS_LOGIN": {
        const result = await requestBackend<{ user: User; token: string }>("/auth/login", message.payload, false);
        await setSession({ token: result.token, user: result.user });
        sendResponse({ ok: true, data: result });
        return;
      }
      case "DEVLENS_ANALYZE_REPOSITORY": {
        const result = await requestBackend<RepositorySummaryResponse>("/analyze-repository", message.payload, true);
        sendResponse({ ok: true, data: result });
        return;
      }
      case "DEVLENS_ASK_REPOSITORY": {
        const result = await requestBackend<AskRepositoryResponse>("/ask-repository", message.payload, true);
        sendResponse({ ok: true, data: result });
        return;
      }
      case "DEVLENS_GENERATE_README": {
        const result = await requestBackend<GenerateReadmeResponse>("/generate-readme", message.payload, true);
        sendResponse({ ok: true, data: result });
        return;
      }
      case "DEVLENS_DETECT_APIS": {
        const result = await requestBackend<DetectApisResponse>("/detect-apis", message.payload, true);
        sendResponse({ ok: true, data: result });
        return;
      }
      case "DEVLENS_GENERATE_DIAGRAM": {
        const result = await requestBackend<GenerateDiagramResponse>("/generate-diagram", message.payload, true);
        sendResponse({ ok: true, data: result });
        return;
      }
      case "DEVLENS_EXPLAIN_FILE": {
        const result = await requestBackend<ExplainFileResponse>("/explain-file", message.payload, true);
        sendResponse({ ok: true, data: result });
        return;
      }
      case "DEVLENS_EXPLAIN_FUNCTION": {
        const result = await requestBackend<ExplainFunctionResponse>("/explain-function", message.payload, true);
        sendResponse({ ok: true, data: result });
        return;
      }
      default:
        sendResponse({ ok: false, error: "Unknown message type" });
    }
  })().catch((error: unknown) => {
    sendResponse({ ok: false, error: error instanceof Error ? error.message : "Unknown error" });
  });

  return true;
});