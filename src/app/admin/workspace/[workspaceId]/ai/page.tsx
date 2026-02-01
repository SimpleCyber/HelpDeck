"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import {
  Save,
  Loader2,
  Zap,
  Globe,
  Key,
  CheckCircle2,
  AlertCircle,
  Info,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { invalidateCache, cacheKeys } from "@/lib/redis";

function AISettingsContent() {
  const { user, loading: authL } = useAuth();
  const router = useRouter();
  const { workspaceId } = useParams() as { workspaceId: string };
  const searchParams = useSearchParams();
  const ownerId = searchParams.get("owner") || user?.uid || "";

  const [ws, setWs] = useState<any>(null);
  const [formData, setFormData] = useState({
    aiWebsiteInfo: "",
    aiGeminiKey: "",
    aiEnabled: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authL && !user) router.push("/admin");
    if (workspaceId && ownerId) {
      return onSnapshot(
        doc(db, "users", ownerId, "workspaces", workspaceId),
        (s: any) => {
          const data = s.data();
          if (data) {
            setWs(data);
            setFormData({
              aiWebsiteInfo: data.aiSettings?.aiWebsiteInfo || "",
              aiGeminiKey: data.aiSettings?.aiGeminiKey || "",
              aiEnabled: data.aiSettings?.aiEnabled || false,
            });
          }
        },
      );
    }
  }, [workspaceId, ownerId, user, authL, router]);

  const handleSave = async () => {
    if (!ws || (ws.ownerId !== user?.uid && user?.email !== ws.ownerEmail))
      return;
    setSaving(true);
    try {
      const wsRef = doc(db, "users", ownerId, "workspaces", workspaceId);
      await updateDoc(wsRef, {
        aiSettings: formData,
      });

      // Invalidate workspace cache
      await invalidateCache(cacheKeys.workspace(workspaceId));
    } catch (err) {
      console.error("Error saving AI settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const isOwner = ws?.ownerId === user?.uid || user?.email === ws?.ownerEmail;

  // Calculate some stats for the cards
  const wordCount = formData.aiWebsiteInfo.trim()
    ? formData.aiWebsiteInfo.trim().split(/\s+/).length
    : 0;
  const isConfigured = !!(
    formData.aiWebsiteInfo.trim() && formData.aiGeminiKey.trim()
  );
  const hasKey = !!formData.aiGeminiKey.trim();
  const charLimit = 50000;
  const charPercentage = Math.min(
    (formData.aiWebsiteInfo.length / charLimit) * 100,
    100,
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {authL || !ws ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
        </div>
      ) : (
        <>
          <main className="flex-1 overflow-y-auto p-12 bg-[var(--bg-main)]">
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-black text-[var(--text-main)] mb-2 flex items-center gap-3">
                    AI Automation
                  </h1>
                  <p className="text-[var(--text-muted)]">
                    Configure your AI-assisted chatbot to help your users.
                  </p>
                </div>
                {isOwner && (
                  <div className="flex items-center gap-4">
                    <Button
                      icon={Save}
                      loading={saving}
                      onClick={handleSave}
                      className="h-12 px-8 rounded-2xl shadow-xl shadow-blue-500/20 text-sm font-black uppercase tracking-widest"
                    >
                      Save Changes
                    </Button>
                  </div>
                )}
              </header>

              {/* Main Settings Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Website Information (Left - 8/12) */}
                <div className="lg:col-span-8 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[40px] p-10 space-y-8 shadow-sm flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
                        <MessageSquare size={24} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">
                          Website Context
                        </h2>
                        <p className="text-sm text-[var(--text-muted)] font-medium">
                          Feed the chat box with your knowledge.
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest block mb-1">
                        Character Count
                      </span>
                      <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        {formData.aiWebsiteInfo.length}
                      </span>
                    </div>
                  </div>

                  <textarea
                    value={formData.aiWebsiteInfo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        aiWebsiteInfo: e.target.value,
                      })
                    }
                    placeholder="Describe your business, services, pricing, and FAQ. This data helps the AI answer user queries accurately."
                    className="flex-1 min-h-[300px] w-full bg-transparent text-[var(--text-main)] rounded-2xl border border-[var(--border-color)] p-6 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none font-medium leading-relaxed"
                  />

                  <div className="flex items-center gap-4 p-6 bg-blue-50/50 rounded-[24px] border border-blue-100">
                    <Info className="text-blue-500 shrink-0" size={20} />
                    <p className="text-xs text-blue-700 font-medium leading-relaxed">
                      Pro Tip: Use bullet points and clear headings to help the
                      AI understand your content better.
                    </p>
                  </div>
                </div>

                {/* API Configuration (Right - 4/12) */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[40px] p-10 space-y-8 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="bg-purple-50 text-purple-600 p-3 rounded-2xl">
                        <Key size={24} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight">
                          API Key
                        </h2>
                        <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">
                          Google Gemini
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <Input
                        label="Your Gemini API Key"
                        type="password"
                        placeholder="AIzaSy..."
                        value={formData.aiGeminiKey}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            aiGeminiKey: e.target.value,
                          })
                        }
                        className="rounded-2xl"
                      />

                      <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-end gap-3">
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-all group"
                        >
                          <ExternalLink
                            size={12}
                            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                          />
                          Get Key
                        </a>
                        <Button
                          icon={Save}
                          loading={saving}
                          onClick={handleSave}
                          className="h-10 px-6 rounded-xl text-xs font-black uppercase tracking-widest"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Visual Status Card */}
                  <div
                    className={cn(
                      "p-10 rounded-[40px] border transition-all duration-500 flex flex-col items-center text-center space-y-6",
                      isConfigured
                        ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-xl shadow-green-500/20 border-transparent"
                        : "bg-slate-50 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800",
                    )}
                  >
                    <div
                      className={cn(
                        "w-20 h-20 rounded-[28px] flex items-center justify-center shadow-lg",
                        isConfigured
                          ? "bg-white/20 backdrop-blur-md"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-400",
                      )}
                    >
                      <Zap
                        size={40}
                        fill={isConfigured ? "white" : "none"}
                        className={cn(isConfigured && "animate-pulse")}
                      />
                    </div>
                    <div>
                      <h3
                        className={cn(
                          "text-2xl font-black tracking-tight mb-2",
                          isConfigured
                            ? "text-white"
                            : "text-[var(--text-main)]",
                        )}
                      >
                        {isConfigured ? "Blast Off!" : "Almost There"}
                      </h3>
                      <p
                        className={cn(
                          "text-sm font-medium leading-relaxed",
                          isConfigured
                            ? "text-green-50"
                            : "text-[var(--text-muted)]",
                        )}
                      >
                        {isConfigured
                          ? "Your AI chatbot is fully configured and ready to handle customer inquiries."
                          : "Provide website context and an API key to enable AI powered support."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </>
      )}
    </div>
  );
}

export default function AISettings() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[var(--bg-main)]">
          <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
        </div>
      }
    >
      <AISettingsContent />
    </Suspense>
  );
}
