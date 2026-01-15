"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { WidgetBubble } from "@/components/widget/WidgetBubble";
import { WidgetHeader } from "@/components/widget/WidgetHeader";
import { WidgetIdentify } from "@/components/widget/WidgetIdentify";
import { WidgetChat } from "@/components/widget/WidgetChat";

export default function ChatWidget() {
  const { workspaceId } = useParams() as { workspaceId: string };
  const [isOpen, setIsOpen] = useState(false);
  const [ws, setWs] = useState<any>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [convId, setConvId] = useState<string | null>(null);

  useEffect(() => {
    if (workspaceId) {
      getDoc(doc(db, "workspaces", workspaceId)).then(s => setWs(s.data()));
      const saved = localStorage.getItem(`crisp_conv_${workspaceId}`);
      if (saved) setConvId(saved);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (convId && workspaceId) return onSnapshot(query(collection(db, "workspaces", workspaceId, "conversations", convId, "messages"), orderBy("createdAt", "asc")), s => setMsgs(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [convId, workspaceId]);

  const toggle = () => { setIsOpen(!isOpen); window.parent.postMessage(!isOpen ? 'expand' : 'collapse', '*'); };

  const onStart = async (userName: string, userEmail: string) => {
    const r = await addDoc(collection(db, "workspaces", workspaceId, "conversations"), { userName, userEmail, createdAt: serverTimestamp(), status: "open" });
    localStorage.setItem(`crisp_conv_${workspaceId}`, r.id);
    setConvId(r.id);
  };

  const onSend = async (text: string) => {
    await addDoc(collection(db, "workspaces", workspaceId, "conversations", convId!, "messages"), { text, sender: "user", createdAt: serverTimestamp() });
  };

  if (!ws) return null;
  const { color = "#3b82f6", name = ws.name, logo = "" } = ws.settings || {};

  return (
    <div className="fixed inset-0 flex flex-col items-end justify-end p-4 pointer-events-none">
      {isOpen && (
        <div className="w-full h-full max-h-[580px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border pointer-events-auto mb-4 animate-in slide-in-from-bottom-4">
          <WidgetHeader name={name} logo={logo} color={color} onCollapse={toggle} />
          {!convId ? <WidgetIdentify onStart={onStart} color={color} /> : <WidgetChat messages={msgs} onSend={onSend} color={color} />}
        </div>
      )}
      <WidgetBubble isOpen={isOpen} onClick={toggle} color={color} />
    </div>
  );
}
