import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { sendMessage } from "./utils/chrome.js";
import "./styles.css";

type SessionState = {
  user?: {
    id: string;
    email: string;
    plan: string;
  };
};

function PopupApp() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [session, setSession] = useState<SessionState>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      const response = await sendMessage<{ ok: boolean; data?: SessionState }>({ type: "DEVLENS_GET_SESSION" });
      if (response.ok && response.data) {
        setSession(response.data);
      }
    })();
  }, []);

  const submit = async () => {
    setLoading(true);
    setStatus(null);

    try {
      const messageType = mode === "login" ? "DEVLENS_LOGIN" : "DEVLENS_REGISTER";
      const response = await sendMessage<{ ok: boolean; data?: { user: SessionState["user"]; token: string }; error?: string }>({
        type: messageType,
        payload: { email, password }
      });

      if (!response.ok || !response.data) {
        throw new Error(response.error || "Authentication failed");
      }

      setSession({ user: response.data.user });
      setStatus(`Signed in as ${response.data.user?.email}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await sendMessage({ type: "DEVLENS_LOGOUT" });
    setSession({});
    setStatus("Signed out");
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100">
      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-glow">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-brand-300">DevLens AI</p>
          <h1 className="mt-2 text-xl font-semibold text-white">Repository intelligence</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">Sign in to save history and unlock free-tier limits.</p>
        </div>

        {session.user ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            Signed in as {session.user.email}
            <button type="button" onClick={() => void signOut()} className="mt-3 block rounded-lg border border-emerald-400/30 px-3 py-2 text-xs font-semibold text-emerald-100">
              Sign out
            </button>
          </div>
        ) : (
          <>
            <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1 text-sm">
              <button type="button" onClick={() => setMode("login")} className={`flex-1 rounded-lg px-3 py-2 ${mode === "login" ? "bg-brand-500 text-white" : "text-slate-400"}`}>
                Login
              </button>
              <button type="button" onClick={() => setMode("register")} className={`flex-1 rounded-lg px-3 py-2 ${mode === "register" ? "bg-brand-500 text-white" : "text-slate-400"}`}>
                Register
              </button>
            </div>

            <label className="block text-sm">
              <span className="mb-1 block text-slate-400">Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 outline-none focus:border-brand-500" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-400">Password</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 outline-none focus:border-brand-500" />
            </label>
            <button type="button" onClick={() => void submit()} disabled={loading} className="w-full rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
              {loading ? "Working..." : mode === "login" ? "Login" : "Create account"}
            </button>
          </>
        )}

        {status ? <p className="text-sm text-slate-300">{status}</p> : null}
      </div>
    </div>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<PopupApp />);
}