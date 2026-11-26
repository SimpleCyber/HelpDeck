"use client";

import { useAuth } from "@/lib/auth-context";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LiveInbox, LiveInboxConfig } from "@/components/inbox/LiveInbox";
import { Loader2, Lock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

function parseBoolParam(val: string | null, defaultVal: boolean): boolean {
  if (val === null) return defaultVal;
  return val !== "false" && val !== "0";
}

function EmbeddedInboxContent() {
  const { user, loading: authL, signInWithGoogle, signInWithEmail } = useAuth();
  const { workspaceId } = useParams() as { workspaceId: string };
  const searchParams = useSearchParams();
  const ownerId = searchParams.get("owner") || user?.uid || "";

  const [ws, setWs] = useState<any>(null);
  const [wsLoading, setWsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  const [postMessageConfig, setPostMessageConfig] =
    useState<LiveInboxConfig>({});

  // Build config from URL query params + any postMessage overrides
  const config: LiveInboxConfig = {
    fontFamily:
      postMessageConfig.fontFamily ??
      (searchParams.get("font") || undefined),
    fontSize:
      postMessageConfig.fontSize ??
      ((searchParams.get("fontSize") as "sm" | "md" | "lg") || "md"),
    theme:
      postMessageConfig.theme ??
      ((searchParams.get("theme") as "light" | "dark" | "system") || "system"),
    accentColor:
      postMessageConfig.accentColor ??
      (searchParams.get("accent") || undefined),
    inboxTitle:
      postMessageConfig.inboxTitle ??
      (searchParams.get("title") || "Messages"),
    showSearch:
      postMessageConfig.showSearch ??
      parseBoolParam(searchParams.get("search"), true),
    showUserSidebar:
      postMessageConfig.showUserSidebar ??
      parseBoolParam(searchParams.get("sidebar"), true),
    showResolveButton:
      postMessageConfig.showResolveButton ??
      parseBoolParam(searchParams.get("resolve"), true),
    showImageUpload:
      postMessageConfig.showImageUpload ??
      parseBoolParam(searchParams.get("upload"), true),
    compact:
      postMessageConfig.compact ??
      parseBoolParam(searchParams.get("compact"), false),
    borderRadius:
      postMessageConfig.borderRadius ??
      (searchParams.get("radius") || undefined),
  };

  // Listen for live config updates via postMessage from parent page
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "HELPDECK_INBOX_CONFIG" && event.data?.config) {
        setPostMessageConfig((prev) => ({ ...prev, ...event.data.config }));
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Load workspace metadata to verify permissions
  useEffect(() => {
    if (!user || !workspaceId || !ownerId) {
      setWsLoading(false);
      return;
    }
    setWsLoading(true);
    getDoc(doc(db, "users", ownerId, "workspaces", workspaceId))
      .then((snap) => {
        setWs(snap.exists() ? snap.data() : null);
      })
      .catch((err) => {
        console.error("Embedded inbox workspace fetch error:", err);
        setWs(null);
      })
      .finally(() => setWsLoading(false));
  }, [user, workspaceId, ownerId]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setSigningIn(true);
    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      setAuthError(err?.message || "Invalid email or password");
    } finally {
      setSigningIn(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError("");
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setAuthError(err?.message || "Google sign-in failed or was blocked");
    } finally {
      setSigningIn(false);
    }
  };

  const themeClass =
    config.theme === "dark"
      ? "dark"
      : config.theme === "light"
        ? "light"
        : "";

  if (authL || (user && wsLoading)) {
    return (
      <div
        data-theme={
          config.theme && config.theme !== "system" ? config.theme : undefined
        }
        style={{ fontFamily: config.fontFamily || undefined }}
        className={cn(
          "flex h-screen w-screen items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)]",
          themeClass,
        )}
      >
        <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div
        data-theme={
          config.theme && config.theme !== "system" ? config.theme : undefined
        }
        style={{ fontFamily: config.fontFamily || undefined }}
        className={cn(
          "flex h-screen w-screen items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)] p-6",
          themeClass,
        )}
      >
        <div className="w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[28px] p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mx-auto">
              <Lock size={22} />
            </div>
            <h1 className="text-xl font-black tracking-tight">
              Sign in to {config.inboxTitle || "Live Inbox"}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              Authenticate with your HelpDeck account to view and reply to
              conversations.
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium">
              {authError}
            </div>
          )}

          <Button
            type="button"
            onClick={handleGoogleSignIn}
            loading={signingIn}
            variant="secondary"
            className="w-full h-11 rounded-xl font-bold"
          >
            Continue with Google
          </Button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[var(--border-color)] w-full" />
            <span className="bg-[var(--bg-card)] px-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              or
            </span>
            <div className="border-t border-[var(--border-color)] w-full" />
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-3">
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button
              type="submit"
              loading={signingIn}
              style={{
                backgroundColor: config.accentColor || undefined,
              }}
              className="w-full h-11 rounded-xl font-bold border-none"
            >
              Sign In
            </Button>
          </form>

          <div className="text-center">
            <a
              href={`/admin/chat/${workspaceId}${ownerId ? `?owner=${ownerId}` : ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-blue-600 transition-colors"
            >
              Open full inbox in new tab
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  const hasAccess =
    ws &&
    (ws.ownerId === user.uid ||
      ownerId === user.uid ||
      ws.ownerEmail === user.email ||
      (Array.isArray(ws.memberEmails) &&
        user.email &&
        ws.memberEmails.includes(user.email)));

  if (!ws || !hasAccess) {
    return (
      <div
        data-theme={
          config.theme && config.theme !== "system" ? config.theme : undefined
        }
        style={{ fontFamily: config.fontFamily || undefined }}
        className={cn(
          "flex h-screen w-screen items-center justify-center bg-[var(--bg-main)] text-[var(--text-main)] p-6 text-center",
          themeClass,
        )}
      >
        <div className="max-w-sm space-y-2">
          <h2 className="text-lg font-black">Access Denied</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Your account ({user.email}) does not have permission to access this
            workspace&apos;s Live Inbox.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex">
      <LiveInbox
        workspaceId={workspaceId}
        ownerId={ownerId}
        config={config}
        isEmbedded
      />
    </div>
  );
}

export default function EmbeddedInboxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[var(--bg-main)]">
          <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
        </div>
      }
    >
      <EmbeddedInboxContent />
    </Suspense>
  );
}
