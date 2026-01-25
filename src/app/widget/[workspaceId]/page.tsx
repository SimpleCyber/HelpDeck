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
import { AlertCircle, X } from "lucide-react";
import { getWorkspaceWithCache, updateWorkspaceStats } from "@/lib/db-helpers";

function WidgetContent({ workspaceId }: { workspaceId: string }) {
  const searchParams = useSearchParams();
  const ownerId = searchParams.get("owner") || "";

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
    if (!workspaceId || !ownerId) {
      if (!ownerId && workspaceId) {
        console.error("Widget: ownerId missing in searchParams");
      }
      setLoading(false);
      return;
    }

    // Use cached helper
    getWorkspaceWithCache(ownerId, workspaceId).then((data) => {
      setWs(data);
      setLoading(false);
    });

    const userStr = searchParams.get("user");
    if (userStr) {
      try {
        const u = JSON.parse(decodeURIComponent(userStr));
        resumeOrStart(u);
      } catch {}
    } else {
      const saved = localStorage.getItem(`crisp_conv_${workspaceId}`);
      if (saved) setConvId(saved);
    }
  }, [workspaceId, ownerId, searchParams]);

  const resumeOrStart = async (u: any) => {
    if (!ownerId) return;

    // Extract standard fields vs custom fields
    const { name, email, userId, ...rest } = u;
    const customData = rest;

    const q = query(
      collection(
        db,
        "users",
        ownerId,
        "workspaces",
        workspaceId,
        "conversations",
      ),
      where(userId ? "externalId" : "userEmail", "==", userId || email),
      limit(1),
    );
    const snap = await getDocs(q);

    if (!snap.empty) {
      const docId = snap.docs[0].id;
      setConvId(docId);
      localStorage.setItem(`crisp_conv_${workspaceId}`, docId);

      // Update custom data for existing user
      if (Object.keys(customData).length > 0) {
        await updateDoc(
          doc(
            db,
            "users",
            ownerId,
            "workspaces",
            workspaceId,
            "conversations",
            docId,
          ),
          {
            customData: customData,
          },
        );
      }
    } else {
      onStart(name || "User", email || "", userId || null, customData);
    }
  };

  useEffect(() => {
    if (!convId || !workspaceId || !ownerId) return;

    return onSnapshot(
      query(
        collection(
          db,
          "users",
          ownerId,
          "workspaces",
          workspaceId,
          "conversations",
          convId,
          "messages",
        ),
        orderBy("createdAt", "asc"),
      ),
      (s) => {
        setMsgs(s.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
    );
  }, [convId, workspaceId, ownerId]);

  // Listen to conversation metadata for unread count
  useEffect(() => {
    if (!convId || !workspaceId || !ownerId) return;
    return onSnapshot(
      doc(
        db,
        "users",
        ownerId,
        "workspaces",
        workspaceId,
        "conversations",
        convId,
      ),
      (s) => {
        const data = s.data();
        if (data) setUnreadCount(data.unreadCountUser || 0);
      },
    );
  }, [convId, workspaceId, ownerId]);

  const toggle = async () => {
    const next = !isOpen;
    setIsOpen(next);
    window.parent.postMessage(next ? "expand" : "collapse", "*");

    if (next && convId && unreadCount > 0 && ownerId) {
      // Clear unread count when opening
      await updateDoc(
        doc(
          db,
          "users",
          ownerId,
          "workspaces",
          workspaceId,
          "conversations",
          convId,
        ),
        {
          unreadCountUser: 0,
        },
      );
    }
  };

  const onStart = async (
    userName: string,
    userEmail: string,
    externalId: string | null = null,
    customData: any = {},
  ) => {
    if (!ownerId) return;
    const r = await addDoc(
      collection(
        db,
        "users",
        ownerId,
        "workspaces",
        workspaceId,
        "conversations",
      ),
      {
        userName,
        userEmail,
        externalId,
        customData,
        createdAt: serverTimestamp(),
        status: "unresolved",
      },
    );
    localStorage.setItem(`crisp_conv_${workspaceId}`, r.id);
    setConvId(r.id);

    // Update workspace counts using batched helper
    await updateWorkspaceStats(ownerId, workspaceId, "conversationCount", 1);
    await updateWorkspaceStats(ownerId, workspaceId, "unresolvedCount", 1);
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
            <div className="w-80 h-[400px] bg-[#fafafa] rounded-2xl shadow-2xl flex flex-col items-center justify-center p-8 mb-3 relative">
              <button
                onClick={toggle}
                className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
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
                  if (!ownerId) return;
                  const convRef = doc(
                    db,
                    "users",
                    ownerId,
                    "workspaces",
                    workspaceId,
                    "conversations",
                    convId!,
                  );
                  const convSnap = await getDoc(convRef);
                  const oldStatus = convSnap.data()?.status;

                  await addDoc(
                    collection(
                      db,
                      "users",
                      ownerId,
                      "workspaces",
                      workspaceId,
                      "conversations",
                      convId!,
                      "messages",
                    ),
                    {
                      text,
                      sender: "user",
                      createdAt: serverTimestamp(),
                    },
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

                  await updateDoc(convRef, updates);

                  // Update workspace stats using batched helper
                  await updateWorkspaceStats(
                    ownerId,
                    workspaceId,
                    "messageCount",
                    1,
                  );
                  await updateWorkspaceStats(
                    ownerId,
                    workspaceId,
                    "unreadCount",
                    1,
                  );

                  // If it was resolved, increment the workspace's unresolvedCount
                  if (oldStatus === "resolved") {
                    await updateWorkspaceStats(
                      ownerId,
                      workspaceId,
                      "unresolvedCount",
                      1,
                    );
                  }
                }}
                color={color}
              />
            )}
          </div>
        </div>
      ) : (
        <WidgetBubble
          isOpen={isOpen}
          onClick={toggle}
          color={color}
          unreadCount={unreadCount}
        />
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
