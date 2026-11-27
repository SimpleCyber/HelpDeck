"use client";

import { useAuth } from "@/lib/auth-context";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { Loader2 } from "lucide-react";

function AnalyticsPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { workspaceId } = useParams() as { workspaceId: string };
  const searchParams = useSearchParams();
  const ownerId = searchParams.get("owner") || user?.uid || "";
  const [workspaceName, setWorkspaceName] = useState<string>("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!workspaceId || !ownerId) return;
    getDoc(doc(db, "users", ownerId, "workspaces", workspaceId))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setWorkspaceName(data?.settings?.name || data?.name || "");
        }
      })
      .catch(() => {});
  }, [workspaceId, ownerId]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-sky-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-[var(--bg-main)]">
      <div className="max-w-6xl mx-auto">
        <AnalyticsDashboard
          workspaceId={workspaceId}
          workspaceName={workspaceName}
        />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="animate-spin h-10 w-10 text-sky-500" />
        </div>
      }
    >
      <AnalyticsPageContent />
    </Suspense>
  );
}
