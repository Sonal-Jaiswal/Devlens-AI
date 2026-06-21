import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import mermaid from "mermaid";
import type {
  AskRepositoryResponse,
  DetectApisResponse,
  ExplainFileResponse,
  ExplainFunctionResponse,
  GenerateDiagramResponse,
  GenerateReadmeResponse,
  RepositoryContext,
  RepositorySummaryResponse,
  User
} from "@devlens/shared";
import { getStorage, sendMessage, setStorage } from "./utils/chrome.js";
import { getSelectedCode } from "./utils/github.js";
import "./styles.css";

type PageContext = {
  kind: "repository" | "file";
  repositoryContext: RepositoryContext;
  filePath: string;
  fileContent: string;
};

type FeatureState<T> = {
  loading: boolean;
  error: string | null;
  data: T | null;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type SidebarAppProps = {
  pageContext: PageContext;
};

const cacheKey = (repositoryUrl: string, feature: string) => `devlens:${feature}:${repositoryUrl}`;

const tabs = [
  { id: "summary", label: "Summary" },
  { id: "chat", label: "Chat" },
  { id: "readme", label: "README" },
  { id: "apis", label: "APIs" },
  { id: "diagram", label: "Diagram" },
  { id: "file", label: "File" },
  { id: "function", label: "Function" }
] as const;

type TabId = (typeof tabs)[number]["id"];

function SkeletonBlock() {
  return <div className="h-24 animate-pulse rounded-xl border border-slate-800 bg-slate-900/80" />;
}

function ResultCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {children}
    </section>
  );
}

function MermaidPreview({ diagram }: { diagram: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: "dark" });
    void (async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const result = await mermaid.render(id, diagram);
        setSvg(result.svg);
        setRenderError(null);
      } catch (error) {
        setSvg(null);
        setRenderError(error instanceof Error ? error.message : "Failed to render diagram");
      }
    })();
  }, [diagram]);

  if (renderError) {
    return <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200">{diagram}</pre>;
  }

  return <div className="overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-3" dangerouslySetInnerHTML={{ __html: svg ?? "" }} />;
}

export function SidebarApp({ pageContext }: SidebarAppProps) {
  const [tab, setTab] = useState<TabId>(pageContext.kind === "file" ? "file" : "summary");
  const [session, setSession] = useState<{ user?: User }>({});
  const [summary, setSummary] = useState<FeatureState<RepositorySummaryResponse>>({ loading: false, error: null, data: null });
  const [readme, setReadme] = useState<FeatureState<GenerateReadmeResponse>>({ loading: false, error: null, data: null });
  const [apis, setApis] = useState<FeatureState<DetectApisResponse>>({ loading: false, error: null, data: null });
  const [diagram, setDiagram] = useState<FeatureState<GenerateDiagramResponse>>({ loading: false, error: null, data: null });
  const [fileExplanation, setFileExplanation] = useState<FeatureState<ExplainFileResponse>>({ loading: false, error: null, data: null });
  const [functionExplanation, setFunctionExplanation] = useState<FeatureState<ExplainFunctionResponse>>({ loading: false, error: null, data: null });
  const [chat, setChat] = useState<FeatureState<AskRepositoryResponse>>({ loading: false, error: null, data: null });
  const [question, setQuestion] = useState("Explain this repository");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedCode, setSelectedCode] = useState(pageContext.fileContent);

  useEffect(() => {
    void (async () => {
      const response = await sendMessage<{ ok: boolean; data?: { user?: User } }>({ type: "DEVLENS_GET_SESSION" });
      if (response.ok && response.data) {
        setSession(response.data);
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      const cachedSummary = await getStorage<RepositorySummaryResponse>(cacheKey(pageContext.repositoryContext.repositoryUrl, "summary"));
      const cachedDiagram = await getStorage<GenerateDiagramResponse>(cacheKey(pageContext.repositoryContext.repositoryUrl, "diagram"));
      const cachedReadme = await getStorage<GenerateReadmeResponse>(cacheKey(pageContext.repositoryContext.repositoryUrl, "readme"));
      const cachedApis = await getStorage<DetectApisResponse>(cacheKey(pageContext.repositoryContext.repositoryUrl, "apis"));
      if (cachedSummary) setSummary({ loading: false, error: null, data: cachedSummary });
      if (cachedDiagram) setDiagram({ loading: false, error: null, data: cachedDiagram });
      if (cachedReadme) setReadme({ loading: false, error: null, data: cachedReadme });
      if (cachedApis) setApis({ loading: false, error: null, data: cachedApis });
    })();
  }, [pageContext.repositoryContext.repositoryUrl]);

  const repoLabel = useMemo(() => `${pageContext.repositoryContext.owner}/${pageContext.repositoryContext.repositoryName}`, [pageContext.repositoryContext.owner, pageContext.repositoryContext.repositoryName]);

  const runAction = async <T,>(setter: (state: FeatureState<T>) => void, path: string, payload: unknown, storageFeature: string) => {
    setter({ loading: true, error: null, data: null });
    try {
      const response = await sendMessage<{ ok: boolean; data?: T; error?: string }>({ type: path, payload });
      if (!response.ok || !response.data) {
        throw new Error(response.error || "Request failed");
      }
      setter({ loading: false, error: null, data: response.data });
      await setStorage(cacheKey(pageContext.repositoryContext.repositoryUrl, storageFeature), response.data);
    } catch (error) {
      setter({ loading: false, error: error instanceof Error ? error.message : "Unknown error", data: null });
    }
  };

  const analyzeSummary = () => runAction(setSummary, "DEVLENS_ANALYZE_REPOSITORY", { repositoryContext: pageContext.repositoryContext }, "summary");
  const generateReadme = () => runAction(setReadme, "DEVLENS_GENERATE_README", { repositoryContext: pageContext.repositoryContext }, "readme");
  const detectApis = () => runAction(setApis, "DEVLENS_DETECT_APIS", { repositoryContext: pageContext.repositoryContext }, "apis");
  const generateDiagram = () => runAction(setDiagram, "DEVLENS_GENERATE_DIAGRAM", { repositoryContext: pageContext.repositoryContext }, "diagram");
  const explainFile = () => runAction(setFileExplanation, "DEVLENS_EXPLAIN_FILE", {
    repositoryContext: pageContext.repositoryContext,
    filePath: pageContext.filePath || pageContext.repositoryContext.currentFilePath || "",
    fileContent: pageContext.fileContent || pageContext.repositoryContext.readme || ""
  }, "file");
  const explainFunction = () => runAction(setFunctionExplanation, "DEVLENS_EXPLAIN_FUNCTION", {
    repositoryContext: pageContext.repositoryContext,
    code: selectedCode || pageContext.fileContent || pageContext.repositoryContext.readme || "",
    language: "typescript"
  }, "function");

  const askRepository = async () => {
    setChat({ loading: true, error: null, data: null });
    try {
      const response = await sendMessage<{ ok: boolean; data?: AskRepositoryResponse; error?: string }>({
        type: "DEVLENS_ASK_REPOSITORY",
        payload: {
          repositoryContext: pageContext.repositoryContext,
          question,
          chatHistory: messages
        }
      });

      if (!response.ok || !response.data) {
        throw new Error(response.error || "Request failed");
      }

      const result = response.data;
      setMessages((current) => [...current, { role: "user", content: question }, { role: "assistant", content: result.answer }]);
      setChat({ loading: false, error: null, data: result });
    } catch (error) {
      setChat({ loading: false, error: error instanceof Error ? error.message : "Unknown error", data: null });
    }
  };

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="h-full w-full border-l border-slate-800 bg-slate-950/95 text-slate-100 shadow-glow backdrop-blur-xl">
      <div className="flex h-full flex-col">
        <header className="border-b border-slate-800 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-300">DevLens AI</p>
              <h1 className="mt-1 text-lg font-semibold text-white">{repoLabel}</h1>
            </div>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
              {session.user ? `Signed in as ${session.user.email}` : "Anonymous mode"}
            </span>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            {pageContext.kind === "file" ? `File: ${pageContext.filePath || pageContext.repositoryContext.currentFilePath}` : "Repository context loaded from GitHub."}
          </p>
        </header>

        <div className="flex flex-wrap gap-2 border-b border-slate-800 px-4 py-3">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-full px-3 py-2 text-xs font-semibold transition ${tab === item.id ? "bg-brand-500 text-white" : "bg-slate-900 text-slate-400 hover:text-slate-200"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-4">
          {tab === "summary" ? (
            <div className="space-y-4">
              <button onClick={() => void analyzeSummary()} className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white">
                Analyze Repository
              </button>
              {summary.loading ? <SkeletonBlock /> : null}
              {summary.error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{summary.error}</div> : null}
              {summary.data ? (
                <ResultCard title={summary.data.title}>
                  <div className="space-y-3 text-sm text-slate-300">
                    <p><strong className="text-white">Purpose:</strong> {summary.data.summary.repositoryPurpose}</p>
                    <p><strong className="text-white">Tech Stack:</strong> {summary.data.summary.techStack.join(", ")}</p>
                    <p><strong className="text-white">Main Components:</strong> {summary.data.summary.mainComponents.join(", ")}</p>
                    <p><strong className="text-white">Folder Breakdown:</strong> {summary.data.summary.folderBreakdown.join(" • ")}</p>
                    <p><strong className="text-white">Auth:</strong> {summary.data.summary.authenticationMethod}</p>
                    <p><strong className="text-white">Database:</strong> {summary.data.summary.databaseLayer}</p>
                    <p><strong className="text-white">External Services:</strong> {summary.data.summary.externalServices.join(", ")}</p>
                    <p><strong className="text-white">Complexity:</strong> {summary.data.summary.projectComplexity}</p>
                  </div>
                </ResultCard>
              ) : null}
            </div>
          ) : null}

          {tab === "chat" ? (
            <div className="space-y-4">
              <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-brand-500" />
              <button onClick={() => void askRepository()} className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white">
                Ask Repository
              </button>
              {chat.loading ? <SkeletonBlock /> : null}
              {chat.error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{chat.error}</div> : null}
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`rounded-2xl border p-3 text-sm ${message.role === "user" ? "border-brand-500/30 bg-brand-500/10 text-brand-50" : "border-slate-800 bg-slate-900 text-slate-300"}`}>
                    <p className="mb-1 text-[10px] uppercase tracking-[0.3em] text-slate-500">{message.role}</p>
                    {message.content}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tab === "readme" ? (
            <div className="space-y-4">
              <button onClick={() => void generateReadme()} className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white">
                Generate README
              </button>
              {readme.loading ? <SkeletonBlock /> : null}
              {readme.error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{readme.error}</div> : null}
              {readme.data ? (
                <ResultCard title={readme.data.title}>
                  <div className="space-y-3">
                    <pre className="whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300">{readme.data.readme}</pre>
                    <button onClick={() => void copyText(readme.data!.readme)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200">
                      Copy README
                    </button>
                  </div>
                </ResultCard>
              ) : null}
            </div>
          ) : null}

          {tab === "apis" ? (
            <div className="space-y-4">
              <button onClick={() => void detectApis()} className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white">
                Detect APIs
              </button>
              {apis.loading ? <SkeletonBlock /> : null}
              {apis.error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{apis.error}</div> : null}
              {apis.data ? (
                <ResultCard title={apis.data.title}>
                  <div className="space-y-2 text-sm text-slate-300">
                    {apis.data.endpoints.map((endpoint) => (
                      <div key={`${endpoint.method}-${endpoint.path}`} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                        <p className="font-semibold text-white">{endpoint.method} {endpoint.path}</p>
                        <p className="text-slate-400">{endpoint.description}</p>
                      </div>
                    ))}
                    {apis.data.notes.map((note) => <p key={note} className="text-slate-500">{note}</p>)}
                  </div>
                </ResultCard>
              ) : null}
            </div>
          ) : null}

          {tab === "diagram" ? (
            <div className="space-y-4">
              <button onClick={() => void generateDiagram()} className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white">
                Generate Diagram
              </button>
              {diagram.loading ? <SkeletonBlock /> : null}
              {diagram.error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{diagram.error}</div> : null}
              {diagram.data ? (
                <ResultCard title={diagram.data.title}>
                  <div className="space-y-3">
                    <MermaidPreview diagram={diagram.data.diagram} />
                    <p className="text-sm text-slate-300">{diagram.data.summary}</p>
                    <p className="text-sm text-slate-400">{diagram.data.explanation}</p>
                    <button onClick={() => void copyText(diagram.data!.diagram)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200">
                      Copy Mermaid
                    </button>
                  </div>
                </ResultCard>
              ) : null}
            </div>
          ) : null}

          {tab === "file" ? (
            <div className="space-y-4">
              <button onClick={() => void explainFile()} disabled={pageContext.kind !== "file"} className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
                Explain File
              </button>
              {pageContext.kind !== "file" ? <p className="text-xs text-slate-500">Open a GitHub file page to use this feature.</p> : null}
              {fileExplanation.loading ? <SkeletonBlock /> : null}
              {fileExplanation.error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{fileExplanation.error}</div> : null}
              {fileExplanation.data ? (
                <ResultCard title={fileExplanation.data.title}>
                  <div className="space-y-3 text-sm text-slate-300">
                    <p>{fileExplanation.data.purpose}</p>
                    <p><strong className="text-white">Key Functions:</strong> {fileExplanation.data.keyFunctions.join(", ")}</p>
                    <p><strong className="text-white">Dependencies:</strong> {fileExplanation.data.dependencies.join(", ")}</p>
                    <p><strong className="text-white">Important Logic:</strong> {fileExplanation.data.importantLogic.join(" • ")}</p>
                  </div>
                </ResultCard>
              ) : null}
            </div>
          ) : null}

          {tab === "function" ? (
            <div className="space-y-4">
              <button onClick={() => setSelectedCode(getSelectedCode() || pageContext.fileContent)} className="w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200">
                Capture Selected Code
              </button>
              <button onClick={() => void explainFunction()} className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white">
                Explain Function
              </button>
              <textarea value={selectedCode} onChange={(event) => setSelectedCode(event.target.value)} rows={8} className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-xs outline-none focus:border-brand-500" />
              {functionExplanation.loading ? <SkeletonBlock /> : null}
              {functionExplanation.error ? <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{functionExplanation.error}</div> : null}
              {functionExplanation.data ? (
                <ResultCard title={functionExplanation.data.title}>
                  <div className="space-y-3 text-sm text-slate-300">
                    <p>{functionExplanation.data.purpose}</p>
                    <p><strong className="text-white">Complexity:</strong> {functionExplanation.data.complexity}</p>
                    <p><strong className="text-white">Inputs:</strong> {functionExplanation.data.inputs.join(", ")}</p>
                    <p><strong className="text-white">Outputs:</strong> {functionExplanation.data.outputs.join(", ")}</p>
                    <p><strong className="text-white">Improvements:</strong> {functionExplanation.data.improvements.join(" • ")}</p>
                  </div>
                </ResultCard>
              ) : null}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}