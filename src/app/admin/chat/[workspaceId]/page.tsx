"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { MessageSquare, Send, Loader2, Search } from "lucide-react";
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ConversationItem } from "@/components/admin/ConversationItem";
import { MessageBubble } from "@/components/common/MessageBubble";

export default function AdminChat() {
  const { user, loading: authL } = useAuth();
  const router = useRouter();
  const { workspaceId } = useParams() as { workspaceId: string };
  const [ws, setWs] = useState<any>(null);
  const [convs, setConvs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authL && !user) router.push("/admin");
    if (workspaceId) {
      getDoc(doc(db, "workspaces", workspaceId)).then(s => setWs(s.data()));
      return onSnapshot(query(collection(db, "workspaces", workspaceId, "conversations"), orderBy("createdAt", "desc")), s => setConvs(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    }
  }, [workspaceId, user, authL]);

  useEffect(() => {
    if (selected) return onSnapshot(query(collection(db, "workspaces", workspaceId, "conversations", selected.id, "messages"), orderBy("createdAt", "asc")), s => {
      setMsgs(s.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight), 100);
    });
  }, [selected, workspaceId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !selected) return;
    const msg = text; setText("");
    await addDoc(collection(db, "workspaces", workspaceId, "conversations", selected.id, "messages"), { text: msg, sender: "admin", createdAt: serverTimestamp() });
    await updateDoc(doc(db, "workspaces", workspaceId, "conversations", selected.id), { lastMessage: msg, lastUpdatedAt: serverTimestamp() });
  };

  return (
    <div className="flex h-screen bg-[var(--bg-main)] overflow-hidden">
      <AdminSidebar activeTab="chat" workspaceId={workspaceId} />
      
      <div className="flex-1 flex overflow-hidden">
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
            convs.map(c => <ConversationItem key={c.id} conv={c} active={selected?.id === c.id} onClick={() => setSelected(c)} />)
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
                  <h2 className="font-black text-base text-[var(--text-main)] tracking-tight">{selected.userName}</h2>
                  <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest opacity-60">{selected.userEmail}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-green-500/20 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Active Now
                 </div>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 scroll-smooth">
              <div className="flex flex-col gap-6">
                {msgs.map(m => <MessageBubble key={m.id} message={m} color={ws?.settings?.color || "#3b82f6"} />)}
              </div>
            </div>

            <div className="p-8 pb-10">
              <form 
                onSubmit={send} 
                className="bg-[var(--bg-card)] p-4 rounded-[32px] border border-[var(--border-color)] shadow-2xl flex items-center gap-4 transition-all focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-500/50"
              >
                <input 
                  value={text} 
                  onChange={e => setText(e.target.value)} 
                  placeholder="Type a message..." 
                  className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-bold text-[var(--text-main)] placeholder:text-[var(--text-muted)]/40"
                />
                <Button 
                   type="submit" 
                   disabled={!text.trim()} 
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
    </div>
  );
}
