"use client";

import { useAuth } from "@/lib/auth-context";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { Loader2 } from "lucide-react";

export default function AnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { workspaceId } = useParams() as { workspaceId: string };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/admin");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-12 bg-[var(--bg-main)]">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-black text-[var(--text-main)] mb-2">
            Analytics
          </h1>
          <p className="text-[var(--text-muted)]">
            Insights into your users' behavior and performance of your website.
          </p>
        </header>

        <AnalyticsDashboard workspaceId={workspaceId} />
      </div>
    </div>
  );
}
