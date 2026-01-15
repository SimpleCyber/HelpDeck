"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LogoUpload } from "@/components/admin/LogoUpload";
import { DesignPreview } from "@/components/admin/DesignPreview";
import { InstallationGuide } from "@/components/admin/InstallationGuide";
import { DeleteWorkspace } from "@/components/admin/DeleteWorkspace";
import { cn } from "@/lib/utils";
import { ChevronLeft, Save, Palette, Code, Loader2, Trash2, Users } from "lucide-react";

import { MembersManager } from "@/components/admin/MembersManager";

export default function WorkspaceSettings() {
  const { user, loading: authL } = useAuth();
  const router = useRouter();
  const { workspaceId } = useParams() as { workspaceId: string };
  const [ws, setWs] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", color: "#3b82f6", logo: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authL && !user) router.push("/admin");
    if (workspaceId) {
      return onSnapshot(doc(db, "workspaces", workspaceId), (s: any) => {
        const data = s.data();
        if (data) {
          setWs(data);
          // Only set form data if we haven't already or if it changes fundamentally (to avoid resetting cursor)
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
  }, [workspaceId, user, authL, router]);

  const handleSave = async () => {
    if (!ws || ws.ownerId !== user?.uid) return;
    setSaving(true);
    await updateDoc(doc(db, "workspaces", workspaceId), {
      name: formData.name,
      settings: formData
    });
    setSaving(false);
  };

  const isOwner = ws?.ownerId === user?.uid;

  return (
    <div className="flex h-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-hidden">
      <AdminSidebar activeTab="design" workspaceId={workspaceId} />
      
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
