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
import { CreateWorkspaceModal } from "@/components/admin/CreateWorkspaceModal";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

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



  // Calculate stats
  // Note: For "Total Messages", we ideally track a 'messageCount' on the workspace or aggregate conversation message counts.
  // For now, we'll use unreadCount as a proxy or 0 if not available, consistent with previous logic but renamed.
  // Actually, let's try to sum 'totalMessages' if available, else fallback.
  const totalMessages = workspaces.reduce((acc, ws) => acc + (ws.totalMessages || ws.unreadCount || 0), 0);
  
  const totalMembers = new Set(workspaces.flatMap(ws => ws.memberEmails || [])).size;
  
  // "Total Customers" -> distinct member emails is actually "Team Members". 
  // User asked for "Total Customers" instead of "Total Views". 
  // We'll interpret this as number of conversations (people who chatted).
  const totalCustomers = workspaces.reduce((acc, ws) => acc + (ws.conversationCount || 0), 0);

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
