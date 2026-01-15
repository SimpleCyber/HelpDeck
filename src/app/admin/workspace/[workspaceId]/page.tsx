"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, Save, Palette, Code, Loader2, Trash2 } from "lucide-react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LogoUpload } from "@/components/admin/LogoUpload";
import { DesignPreview } from "@/components/admin/DesignPreview";
import { InstallationGuide } from "@/components/admin/InstallationGuide";
import { DeleteWorkspace } from "@/components/admin/DeleteWorkspace";

export default function WorkspaceSettings() {
  const { user, loading: authL } = useAuth();
  const router = useRouter();
  const { workspaceId } = useParams() as { workspaceId: string };
  const [ws, setWs] = useState<any>(null);
  const [tab, setTab] = useState("design");
  const [formData, setFormData] = useState({ name: "", color: "#3b82f6", logo: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authL && !user) router.push("/admin");
    if (workspaceId) fetchWs();
  }, [workspaceId, user, authL]);

  const fetchWs = async () => {
    const snap = await getDoc(doc(db, "workspaces", workspaceId));
    if (snap.exists()) {
      const data = snap.data();
      setWs({ id: snap.id, ...data });
      setFormData({ name: data.settings?.name || data.name, color: data.settings?.color || "#3b82f6", logo: data.settings?.logo || "" });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await updateDoc(doc(db, "workspaces", workspaceId), { "settings.name": formData.name, "settings.color": formData.color, "settings.logo": formData.logo });
    setSaving(false);
    alert("Saved!");
  };

  if (authL || !ws) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-10 w-10 text-blue-500" /></div>;

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar activeTab="settings" workspaceId={workspaceId} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4"><Button variant="ghost" icon={ChevronLeft} onClick={() => router.push("/admin/dashboard")} /><h2 className="text-lg font-bold">{ws.name} / Settings</h2></div>
          {tab !== 'danger' && <Button icon={Save} loading={saving} onClick={handleSave}>Save Changes</Button>}
        </header>
        <main className="flex-1 overflow-y-auto p-8"><div className="max-w-4xl mx-auto flex gap-10">
          <div className="w-48 shrink-0 space-y-1">
            <Button variant={tab === 'design' ? 'secondary' : 'ghost'} icon={Palette} onClick={() => setTab('design')} className="w-full justify-start text-sm">Design</Button>
            <Button variant={tab === 'install' ? 'secondary' : 'ghost'} icon={Code} onClick={() => setTab('install')} className="w-full justify-start text-sm">Installation</Button>
            <Button variant={tab === 'danger' ? 'secondary' : 'ghost'} icon={Trash2} onClick={() => setTab('danger')} className="w-full justify-start text-sm text-red-500 hover:text-red-600">Danger Zone</Button>
          </div>
          <div className="flex-1">
            {tab === 'design' && (
              <div className="space-y-8 animate-in fade-in">
                <section className="card p-6 space-y-6"><LogoUpload currentLogo={formData.logo} onUpload={logo => setFormData({ ...formData, logo })} /><Input label="Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /><Input label="Color" type="color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} /></section>
                <DesignPreview color={formData.color} name={formData.name} logo={formData.logo} />
              </div>
            )}
            {tab === 'install' && <InstallationGuide workspaceId={workspaceId} />}
            {tab === 'danger' && <DeleteWorkspace workspaceId={workspaceId} name={ws.name} />}
          </div>
        </div></main>
      </div>
    </div>
  );
}
