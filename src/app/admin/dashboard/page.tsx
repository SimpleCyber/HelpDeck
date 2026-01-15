"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { WorkspaceCard } from "@/components/admin/WorkspaceCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWsName, setNewWsName] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/admin");
    if (user) fetchWorkspaces();
  }, [user, authLoading, router]);

  const fetchWorkspaces = async () => {
    try {
      const q = query(collection(db, "workspaces"), where("ownerId", "==", user?.uid));
      const snap = await getDocs(q);
      setWorkspaces(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } finally {
      setLoading(false);
    }
  };

  const createWs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim() || !user) return;
    const docRef = await addDoc(collection(db, "workspaces"), {
      name: newWsName, ownerId: user.uid, createdAt: serverTimestamp(),
      settings: { color: "#3b82f6", name: newWsName, logo: "" }
    });
    router.push(`/admin/workspace/${docRef.id}`);
  };

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-10 w-10 text-blue-500" /></div>;

  return (
    <div className="flex min-h-screen">
      <AdminSidebar activeTab="dashboard" />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">My Workspaces</h2>
            <Button icon={Plus} onClick={() => setShowCreateModal(true)}>New Workspace</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workspaces.map(ws => <WorkspaceCard key={ws.id} workspace={ws} />)}
          </div>
        </div>
      </main>
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={createWs} className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl space-y-6">
            <h3 className="text-2xl font-bold">Create Workspace</h3>
            <Input label="Workspace Name" value={newWsName} onChange={e => setNewWsName(e.target.value)} placeholder="Acme Inc." autoFocus />
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={!newWsName.trim()} className="flex-1">Create</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
