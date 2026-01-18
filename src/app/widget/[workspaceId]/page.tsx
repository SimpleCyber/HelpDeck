"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where,
  getDocs,
  limit,
  increment,
  updateDoc,
} from "firebase/firestore";
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
  const [unreadCount, setUnreadCount] = useState(0);

  /* -------------------------------------------------- */
  /* GLOBAL iframe safety                               */
  /* -------------------------------------------------- */
  useEffect(() => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    document.body.style.margin = "0";
  }, []);

  /* -------------------------------------------------- */
  /* Workspace load                                     */
  /* -------------------------------------------------- */
  useEffect(() => {
    if (!workspaceId) return;

    getDoc(doc(db, "workspaces", workspaceId)).then((s) => {
      setWs(s.exists() ? s.data() : null);
      setLoading(false);
    });

    const userStr = searchParams.get("user");
    if (userStr) {
      try {
        resumeOrStart(JSON.parse(decodeURIComponent(userStr)));
      } catch {}
    } else {
      const saved = localStorage.getItem(`crisp_conv_${workspaceId}`);
      if (saved) setConvId(saved);
    }
  }, [workspaceId, searchParams]);

  const resumeOrStart = async (u: any) => {
    const q = query(
      collection(db, "workspaces", workspaceId, "conversations"),
      where(u.userId ? "externalId" : "userEmail", "==", u.userId || u.email),
      limit(1)
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      setConvId(snap.docs[0].id);
      localStorage.setItem(`crisp_conv_${workspaceId}`, snap.docs[0].id);
    } else {
      onStart(u.name || "User", u.email || "", u.userId || null);
    }
  };

  useEffect(() => {
    if (!convId || !workspaceId) return;

    return onSnapshot(
      query(
        collection(
          db,
          "workspaces",
          workspaceId,
          "conversations",
          convId,
          "messages"
        ),
        orderBy("createdAt", "asc")
      ),
      (s) => {
        setMsgs(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        
        // Listen to conversation doc for unread count
        const convDoc = s.docs[0]?.ref.parent.parent; // This is getting collection, wait. 
        // We are listening to messages collection. We need to listen to conversation doc ideally.
        // Actually, let's just use a separate listener for conversation metadata if needed, 
        // OR rely on the fact that we need the conversation ID.
      }
    );
  }, [convId, workspaceId]);

  // Listen to conversation metadata for unread count
  useEffect(() => {
    if (!convId || !workspaceId) return;
    return onSnapshot(doc(db, "workspaces", workspaceId, "conversations", convId), (s) => {
       const data = s.data();
       if (data) setUnreadCount(data.unreadCountUser || 0);
    });
  }, [convId, workspaceId]);

  const toggle = async () => {
    const next = !isOpen;
    setIsOpen(next);
    window.parent.postMessage(next ? "expand" : "collapse", "*");

    if (next && convId && unreadCount > 0) {
      // Clear unread count when opening
      await updateDoc(doc(db, "workspaces", workspaceId, "conversations", convId), {
        unreadCountUser: 0
      });
    }
  };

  const onStart = async (
    userName: string,
    userEmail: string,
    externalId: string | null = null
  ) => {
    const r = await addDoc(
      collection(db, "workspaces", workspaceId, "conversations"),
      {
        userName,
        userEmail,
        externalId,
        createdAt: serverTimestamp(),
        status: "unresolved",
      }
    );
    localStorage.setItem(`crisp_conv_${workspaceId}`, r.id);
    setConvId(r.id);
    
    // Update workspace counts
    await updateDoc(doc(db, "workspaces", workspaceId), {
      conversationCount: increment(1),
      unresolvedCount: increment(1)
    });
  };

  if (loading) return null;

  /* -------------------------------------------------- */
  /* ❌ Workspace missing                               */
  /* -------------------------------------------------- */
  if (!ws) {
    return (
      <div id="helpdeck-root">
        <div className="fixed bottom-2 right-2 flex flex-col items-end">
          {isOpen && (
            <div className="w-80 h-[400px] bg-[#fafafa] rounded-2xl shadow-2xl flex flex-col items-center justify-center p-8 mb-3">
              <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center text-red-500 mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="font-bold text-lg mb-2">Out of Service</h3>
              <p className="text-gray-400 text-sm text-center">
                This help desk is currently unavailable.
              </p>
            </div>
          )}
          <WidgetBubble isOpen={isOpen} onClick={toggle} color="#9ca3af" />
        </div>
      </div>
    );
  }

  const { color = "#3b82f6", name = ws.name, logo = "" } = ws.settings || {};

  /* -------------------------------------------------- */
  /* ✅ MAIN RENDER                                     */
  /* -------------------------------------------------- */
  return (
    <div id="helpdeck-root">
      {isOpen ? (
        <div className="fixed w-[380px] h-[640px] shadow-2xl rounded-[16px] flex flex-col">
          <WidgetHeader
            name={name}
            logo={logo}
            color={color}
            onCollapse={toggle}
          />

          <div className="flex-1 min-h-0 flex flex-col bg-[#fafafa]">
            {!convId ? (
              <WidgetIdentify onStart={onStart} color={color} />
            ) : (
              <WidgetChat
                messages={msgs}
                onSend={async (text) => {
                  const convRef = doc(db, "workspaces", workspaceId, "conversations", convId!);
                  const convSnap = await getDoc(convRef);
                  const oldStatus = convSnap.data()?.status;

                  await addDoc(
                    collection(
                      db,
                      "workspaces",
                      workspaceId,
                      "conversations",
                      convId!,
                      "messages"
                    ),
                    {
                      text,
                      sender: "user",
                      createdAt: serverTimestamp(),
                    }
                  );

                  // Update counts and status
                  const isImage = text.startsWith("data:image");
                  const displayMessage = isImage ? "📷 Image" : text;

                  const updates: any = {
                    unreadCountAdmin: increment(1),
                    lastMessage: displayMessage,
                    lastUpdatedAt: serverTimestamp(),
                    status: "unresolved",
                  };

                  const wsUpdates: any = {
                    unreadCount: increment(1),
                    totalMessages: increment(1)
                  };

                  // If it was resolved, increment the workspace's unresolvedCount
                  if (oldStatus === "resolved") {
                    wsUpdates.unresolvedCount = increment(1);
                  }

                  await Promise.all([
                    updateDoc(convRef, updates),
                    updateDoc(doc(db, "workspaces", workspaceId), wsUpdates)
                  ]);
                }}
                color={color}
              />
            )}
          </div>
        </div>
      ) : (
        <WidgetBubble isOpen={isOpen} onClick={toggle} color={color} unreadCount={unreadCount} />
      )}
    </div>
  );
}

/* -------------------------------------------------- */
/* ENTRY                                               */
/* -------------------------------------------------- */
export default function ChatWidget() {
  const { workspaceId } = useParams() as { workspaceId: string };
  return (
    <Suspense fallback={null}>
      <WidgetContent workspaceId={workspaceId} />
    </Suspense>
  );
}
