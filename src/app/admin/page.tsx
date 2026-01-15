"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function AdminPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push("/admin/dashboard");
  }, [user, loading, router]);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" /></div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-2xl shadow-xl w-full max-w-md text-center space-y-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Crisp</h1>
          <p className="text-gray-500 font-medium">Manage your workspace and chat with customers.</p>
        </div>
        
        <Button 
          variant="secondary" 
          onClick={signInWithGoogle} 
          className="w-full h-14 border border-gray-200 shadow-sm"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-1" />
          Continue with Google
        </Button>
      </div>
    </div>
  );
}
