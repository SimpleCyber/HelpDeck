"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { MembersManager } from "@/components/admin/MembersManager";
import { Loader2 } from "lucide-react";

export default function MembersPage() {
  const { user, loading: authL } = useAuth();
  const router = useRouter();
  const { workspaceId } = useParams() as { workspaceId: string };
  const [ws, setWs] = useState<any>(null);

  useEffect(() => {
    if (!authL && !user) router.push("/admin");
    if (workspaceId) {
      return onSnapshot(doc(db, "workspaces", workspaceId), (s: any) => {
        setWs(s.data());
      });
    }
  }, [workspaceId, user, authL, router]);

  const isOwner = ws?.ownerId === user?.uid;

  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden">
      <AdminSidebar activeTab="members" workspaceId={workspaceId} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {authL || !ws ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto p-12">
            <div className="max-w-4xl mx-auto space-y-8">
              <div>
                <h1 className="text-3xl font-black text-[var(--text-main)] mb-2">Team Members</h1>
                <p className="text-[var(--text-muted)]">Manage who has access to this workspace.</p>
              </div>
              
              <MembersManager 
                  workspaceId={workspaceId} 
                  memberEmails={ws.memberEmails} 
                  ownerEmail={ws.ownerEmail || "Workspace Owner"} 
                  isOwner={isOwner} 
              />
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
