"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { InstallationGuide } from "@/components/admin/InstallationGuide";
import { Loader2 } from "lucide-react";

function InstallationPageContent() {
  const { user, loading: authL } = useAuth();
  const router = useRouter();
  const { workspaceId } = useParams() as { workspaceId: string };
  const searchParams = useSearchParams();
  const ownerId = searchParams.get("owner") || user?.uid || "";
  
  const [ws, setWs] = useState<any>(null);

  useEffect(() => {
    if (!authL && !user) router.push("/admin");
    if (workspaceId && ownerId) {
      return onSnapshot(doc(db, "users", ownerId, "workspaces", workspaceId), (s: any) => {
        setWs(s.data());
      });
    }
  }, [workspaceId, ownerId, user, authL, router]);

  const isOwner = ws?.ownerId === user?.uid || user?.email === ws?.ownerEmail;

  if (ws && !isOwner) {
      return (
        <div className="flex h-screen items-center justify-center bg-[var(--bg-main)]">
            <p className="text-[var(--text-muted)]">You do not have permission to view installation settings.</p>
        </div>
      )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {authL || !ws ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto p-12">
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-black text-[var(--text-main)] mb-2">Installation</h1>
              <p className="text-[var(--text-muted)]">Get the code to add the widget to your website.</p>
            </div>
            
            <InstallationGuide workspaceId={workspaceId} ownerId={ownerId} />
          </div>
        </main>
      )}
    </div>
  );
}

export default function InstallationPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[var(--bg-main)]">
        <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
      </div>
    }>
      <InstallationPageContent />
    </Suspense>
  );
}
