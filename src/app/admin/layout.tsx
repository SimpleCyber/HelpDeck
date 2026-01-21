"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { usePathname, useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import HelpDeckWidget from "@/components/includeHelpDesk";
import { useAuth } from "@/lib/auth-context";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  
  const workspaceId = params.workspaceId as string | undefined;
  const ownerId = searchParams.get("owner") || undefined;

  // Determine active tab from pathname
  let activeTab = "dashboard";
  if (pathname.includes("/admin/chat")) activeTab = "chat";
  if (pathname.includes("/admin/dashboard")) activeTab = "dashboard";
  if (pathname.includes("/members")) activeTab = "members";
  if (pathname.includes("/install")) activeTab = "installation";
  if (pathname.endsWith(`/workspace/${workspaceId}`)) activeTab = "settings";

  // Check if we are in a sub-page that doesn't need the sidebar (e.g. login)
  // But this layout is under /app/admin/
  const isLoginPage = pathname === "/admin";
  if (isLoginPage) return <>{children}</>;

  return (
    <div className="flex h-screen bg-[var(--bg-main)] overflow-hidden">
      <AdminSidebar 
        activeTab={activeTab} 
        workspaceId={workspaceId} 
        ownerId={ownerId} 
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
      <HelpDeckWidget user={user} />
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[var(--bg-main)]">
        <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
      </div>
    }>
      <AdminLayoutInner>
        {children}
      </AdminLayoutInner>
    </Suspense>
  );
}
