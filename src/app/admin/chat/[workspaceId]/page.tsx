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

  if (authL) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <AdminSidebar activeTab="chat" workspaceId={workspaceId} />
      <div className="w-80 border-r flex flex-col shrink-0">
        <div className="p-4 border-b"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><Input placeholder="Search..." className="pl-10" /></div></div>
        <div className="flex-1 overflow-y-auto">{convs.map(c => <ConversationItem key={c.id} conv={c} active={selected?.id === c.id} onClick={() => setSelected(c)} />)}</div>
      </div>
      <div className="flex-1 flex flex-col bg-gray-50">
        {selected ? (
          <>
            <header className="h-16 bg-white border-b px-6 flex items-center justify-between">
              <div><h2 className="font-bold text-sm">{selected.userName}</h2><p className="text-[10px] text-gray-500">{selected.userEmail}</p></div>
            </header>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
              {msgs.map(m => <MessageBubble key={m.id} message={m} color={ws?.settings?.color || "#3b82f6"} />)}
            </div>
            <form onSubmit={send} className="p-4 bg-white border-t flex gap-4"><Input value={text} onChange={e => setText(e.target.value)} placeholder="Type a reply..." /><Button type="submit" icon={Send} disabled={!text.trim()} /></form>
          </>
        ) : <div className="flex-1 flex flex-col items-center justify-center text-center"><MessageSquare size={40} className="text-gray-200 mb-4" /><h3 className="text-xl font-bold text-gray-400">Select a conversation</h3></div>}
      </div>
    </div>
  );
}
