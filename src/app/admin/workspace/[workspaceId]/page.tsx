"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LogoUpload } from "@/components/admin/LogoUpload";
import { DesignPreview } from "@/components/admin/DesignPreview";
import { cn } from "@/lib/utils";
import { Save, Loader2 } from "lucide-react";
import { invalidateCache, cacheKeys } from "@/lib/redis";

function WorkspaceSettingsContent() {
  const { user, loading: authL } = useAuth();
  const router = useRouter();
  const { workspaceId } = useParams() as { workspaceId: string };
  const searchParams = useSearchParams();
  const ownerId = searchParams.get("owner") || user?.uid || "";
  
  const [ws, setWs] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", color: "#3b82f6", logo: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authL && !user) router.push("/admin");
    if (workspaceId && ownerId) {
      return onSnapshot(doc(db, "users", ownerId, "workspaces", workspaceId), (s: any) => {
        const data = s.data();
        if (data) {
          setWs(data);
          setFormData(prev => {
            if (!prev.name) {
               return { 
                name: data.settings?.name || data.name, 
                color: data.settings?.color || "#3b82f6", 
                logo: data.settings?.logo || "" 
              };
            }
            return prev;
          });
        }
      });
    }
  }, [workspaceId, ownerId, user, authL, router]);

  const handleSave = async () => {
    if (!ws || (ws.ownerId !== user?.uid && user?.email !== ws.ownerEmail)) return;
    setSaving(true);
    try {
      const wsRef = doc(db, "users", ownerId, "workspaces", workspaceId);
      await updateDoc(wsRef, {
        name: formData.name,
        settings: formData
      });
      
      // Invalidate workspace cache
      await invalidateCache(cacheKeys.workspace(workspaceId));
    } catch (err) {
      console.error("Error saving workspace settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const isOwner = ws?.ownerId === user?.uid || user?.email === ws?.ownerEmail;

  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden">
      <AdminSidebar activeTab="design" workspaceId={workspaceId} ownerId={ownerId} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {authL || !ws ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
          </div>
        ) : (
          <>
            <main className="flex-1 overflow-y-auto p-12">
               <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <header className="flex items-center justify-between">
                     <div>
                       <h1 className="text-3xl font-black text-[var(--text-main)] mb-2">Design & Appearance</h1>
                       <p className="text-[var(--text-muted)]">Customize how your help desk looks to your users.</p>
                     </div>
                     {isOwner && (
                        <Button 
                           icon={Save} 
                           loading={saving} 
                           onClick={handleSave}
                           className="h-11 px-6 rounded-xl shadow-lg shadow-blue-500/20"
                        >
                          Save Changes
                        </Button>
                     )}
                  </header>

                  <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[32px] p-8 space-y-8 shadow-sm">
                    <LogoUpload currentLogo={formData.logo} onUpload={logo => setFormData({ ...formData, logo })} />
                    <div className="grid grid-cols-2 gap-8">
                      <Input label="Workspace Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                      <div className="space-y-2">
                         <label className="block text-sm font-semibold text-[var(--text-main)]">Brand Color</label>
                         <div className="flex items-center gap-4">
                            <input 
                              type="color" 
                              value={formData.color} 
                              onChange={e => setFormData({ ...formData, color: e.target.value })}
                              className="w-12 h-12 rounded-xl border-none p-0 overflow-hidden cursor-pointer shadow-sm"
                            />
                            <div className="flex-1 font-mono text-sm font-bold bg-[var(--bg-main)] px-4 py-3 rounded-xl border border-[var(--border-color)]">
                              {formData.color.toUpperCase()}
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>

                  <DesignPreview color={formData.color} name={formData.name} logo={formData.logo} />
               </div>
            </main>
          </>
        )}
      </div>
    </div>
  );
}

export default function WorkspaceSettings() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[var(--bg-main)]">
        <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
      </div>
    }>
      <WorkspaceSettingsContent />
    </Suspense>
  );
}
