"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef, Suspense } from "react";
import { MessageSquare, Send, Loader2, Search, Image as ImageIcon, CheckCircle2, AlertCircle, Check, X } from "lucide-react";
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
  startAt,
  endBefore,
  getDocs,
  DocumentSnapshot,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConversationItem } from "@/components/admin/ConversationItem";
import { MessageBubble } from "@/components/common/MessageBubble";
import { compressImage } from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { updateWorkspaceStats } from "@/lib/db-helpers";
import { PricingPopup } from "@/components/admin/PricingPopup";

function AdminChatContent() {
  const { user, loading: authL } = useAuth();
  const router = useRouter();
  const { workspaceId } = useParams() as { workspaceId: string };
  const searchParams = useSearchParams();
  const ownerId = searchParams.get("owner") || user?.uid || "";
  
  const [ws, setWs] = useState<any>(null);
  const [convs, setConvs] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const selected = convs.find(c => c.id === activeId);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Pagination states
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [firstVisible, setFirstVisible] = useState<QueryDocumentSnapshot | null>(null);
  const MESSAGE_LIMIT = 50;

  // Limits
  const [maxCustomers, setMaxCustomers] = useState<number>(Infinity);
  const [allowImageUpload, setAllowImageUpload] = useState<boolean>(true);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [limitReachedType, setLimitReachedType] = useState<'upload' | 'chat' | null>(null);
  const [userPlan, setUserPlan] = useState("free");

  // Helper to get the base path for this workspace
  const getWsPath = () => `users/${ownerId}/workspaces/${workspaceId}`;

  // Fetch Limit
  useEffect(() => {
    async function fetchLimit() {
      if (!ownerId) return;
      try {
        const planConfigSnap = await getDoc(doc(db, "plans_config", "global"));
        const planConfig = planConfigSnap.exists() ? planConfigSnap.data() : null;
        
        const userDocSnap = await getDoc(doc(db, "users", ownerId));
        const userData = userDocSnap.data();
        const plan = userData?.subscription?.plan || "free";
        setUserPlan(plan);
        
        // Default limits if not in config
        const limit = planConfig?.[plan]?.maxCustomers ?? (plan === 'premium' ? 1000 : plan === 'basic' ? 100 : 20);
        const imgUpload = planConfig?.[plan]?.allowImageUpload ?? (plan === 'free' ? false : true);
        
        setMaxCustomers(limit);
        setAllowImageUpload(imgUpload);
      } catch (e) {
        console.error("Error fetching limits", e);
      }
    }
    fetchLimit();
  }, [ownerId]);

  useEffect(() => {
    if (!authL && !user) router.push("/admin");
    if (workspaceId && ownerId) {
      // Fetch workspace from nested path
      getDoc(doc(db, "users", ownerId, "workspaces", workspaceId)).then(s => setWs(s.data()));
      
      // Listen to conversations (limit for optimization)
      return onSnapshot(
        query(
          collection(db, "users", ownerId, "workspaces", workspaceId, "conversations"), 
          orderBy("lastUpdatedAt", "desc"),
          limit(100)
        ), 
        s => setConvs(s.docs.map(d => ({ id: d.id, ...d.data() })))
      );
    }
  }, [workspaceId, ownerId, user, authL, router]);

  // Read receipt / auto-read logic
  useEffect(() => {
    if (!selected || !workspaceId || !ownerId) return;

    // Listen to the conversation document itself to auto-clear unread counts
    const unsubConv = onSnapshot(
      doc(db, "users", ownerId, "workspaces", workspaceId, "conversations", selected.id), 
      async (docSnap) => {
        const data = docSnap.data();
        if (data && data.unreadCountAdmin > 0) {
          const amount = data.unreadCountAdmin;
          
          // Reset conversation count
          await updateDoc(docSnap.ref, { unreadCountAdmin: 0 });
          
          // Decrement workspace count using batched update
          updateWorkspaceStats(ownerId, workspaceId, "unreadCount", -amount);
        }
      }
    );

    // Initial messages fetch
    setMsgs([]);
    setHasMore(true);
    setFirstVisible(null);

    const q = query(
      collection(db, "users", ownerId, "workspaces", workspaceId, "conversations", selected.id, "messages"), 
      orderBy("createdAt", "asc"),
      limitToLast(MESSAGE_LIMIT)
    );

    const unsubMsgs = onSnapshot(q, s => {
      const newMsgs = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setMsgs(newMsgs);
      if (s.docs.length > 0) {
        setFirstVisible(s.docs[0] as QueryDocumentSnapshot);
      }
      if (s.docs.length < MESSAGE_LIMIT) {
        setHasMore(false);
      }
      setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 100);
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
        collection(db, "users", ownerId, "workspaces", workspaceId, "conversations", selected.id, "messages"), 
        orderBy("createdAt", "asc"),
        endBefore(firstVisible),
        limitToLast(MESSAGE_LIMIT)
      );

      const snap = await getDocs(q);
      const moreMsgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (snap.docs.length < MESSAGE_LIMIT) {
        setHasMore(false);
      }

      if (snap.docs.length > 0) {
        setFirstVisible(snap.docs[0] as QueryDocumentSnapshot);
        setMsgs(prev => [...moreMsgs, ...prev]);
        // Maintain scroll position roughly
        if (scrollRef.current) {
          const oldHeight = scrollRef.current.scrollHeight;
          setTimeout(() => {
            if (scrollRef.current) {
              const newHeight = scrollRef.current.scrollHeight;
              scrollRef.current.scrollTop += (newHeight - oldHeight);
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
      collection(db, "users", ownerId, "workspaces", workspaceId, "conversations", selected.id, "messages"), 
      { 
        text: finalMsg, 
        sender: "admin", 
        createdAt: serverTimestamp() 
      }
    );
    
    await updateDoc(
      doc(db, "users", ownerId, "workspaces", workspaceId, "conversations", selected.id), 
      { 
        lastMessage: content ? "📷 Image" : finalMsg, 
        lastUpdatedAt: serverTimestamp(),
        unreadCountUser: increment(1)
      }
    );

    // Update workspace total messages using batched counter
    updateWorkspaceStats(ownerId, workspaceId, "messageCount", 1);
  };

  const toggleStatus = async () => {
    if (!selected || !workspaceId || !ownerId) return;
    const newStatus = selected.status === "resolved" ? "unresolved" : "resolved";
    
    await updateDoc(
      doc(db, "users", ownerId, "workspaces", workspaceId, "conversations", selected.id), 
      { status: newStatus }
    );
    
    // Update unresolved count using batched counter
    updateWorkspaceStats(ownerId, workspaceId, "unresolvedCount", newStatus === "unresolved" ? 1 : -1);
  };


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;

    if (!allowImageUpload) {
      setLimitReachedType('upload');
      // Reset input
      e.target.value = '';
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result as string);
        await send(undefined, compressed);
      } catch (err) {
        console.error("Error compressing image:", err);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 flex overflow-hidden relative">
      <PricingPopup isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
      
      {/* Limit Reached Alert */}
      {limitReachedType && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white dark:bg-[#1e293b] rounded-[32px] p-8 w-full max-w-sm shadow-2xl relative text-center border border-slate-100 dark:border-slate-700">
            {/* Icon */}
            <div className="w-16 h-16 bg-orange-50 dark:bg-orange-900/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} className="text-orange-500" />
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Limit Reached</h3>
            
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 leading-relaxed text-sm">
              {limitReachedType === 'upload' 
                ? <span>Image uploads are not available on the <strong className="capitalize text-slate-900 dark:text-white">{userPlan}</strong> plan.</span>
                : <span>You've reached the conversation limit for the <strong className="capitalize text-slate-900 dark:text-white">{userPlan}</strong> plan.</span>
              }
              <br/>Upgrade to unlock this feature.
            </p>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setLimitReachedType(null)}
                className="flex-1 py-3 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setLimitReachedType(null);
                  setShowUpgrade(true);
                }}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 transition-all transform active:scale-95"
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      )}

      {authL ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
        </div>
      ) : (
        <>
          {/* Sidebar List */}
          <div className="w-[380px] border-r border-[var(--border-color)] flex flex-col shrink-0 bg-[var(--bg-card)]">
            <header className="p-8 border-b border-[var(--border-color)] flex items-center justify-between">
               <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Messages</h2>
               <div className="w-8 h-8 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] opacity-50">
                  <Search size={16} />
               </div>
            </header>
            <div className="flex-1 overflow-y-auto">
              {convs.length > 0 ? (
                convs.map((c, idx) => {
                  const isLocked = idx >= maxCustomers;
                  return (
                    <ConversationItem 
                      key={c.id} 
                      conv={c} 
                      active={activeId === c.id} 
                      locked={isLocked}
                      onClick={() => {
                        if (isLocked) {
                          setLimitReachedType('chat');
                        } else {
                          setActiveId(c.id);
                        }
                      }} 
                    />
                  );
                })
              ) : (
                <div className="p-12 text-center">
                  <p className="text-sm font-bold text-[var(--text-muted)] opacity-50">No conversations yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-[var(--bg-main)] relative">
            {selected ? (
              <>
                <header className="h-24 bg-[var(--bg-card)] border-b border-[var(--border-color)] px-10 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
                      {selected.userName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-black text-base text-[var(--text-main)] tracking-tight leading-tight">{selected.userName}</h2>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider opacity-50">{selected.userEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <button 
                      onClick={toggleStatus}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-md hover:scale-105 active:scale-95",
                        selected.status === "resolved" 
                          ? "bg-green-600 text-white shadow-green-500/10" 
                          : "bg-red-600 text-white shadow-red-500/10"
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
                  </div>
                </header>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth">
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
                      const isNewDay = !prevM || (
                        m.createdAt?.toDate?.().toDateString() !== prevM.createdAt?.toDate?.().toDateString()
                      );

                      return (
                        <div key={m.id} className="flex flex-col gap-6">
                          {isNewDay && (
                            <div className="flex justify-center my-4">
                              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] px-3 py-1 rounded-full text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider shadow-sm">
                                {m.createdAt?.toDate 
                                  ? m.createdAt.toDate().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
                                  : 'Today'}
                              </div>
                            </div>
                          )}
                          <MessageBubble message={m} color={ws?.settings?.color || "#3b82f6"} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-8 pb-10">
                  <form 
                    onSubmit={(e) => send(e)} 
                    className="bg-[var(--bg-card)] p-4 rounded-[32px] border border-[var(--border-color)] shadow-2xl flex items-center gap-4 transition-all focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-500/50"
                  >
                    <div className="relative">
                      <label className="w-12 h-12 rounded-2xl flex items-center justify-center text-[var(--text-muted)] hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-all">
                        {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                        />
                      </label>
                    </div>
                    <input 
                      value={text} 
                      onChange={e => setText(e.target.value)} 
                      placeholder="Type a message..." 
                      className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold text-[var(--text-main)] placeholder:text-[var(--text-muted)]/40"
                    />
                    <Button 
                      type="submit" 
                      disabled={!text.trim() || uploading} 
                      className="h-12 w-12 rounded-2xl p-0 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0 transition-transform active:scale-90"
                      icon={Send}
                    />
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <div className="w-24 h-24 bg-[var(--bg-card)] rounded-[40px] border border-[var(--border-color)] flex items-center justify-center text-blue-500 mb-8 shadow-inner shadow-black/5 dark:shadow-white/5">
                  <MessageSquare size={40} className="opacity-20 translate-y-1" />
                </div>
                <h3 className="text-3xl font-black text-[var(--text-main)] tracking-tight mb-3">Your Inbox</h3>
                <p className="max-w-xs text-[var(--text-muted)] font-medium leading-relaxed">
                  Select a conversation from the left to start chatting with your customers.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminChat() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[var(--bg-main)]">
        <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
      </div>
    }>
      <AdminChatContent />
    </Suspense>
  );
}
