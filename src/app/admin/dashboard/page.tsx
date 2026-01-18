"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Loader2, Users, MessageSquare, BarChart3, Globe, X } from "lucide-react";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { WorkspaceCard } from "@/components/admin/WorkspaceCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import HelpDeckWidget from "@/components/includeHelpDesk";
import { CreateWorkspaceModal } from "@/components/admin/CreateWorkspaceModal";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const syncStats = async () => {
    if (syncing || workspaces.length === 0) return;
    setSyncing(true);
    try {
      for (const ws of workspaces) {
        const convsSnap = await getDocs(collection(db, "workspaces", ws.id, "conversations"));
        const conversationCount = convsSnap.size;
        
        let totalMessages = 0;
        for (const convDoc of convsSnap.docs) {
          const msgsSnap = await getDocs(collection(db, "workspaces", ws.id, "conversations", convDoc.id, "messages"));
          totalMessages += msgsSnap.size;
        }

        await updateDoc(doc(db, "workspaces", ws.id), {
          totalMessages,
          conversationCount
        });
      }
    } catch (err) {
      console.error("Error syncing stats:", err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading && !user) router.push("/admin");
      return;
    }

    // Set up real-time listeners for workspaces
    const qOwner = query(collection(db, "workspaces"), where("ownerId", "==", user.uid));
    const qMember = query(collection(db, "workspaces"), where("memberEmails", "array-contains", user.email));

    let ownedWs: any[] = [];
    let sharedWs: any[] = [];

    const updateAllVisibility = () => {
      const all = [...ownedWs, ...sharedWs.filter(s => !ownedWs.some(o => o.id === s.id))];
      setWorkspaces(all);
      setLoading(false);
    };

    const unsubOwner = onSnapshot(qOwner, (snap) => {
      ownedWs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateAllVisibility();
    }, (err) => {
      console.error("Error listening to owned workspaces:", err);
      setLoading(false);
    });

    const unsubMember = onSnapshot(qMember, (snap) => {
      sharedWs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateAllVisibility();
    }, (err) => {
      console.error("Error listening to shared workspaces:", err);
      setLoading(false);
    });

    return () => {
      unsubOwner();
      unsubMember();
    };
  }, [user, authLoading, router]);



  // Calculate stats
  const totalMessages = workspaces.reduce((acc, ws) => acc + Math.max(0, ws.totalMessages || ws.unreadCount || 0), 0);
  
  const totalMembers = new Set(workspaces.flatMap(ws => ws.memberEmails || [])).size;
  
  const totalCustomers = workspaces.reduce((acc, ws) => acc + Math.max(0, ws.conversationCount || 0), 0);

  const stats = [
    { label: "Total Workspaces", value: workspaces.length, icon: Globe, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Messages", value: totalMessages, icon: MessageSquare, color: "text-green-600", bg: "bg-green-50" },
    { label: "Team Members", value: totalMembers, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Customers", value: totalCustomers, icon: BarChart3, color: "text-orange-600", bg: "bg-orange-50" },
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
                <div className="flex items-center gap-4 mb-2">
                  <Button 
                    variant="outline" 
                    onClick={syncStats} 
                    disabled={syncing}
                    className="rounded-2xl font-bold border-[var(--border-color)] hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all px-6 h-12"
                  >
                    {syncing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Syncing...</span>
                      </div>
                    ) : (
                      <span>Sync Statistics</span>
                    )}
                  </Button>
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
      <CreateWorkspaceModal 
        userId={user?.uid || ""} 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
      <HelpDeckWidget user={user} />
    </div>
  );
}
