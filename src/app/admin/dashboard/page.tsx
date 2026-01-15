"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Loader2, Users, MessageSquare, BarChart3, Globe, X } from "lucide-react";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { WorkspaceCard } from "@/components/admin/WorkspaceCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import HelpDeckWidget from "@/components/includeHelpDesk";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/admin");
    if (user) fetchWorkspaces();
  }, [user, authLoading, router]);

  const fetchWorkspaces = async () => {
    try {
      // Fetch owned workspaces
      const qOwner = query(collection(db, "workspaces"), where("ownerId", "==", user?.uid));
      const snapOwner = await getDocs(qOwner);
      const owned = snapOwner.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch shared workspaces where user is a member
      const qMember = query(collection(db, "workspaces"), where("memberEmails", "array-contains", user?.email));
      const snapMember = await getDocs(qMember);
      const shared = snapMember.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Merge and remove duplicates (if any)
      const all = [...owned, ...shared.filter(s => !owned.some(o => o.id === s.id))];
      setWorkspaces(all);
    } finally {
      setLoading(false);
    }
  };

  const createWs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim() || !user || isCreating) return;
    
    setIsCreating(true);
    try {
      const docRef = await addDoc(collection(db, "workspaces"), {
        name: newWsName, ownerId: user.uid, createdAt: serverTimestamp(),
        settings: { color: "#3b82f6", name: newWsName, logo: "" }
      });
      router.push(`/admin/workspace/${docRef.id}`);
    } catch (error) {
      console.error("Error creating workspace", error);
      setIsCreating(false);
    }
  };

  const stats = [
    { label: "Total Workspaces", value: workspaces.length, icon: Globe, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Chats", value: "0", icon: MessageSquare, color: "text-green-600", bg: "bg-green-50" },
    { label: "Team Members", value: "1", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Views", value: "0", icon: BarChart3, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="flex h-screen bg-[var(--bg-main)] overflow-hidden">
      <AdminSidebar activeTab="dashboard" />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {authLoading || loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto text-[var(--text-main)]">
            
            <div className="max-w-6xl mx-auto p-12">
              {/* Header */}
              <div className="flex justify-between items-end mb-12">
                <div>
                  <p className="text-blue-600 font-bold mb-2">Overview</p>
                  <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tight">
                    Welcome back, {user?.displayName?.split(' ')[0] || user?.email?.split('@')[0]}
                  </h1>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-color)] shadow-sm">
                    <div className={`${stat.bg} ${stat.color} dark:bg-opacity-20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
                      <stat.icon size={24} />
                    </div>
                    <div className="text-3xl font-black text-[var(--text-main)] mb-1">{stat.value}</div>
                    <div className="text-sm font-bold text-[var(--text-muted)]">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Workspaces Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <h2 className="text-2xl font-black text-[var(--text-main)] tracking-tight">Your Workspaces</h2>
                   <div className="text-sm font-semibold text-[var(--text-muted)]">{workspaces.length} total</div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {workspaces.map(ws => (
                    <WorkspaceCard key={ws.id} workspace={ws} />
                  ))}
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="aspect-video rounded-3xl border-2 border-dashed border-[var(--border-color)] hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all flex flex-col items-center justify-center gap-3 text-[var(--text-muted)] hover:text-blue-600 group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[var(--bg-main)] flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                       <Plus size={24} />
                    </div>
                    <span className="font-bold">Create New</span>
                  </button>
                </div>
              </div>
            </div>
          </main>
        )}
      </div>

      {/* Modern Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div 
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[40px] p-10 w-full max-w-xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300"
          >
            {/* Background decorative blob */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 dark:bg-blue-900/10 rounded-full blur-3xl opacity-50 -z-10" />
            
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-6 right-6 p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            >
              <X size={24} />
            </button>

            <div className="mb-10">
              <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-200">
                <Globe size={32} />
              </div>
              <h3 className="text-3xl font-black text-[var(--text-main)] tracking-tight mb-2">Create Workspace</h3>
              <p className="text-[var(--text-muted)] font-medium">Build a dedicated space for your support team.</p>
            </div>

            <form onSubmit={createWs} className="space-y-8">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--text-muted)] ml-1">Workspace Name</label>
                <Input 
                  value={newWsName} 
                  onChange={e => setNewWsName(e.target.value)} 
                  placeholder="e.g. Acme Support" 
                  autoFocus 
                  className="h-14 text-lg px-6 rounded-2xl border-[var(--border-color)] bg-[var(--bg-main)] focus:bg-[var(--bg-card)] transition-all shadow-none"
                />
              </div>

              <div className="flex gap-4">
                <Button 
                  type="button"
                  variant="secondary" 
                  onClick={() => setShowCreateModal(false)} 
                  className="flex-1 h-14 rounded-2xl font-bold bg-[var(--border-color)] text-[var(--text-main)] border-none hover:bg-opacity-80 shadow-none transition-all"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={!newWsName.trim() || isCreating} 
                  className="flex-1 h-14 rounded-2xl font-bold shadow-xl shadow-blue-500/20"
                >
                  {isCreating ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={20} className="animate-spin" />
                      Creating...
                    </div>
                  ) : "Create Workspace"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <HelpDeckWidget />
    </div>
  );
}
