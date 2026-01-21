"use client";

import { SuperAdminSidebar } from "@/components/admin/SuperAdminSidebar";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

// Super admin email check
const SUPER_ADMIN_EMAILS = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());

function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [healthStatus, setHealthStatus] = useState({ firebase: true, upstash: true });

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/sign-in");
      } else if (!isSuperAdmin(user.email)) {
        router.push("/admin/dashboard");
      }
    }
  }, [user, loading, router]);

  // Simple health check on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        // Check Upstash Redis
        const redisUrl = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL;
        const redisToken = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN;
        
        if (redisUrl && redisToken) {
          const response = await fetch(`${redisUrl}/ping`, {
            headers: { Authorization: `Bearer ${redisToken}` }
          });
          setHealthStatus(prev => ({ ...prev, upstash: response.ok }));
        }
      } catch {
        setHealthStatus(prev => ({ ...prev, upstash: false }));
      }
      
      // Firebase is considered healthy if user is authenticated
      setHealthStatus(prev => ({ ...prev, firebase: !!user }));
    };
    
    if (user && isSuperAdmin(user.email)) {
      checkHealth();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-main)]">
        <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
      </div>
    );
  }

  if (!user || !isSuperAdmin(user.email)) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-main)]">
        <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--bg-main)] overflow-hidden">
      <SuperAdminSidebar healthStatus={healthStatus} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
