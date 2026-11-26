"use client";

import { useEffect, useState, useRef } from "react";
import {
  MessageSquare,
  Send,
  Loader2,
  Search,
  Image as ImageIcon,
  AlertCircle,
  Check,
  X,
  Info,
  ArrowLeft,
} from "lucide-react";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  increment,
  limit,
  limitToLast,
  endBefore,
  getDocs,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { ConversationItem } from "@/components/admin/ConversationItem";
import { MessageBubble } from "@/components/common/MessageBubble";
import { UserSidebar } from "@/components/admin/UserSidebar";
import { compressImage } from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { updateWorkspaceStats } from "@/lib/db-helpers";
import { PricingPopup } from "@/components/admin/PricingPopup";

export interface LiveInboxConfig {
  fontFamily?: string;
  fontSize?: "sm" | "md" | "lg";
  theme?: "light" | "dark" | "system";
  accentColor?: string;
  inboxTitle?: string;
  showSearch?: boolean;
  showUserSidebar?: boolean;
  showResolveButton?: boolean;
  showImageUpload?: boolean;
  compact?: boolean;
  borderRadius?: string;
}

interface LiveInboxProps {
  workspaceId: string;
  ownerId: string;
  config?: LiveInboxConfig;
  isEmbedded?: boolean;
}

const GOOGLE_FONTS = new Set([
  "Inter",
  "Poppins",
  "Roboto",
  "Plus Jakarta Sans",
  "DM Sans",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Nunito",
  "JetBrains Mono",
  "Playfair Display",
]);

function getGoogleFontHref(fontFamily?: string): string | null {
  if (!fontFamily) return null;
  const primary = fontFamily.split(",")[0].replace(/['"]/g, "").trim();
  if (!primary || primary.toLowerCase() === "system-ui" || primary.toLowerCase() === "sans-serif" || primary.toLowerCase() === "serif" || primary.toLowerCase() === "monospace") {
    return null;
  }
  // Load from Google Fonts for known fonts or any custom single-word/multi-word webfont name
  if (GOOGLE_FONTS.has(primary) || /^[A-Za-z0-9\s]+$/.test(primary)) {
    const encoded = encodeURIComponent(primary).replace(/%20/g, "+");
    return `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700;800;900&display=swap`;
  }
  return null;
}

export function LiveInbox({
  workspaceId,
  ownerId,
  config = {},
  isEmbedded = false,
}: LiveInboxProps) {
  const [ws, setWs] = useState<any>(null);
  const [convs, setConvs] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const selected = convs.find((c) => c.id === activeId);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [showSidebar, setShowSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);

  // Pagination states
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [firstVisible, setFirstVisible] =
    useState<QueryDocumentSnapshot | null>(null);
  const MESSAGE_LIMIT = 50;

  // Limits
  const [maxCustomers, setMaxCustomers] = useState<number>(Infinity);
  const [allowImageUpload, setAllowImageUpload] = useState<boolean>(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [limitReachedType, setLimitReachedType] = useState<
    "upload" | "chat" | null
  >(null);
  const [userPlan, setUserPlan] = useState("free");

  const {
    fontFamily,
    fontSize = "md",
    theme,
    accentColor,
    inboxTitle = "Messages",
    showSearch = true,
    showUserSidebar = true,
    showResolveButton = true,
    showImageUpload = true,
    compact = false,
    borderRadius,
  } = config;

  // Dynamically load Google Font when fontFamily changes
  useEffect(() => {
    const href = getGoogleFontHref(fontFamily);
    if (!href) return;
    const id = `helpdeck-font-${fontFamily?.replace(/[^a-zA-Z0-9]/g, "-")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }, [fontFamily]);

  // Fetch Limit
  useEffect(() => {
    async function fetchLimit() {
      if (!ownerId) return;
      try {
        const planConfigSnap = await getDoc(doc(db, "plans_config", "global"));
        const planConfig = planConfigSnap.exists()
          ? planConfigSnap.data()
          : null;

        const userDocSnap = await getDoc(doc(db, "users", ownerId));
        const userData = userDocSnap.data();
        const plan = userData?.subscription?.plan || "free";
        setUserPlan(plan);

        const limitVal =
          planConfig?.[plan]?.maxCustomers ??
          (plan === "premium" ? 1000 : plan === "basic" ? 100 : 20);
        const imgUpload =
          planConfig?.[plan]?.allowImageUpload ??
          (plan === "free" ? false : true);

        setMaxCustomers(limitVal);
        setAllowImageUpload(imgUpload);
      } catch (e) {
        console.error("Error fetching limits", e);
      }
    }
    fetchLimit();
  }, [ownerId]);

  useEffect(() => {
    if (workspaceId && ownerId) {
      getDoc(doc(db, "users", ownerId, "workspaces", workspaceId)).then((s) =>
        setWs(s.data()),
      );

      return onSnapshot(
        query(
          collection(
            db,
            "users",
            ownerId,
            "workspaces",
            workspaceId,
            "conversations",
          ),
          orderBy("lastUpdatedAt", "desc"),
          limit(100),
        ),
        (s) => setConvs(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
      );
    }
  }, [workspaceId, ownerId]);

  // Read receipt / auto-read logic
  useEffect(() => {
    if (!selected || !workspaceId || !ownerId) return;

    const unsubConv = onSnapshot(
      doc(
        db,
        "users",
        ownerId,
        "workspaces",
        workspaceId,
        "conversations",
        selected.id,
      ),
      async (docSnap) => {
        const data = docSnap.data();
        if (data && data.unreadCountAdmin > 0) {
          const amount = data.unreadCountAdmin;
          await updateDoc(docSnap.ref, { unreadCountAdmin: 0 });
          updateWorkspaceStats(ownerId, workspaceId, "unreadCount", -amount);
        }
      },
    );

    setMsgs([]);
    setHasMore(true);
    setFirstVisible(null);

    const q = query(
      collection(
        db,
        "users",
        ownerId,
        "workspaces",
        workspaceId,
        "conversations",
        selected.id,
        "messages",
      ),
      orderBy("createdAt", "asc"),
      limitToLast(MESSAGE_LIMIT),
    );

    const unsubMsgs = onSnapshot(q, (s) => {
      const newMsgs = s.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMsgs(newMsgs);
      if (s.docs.length > 0) {
        setFirstVisible(s.docs[0] as QueryDocumentSnapshot);
      }
      if (s.docs.length < MESSAGE_LIMIT) {
        setHasMore(false);
      }
      setTimeout(
        () => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight),
        100,
      );
    });

    return () => {
      unsubConv();
      unsubMsgs();
    };
  }, [selected?.id, workspaceId, ownerId]);

  const loadMore = async () => {
    if (loadingMore || !hasMore || !firstVisible || !selected) return;
    setLoadingMore(true);

    try {
      const q = query(
        collection(
          db,
          "users",
          ownerId,
          "workspaces",
          workspaceId,
          "conversations",
          selected.id,
          "messages",
        ),
        orderBy("createdAt", "asc"),
        endBefore(firstVisible),
        limitToLast(MESSAGE_LIMIT),
      );

      const snap = await getDocs(q);
      const moreMsgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (snap.docs.length < MESSAGE_LIMIT) {
        setHasMore(false);
      }

      if (snap.docs.length > 0) {
        setFirstVisible(snap.docs[0] as QueryDocumentSnapshot);
        setMsgs((prev) => [...moreMsgs, ...prev]);
        if (scrollRef.current) {
          const oldHeight = scrollRef.current.scrollHeight;
          setTimeout(() => {
            if (scrollRef.current) {
              const newHeight = scrollRef.current.scrollHeight;
              scrollRef.current.scrollTop += newHeight - oldHeight;
            }
          }, 0);
        }
      }
    } catch (err) {
      console.error("Error loading more messages:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const send = async (e?: React.FormEvent, content?: string) => {
    if (e) e.preventDefault();
    const finalMsg = content || text;
    if (!finalMsg.trim() || !selected || !ownerId) return;

    if (!content) setText("");

    await addDoc(
      collection(
        db,
        "users",
        ownerId,
        "workspaces",
        workspaceId,
        "conversations",
        selected.id,
        "messages",
      ),
      {
        text: finalMsg,
        sender: "admin",
        createdAt: serverTimestamp(),
      },
    );

    await updateDoc(
      doc(
        db,
        "users",
        ownerId,
        "workspaces",
        workspaceId,
        "conversations",
        selected.id,
      ),
      {
        lastMessage: content ? "📷 Image" : finalMsg,
        lastUpdatedAt: serverTimestamp(),
        unreadCountUser: increment(1),
      },
    );

    updateWorkspaceStats(ownerId, workspaceId, "messageCount", 1);
  };

  const toggleStatus = async () => {
    if (!selected || !workspaceId || !ownerId) return;
    const newStatus =
      selected.status === "resolved" ? "unresolved" : "resolved";

    await updateDoc(
      doc(
        db,
        "users",
        ownerId,
        "workspaces",
        workspaceId,
        "conversations",
        selected.id,
      ),
      { status: newStatus },
    );

    updateWorkspaceStats(
      ownerId,
      workspaceId,
      "unresolvedCount",
      newStatus === "unresolved" ? 1 : -1,
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;

    if (!allowImageUpload) {
      setLimitReachedType("upload");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const compressedBase64 = await compressImage(base64, 1200, 1200, 0.7);

      const response = await fetch(compressedBase64);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append("file", blob, "image.jpg");
      formData.append("folder", "admin-uploads");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      await send(undefined, data.secure_url);
    } catch (err) {
      console.error("Error uploading image to Cloudinary:", err);
      alert("Failed to upload image.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const resolvedAccent = accentColor || ws?.settings?.color || "#3b82f6";

  const filteredConvs = searchQuery.trim()
    ? convs.filter((c) => {
        const q = searchQuery.toLowerCase();
        return (
          c.userName?.toLowerCase().includes(q) ||
          c.userEmail?.toLowerCase().includes(q) ||
          c.lastMessage?.toLowerCase().includes(q)
        );
      })
    : convs;

  const fontSizeClass =
    fontSize === "sm"
      ? "text-[13px]"
      : fontSize === "lg"
        ? "text-[16px]"
        : "text-[14px]";

  const themeClass =
    theme === "dark" ? "dark" : theme === "light" ? "light" : "";

  return (
    <div
      data-theme={theme && theme !== "system" ? theme : undefined}
      style={{
        fontFamily: fontFamily || undefined,
        borderRadius: borderRadius || undefined,
        ["--primary" as any]: resolvedAccent,
      }}
      className={cn(
        "flex-1 flex overflow-hidden relative h-full w-full bg-[var(--bg-main)] text-[var(--text-main)]",
        themeClass,
        fontSizeClass,
      )}
    >
      {!isEmbedded && (
        <PricingPopup
          isOpen={showUpgrade}
          onClose={() => setShowUpgrade(false)}
        />
      )}

      {/* Limit Reached Alert */}
      {limitReachedType && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-[32px] p-8 w-full max-w-sm shadow-2xl relative text-center border border-slate-100 dark:border-slate-700">
            <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} className="text-orange-500" />
            </div>

            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
              Limit Reached
            </h3>

            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed text-sm">
              {limitReachedType === "upload" ? (
                <span>
                  Image uploads are not available on the{" "}
                  <strong className="capitalize text-slate-900 dark:text-white">
                    {userPlan}
                  </strong>{" "}
                  plan.
                </span>
              ) : (
                <span>
                  You&apos;ve reached the conversation limit for the{" "}
                  <strong className="capitalize text-slate-900 dark:text-white">
                    {userPlan}
                  </strong>{" "}
                  plan.
                </span>
              )}
              <br />
              Upgrade to unlock this feature.
            </p>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setLimitReachedType(null)}
                className="flex-1 py-3 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              {!isEmbedded && (
                <button
                  onClick={() => {
                    setLimitReachedType(null);
                    setShowUpgrade(true);
                  }}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all transform active:scale-95"
                >
                  Upgrade
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sidebar List */}
      <div
        className={cn(
          "border-r border-[var(--border-color)] flex flex-col shrink-0 bg-[var(--bg-card)]",
          compact ? "w-[280px] sm:w-[300px]" : "w-full sm:w-[340px] lg:w-[380px]",
          selected ? "hidden sm:flex" : "flex",
        )}
      >
        <header
          className={cn(
            "border-b border-[var(--border-color)] flex flex-col gap-3",
            compact ? "p-5" : "p-6 sm:p-8",
          )}
        >
          <div className="flex items-center justify-between">
            <h2
              className={cn(
                "font-black text-[var(--text-main)] tracking-tight truncate",
                compact ? "text-xl" : "text-2xl",
              )}
            >
              {inboxTitle}
            </h2>
            {showSearch && (
              <button
                type="button"
                onClick={() => {
                  setShowSearchInput((v) => !v);
                  if (showSearchInput) setSearchQuery("");
                }}
                className={cn(
                  "w-8 h-8 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center transition-colors",
                  showSearchInput
                    ? "text-blue-600 border-blue-500/40"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]",
                )}
                title="Search conversations"
              >
                <Search size={16} />
              </button>
            )}
          </div>
          {showSearch && showSearchInput && (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, email, or message..."
                className="w-full px-3.5 py-2 text-xs font-medium rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-main)] placeholder:text-[var(--text-muted)]/60 outline-none focus:border-blue-500"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filteredConvs.length > 0 ? (
            filteredConvs.map((c, idx) => {
              const isLocked = idx >= maxCustomers;
              return (
                <ConversationItem
                  key={c.id}
                  conv={c}
                  active={activeId === c.id}
                  locked={isLocked}
                  onClick={() => {
                    if (isLocked) {
                      setLimitReachedType("chat");
                    } else {
                      setActiveId(c.id);
                    }
                  }}
                />
              );
            })
          ) : (
            <div className="p-12 text-center">
              <p className="text-sm font-bold text-[var(--text-muted)] opacity-50">
                {searchQuery ? "No matching conversations" : "No conversations yet"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        className={cn(
          "flex-1 flex flex-col bg-[var(--bg-main)] relative min-w-0",
          !selected ? "hidden sm:flex" : "flex",
        )}
      >
        {selected ? (
          <>
            <header
              className={cn(
                "bg-[var(--bg-card)] border-b border-[var(--border-color)] flex items-center justify-between shrink-0",
                compact ? "h-16 px-5" : "h-20 sm:h-24 px-6 sm:px-10",
              )}
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  className="sm:hidden w-9 h-9 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)]"
                  title="Back to conversations"
                >
                  <ArrowLeft size={16} />
                </button>
                <div
                  style={{ backgroundColor: resolvedAccent }}
                  className={cn(
                    "rounded-2xl flex items-center justify-center text-white font-black shadow-lg shrink-0",
                    compact ? "w-10 h-10 text-base" : "w-12 h-12 text-xl",
                  )}
                >
                  {selected.userName?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <h2 className="font-black text-base text-[var(--text-main)] tracking-tight leading-tight truncate">
                    {selected.userName}
                  </h2>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider opacity-60 truncate">
                    {selected.userEmail}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                {showUserSidebar && (
                  <button
                    onClick={() => setShowSidebar(!showSidebar)}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-[var(--bg-main)] hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-blue-600 border border-[var(--border-color)]",
                      showSidebar &&
                        "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
                    )}
                    title="User Details"
                  >
                    <Info size={20} />
                  </button>
                )}

                {showResolveButton && (
                  <button
                    onClick={toggleStatus}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-md hover:scale-105 active:scale-95",
                      selected.status === "resolved"
                        ? "bg-green-600 text-white shadow-green-500/10"
                        : "bg-red-600 text-white shadow-red-500/10",
                    )}
                  >
                    {selected.status === "resolved" ? (
                      <>
                        <Check size={14} strokeWidth={4} />
                        <span>Resolved</span>
                      </>
                    ) : (
                      <>
                        <X size={14} strokeWidth={4} />
                        <span>Unresolved</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </header>

            <div
              ref={scrollRef}
              className={cn(
                "flex-1 overflow-y-auto space-y-8 scroll-smooth no-scrollbar",
                compact ? "p-5" : "p-6 sm:p-10",
              )}
            >
              {hasMore && (
                <div className="flex justify-center pb-4">
                  <Button
                    variant="secondary"
                    onClick={loadMore}
                    loading={loadingMore}
                    className="text-[10px] font-black uppercase tracking-widest h-8 px-4 rounded-full border border-[var(--border-color)]"
                  >
                    Load Previous Messages
                  </Button>
                </div>
              )}

              <div className="flex flex-col gap-6">
                {msgs.map((m, i) => {
                  const prevM = msgs[i - 1];
                  const isNewDay =
                    !prevM ||
                    m.createdAt?.toDate?.().toDateString() !==
                      prevM.createdAt?.toDate?.().toDateString();

                  return (
                    <div key={m.id} className="flex flex-col gap-6">
                      {isNewDay && (
                        <div className="flex justify-center my-4">
                          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-1 rounded-full text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider shadow-sm">
                            {m.createdAt?.toDate
                              ? m.createdAt
                                  .toDate()
                                  .toLocaleDateString(undefined, {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                  })
                              : "Today"}
                          </div>
                        </div>
                      )}
                      <MessageBubble
                        message={m}
                        color={resolvedAccent}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={cn(compact ? "p-4" : "p-6 sm:p-8 sm:pb-10")}>
              <form
                onSubmit={(e) => send(e)}
                className="bg-[var(--bg-card)] p-3 sm:p-4 rounded-[32px] border border-[var(--border-color)] shadow-2xl flex items-center gap-3 sm:gap-4 transition-all focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-500/50"
              >
                {showImageUpload && (
                  <div className="relative">
                    <label className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-[var(--text-muted)] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all">
                      {uploading ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <ImageIcon size={20} />
                      )}
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                )}
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent border-none outline-none px-3 sm:px-4 text-sm font-bold text-[var(--text-main)] placeholder:text-[var(--text-muted)]/40 min-w-0"
                />
                <Button
                  type="submit"
                  disabled={!text.trim() || uploading}
                  style={{ backgroundColor: resolvedAccent }}
                  className="h-11 w-11 sm:h-12 sm:w-12 rounded-2xl p-0 flex items-center justify-center shadow-lg shrink-0 transition-transform active:scale-90 border-none text-white"
                  icon={Send}
                />
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            <div className="w-24 h-24 bg-[var(--bg-card)] rounded-[40px] border border-[var(--border-color)] flex items-center justify-center text-blue-500 mb-8 shadow-inner shadow-black/5 dark:shadow-white/5">
              <MessageSquare
                size={40}
                style={{ color: resolvedAccent }}
                className="opacity-40 translate-y-1"
              />
            </div>
            <h3 className="text-3xl font-black text-[var(--text-main)] tracking-tight mb-3">
              {inboxTitle || "Your Inbox"}
            </h3>
            <p className="max-w-xs text-[var(--text-muted)] font-medium leading-relaxed">
              Select a conversation from the left to start chatting with your
              customers.
            </p>
          </div>
        )}
      </div>

      {showUserSidebar && (
        <UserSidebar
          isOpen={showSidebar}
          onClose={() => setShowSidebar(false)}
          workspaceId={workspaceId}
          ownerId={ownerId}
          conversation={selected}
        />
      )}
    </div>
  );
}
