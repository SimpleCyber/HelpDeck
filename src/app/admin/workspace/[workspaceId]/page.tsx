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
  const [tab, setTab] = useState<'design' | 'install' | 'danger' | 'members'>('design');
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
          
          // RBAC: If not owner, default to members tab (only if tab wasn't manually changed)
          if (data.ownerId !== user?.uid) {
            setTab('members');
          }
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
      <AdminSidebar activeTab="settings" workspaceId={workspaceId} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {authL || !ws ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
          </div>
        ) : (
          <>
            <header className="h-20 bg-[var(--bg-card)] border-b border-[var(--border-color)] px-8 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => router.push("/admin/dashboard")} 
                  className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-[var(--text-muted)] hover:text-blue-600 border border-transparent hover:border-[var(--border-color)]"
                >
                  <ChevronLeft size={20} />
                </button>
                <div>
                  <h2 className="text-xl font-black tracking-tight">{ws.name}</h2>
                  <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest opacity-60">
                    {tab === 'members' ? 'Team Management' : 'Workspace Settings'}
                  </p>
                </div>
              </div>
              {isOwner && tab !== 'danger' && tab !== 'members' && (
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

            <main className="flex-1 overflow-y-auto p-12">
              <div className="max-w-5xl mx-auto flex gap-12">
                <div className="w-64 shrink-0 space-y-2">
                  <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-4 mb-4 opacity-50">Settings Menu</div>
                  
                  {isOwner && (
                    <>
                      <button 
                        onClick={() => setTab('design')}
                        className={cn(
                          "w-full flex items-center gap-3 h-12 px-4 rounded-xl font-bold transition-all",
                          tab === 'design' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-[var(--text-muted)] hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-600"
                        )}
                      >
                        <Palette size={18} />
                        <span>Design</span>
                      </button>
                      <button 
                        onClick={() => setTab('install')}
                        className={cn(
                          "w-full flex items-center gap-3 h-12 px-4 rounded-xl font-bold transition-all",
                          tab === 'install' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-[var(--text-muted)] hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-600"
                        )}
                      >
                        <Code size={18} />
                        <span>Installation</span>
                      </button>
                    </>
                  )}

                  <button 
                    onClick={() => setTab('members')}
                    className={cn(
                      "w-full flex items-center gap-3 h-12 px-4 rounded-xl font-bold transition-all",
                      tab === 'members' ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-[var(--text-muted)] hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-600"
                    )}
                  >
                    <Users size={18} />
                    <span>Members</span>
                  </button>

                  {isOwner && (
                    <button 
                      onClick={() => setTab('danger')}
                      className={cn(
                        "w-full flex items-center gap-3 h-12 px-4 rounded-xl font-bold transition-all mt-8",
                        tab === 'danger' ? "bg-red-600 text-white shadow-lg shadow-red-500/20" : "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                      )}
                    >
                      <Trash2 size={18} />
                      <span>Danger Zone</span>
                    </button>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {tab === 'design' && isOwner && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <section className="space-y-4">
                        <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 opacity-50">Workspace Identity</h3>
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
                      </section>

                      <DesignPreview color={formData.color} name={formData.name} logo={formData.logo} />
                    </div>
                  )}
                  {tab === 'install' && isOwner && <InstallationGuide workspaceId={workspaceId} />}
                  {tab === 'danger' && isOwner && <DeleteWorkspace workspaceId={workspaceId} name={ws.name} />}
                  {tab === 'members' && (
                    <MembersManager 
                      workspaceId={workspaceId} 
                      memberEmails={ws.memberEmails} 
                      ownerEmail={ws.ownerEmail || "Workspace Owner"} 
                      isOwner={isOwner} 
                    />
                  )}
                </div>
              </div>
            </main>
          </>
        )}
      </div>
    </div>
  );
}
