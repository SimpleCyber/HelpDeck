"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { LiveInbox } from "@/components/inbox/LiveInbox";

function AdminChatContent() {
  const { user, loading: authL } = useAuth();
  const router = useRouter();
  const { workspaceId } = useParams() as { workspaceId: string };
  const searchParams = useSearchParams();
  const ownerId = searchParams.get("owner") || user?.uid || "";

  useEffect(() => {
    if (!authL && !user) router.push("/admin");
  }, [user, authL, router]);

  if (authL) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
      </div>
    );
  }

  return <LiveInbox workspaceId={workspaceId} ownerId={ownerId} />;
}

export default function AdminChat() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[var(--bg-main)]">
          <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
        </div>
      }
    >
      <AdminChatContent />
    </Suspense>
  );
}
