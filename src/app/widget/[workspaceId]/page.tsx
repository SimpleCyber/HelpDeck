"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { WidgetBubble } from "@/components/widget/WidgetBubble";
import { WidgetHeader } from "@/components/widget/WidgetHeader";
import { WidgetIdentify } from "@/components/widget/WidgetIdentify";
import { WidgetChat } from "@/components/widget/WidgetChat";
import { AlertCircle } from "lucide-react";

function WidgetContent({ workspaceId }: { workspaceId: string }) {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [ws, setWs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [convId, setConvId] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.backgroundColor = 'transparent';
    document.documentElement.style.backgroundColor = 'transparent';
  }, []);

  useEffect(() => {
    if (!workspaceId) return;
    getDoc(doc(db, "workspaces", workspaceId)).then(s => {
      setWs(s.exists() ? s.data() : null);
      setLoading(false);
    });
    const userStr = searchParams.get("user");
    if (userStr) { try { resumeOrStart(JSON.parse(decodeURIComponent(userStr))); } catch (e) {} } else {
      const saved = localStorage.getItem(`crisp_conv_${workspaceId}`);
      if (saved) setConvId(saved);
    }
  }, [workspaceId, searchParams]);

  const resumeOrStart = async (u: any) => {
    const q = query(collection(db, "workspaces", workspaceId, "conversations"), where(u.userId ? "externalId" : "userEmail", "==", u.userId || u.email), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      setConvId(snap.docs[0].id);
      localStorage.setItem(`crisp_conv_${workspaceId}`, snap.docs[0].id);
    } else { onStart(u.name || "User", u.email || "", u.userId || null); }
  };

  useEffect(() => {
    if (convId && workspaceId) return onSnapshot(query(collection(db, "workspaces", workspaceId, "conversations", convId, "messages"), orderBy("createdAt", "asc")), s => setMsgs(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [convId, workspaceId]);

  const toggle = () => { setIsOpen(!isOpen); window.parent.postMessage(!isOpen ? 'expand' : 'collapse', '*'); };

  const onStart = async (userName: string, userEmail: string, externalId: string | null = null) => {
    const r = await addDoc(collection(db, "workspaces", workspaceId, "conversations"), { userName, userEmail, externalId, createdAt: serverTimestamp(), status: "open" });
    localStorage.setItem(`crisp_conv_${workspaceId}`, r.id);
    setConvId(r.id);
  };

  if (loading) return null;

  if (!ws) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: `html, body { background: transparent !important; overflow: hidden !important; margin: 0; padding: 0; }` }} />
        <div className="fixed bottom-2 right-2 flex flex-col items-end pointer-events-none">
          {isOpen && (
            <div className="w-80 h-[400px] bg-[#fafafa]/95 backdrop-blur-xl rounded-[2rem] shadow-2xl flex flex-col items-center justify-center p-8 text-center border pointer-events-auto mb-3 animate-in slide-in-from-bottom-4 transition-all duration-300">
               <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center text-red-500 mb-6"><AlertCircle size={32} /></div>
               <h3 className="font-bold text-lg mb-2">Out of Service</h3>
               <p className="text-gray-400 text-sm leading-relaxed">This help desk is currently unavailable.</p>
            </div>
          )}
          <WidgetBubble isOpen={isOpen} onClick={toggle} color="#9ca3af" />
        </div>
      </>
    );
  }

  const { color = "#3b82f6", name = ws.name, logo = "" } = ws.settings || {};

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        html, body { 
          background: transparent !important; 
          overflow: hidden !important;
          margin: 0;
          padding: 0;
        }
        * { outline: none !important; -webkit-tap-highlight-color: transparent; }
      `}} />
      {/* Completely transparent - only bubble or popup visible */}
      {isOpen ? (
        <div className="fixed bottom-4 right-4 w-[380px] h-[640px] bg-[#fafafa] rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-6 transition-all duration-500 ease-out">
          <WidgetHeader name={name} logo={logo} color={color} onCollapse={toggle} />
          <div className="flex-1 flex flex-col min-h-0 bg-[#fafafa]">
            {!convId ? <WidgetIdentify onStart={onStart} color={color} /> : <WidgetChat messages={msgs} onSend={async (text) => {
              await addDoc(collection(db, "workspaces", workspaceId, "conversations", convId!, "messages"), { text, sender: "user", createdAt: serverTimestamp() });
            }} color={color} />}
          </div>
        </div>
      ) : (
        <div className="fixed bottom-4 right-4">
          <WidgetBubble isOpen={isOpen} onClick={toggle} color={color} />
        </div>
      )}
    </>
  );
}

export default function ChatWidget() {
  const { workspaceId } = useParams() as { workspaceId: string };
  return <Suspense fallback={null}><WidgetContent workspaceId={workspaceId} /></Suspense>;
}
