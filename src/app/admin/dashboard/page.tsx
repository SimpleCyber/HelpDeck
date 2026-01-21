"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Loader2, Users, X, BarChart3, Globe, Crown, Calendar } from "lucide-react";
import { collection, query, onSnapshot, collectionGroup, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { WorkspaceCard } from "@/components/admin/WorkspaceCard";
import { Button } from "@/components/ui/Button";
import HelpDeckWidget from "@/components/includeHelpDesk";
import { CreateWorkspaceModal } from "@/components/admin/CreateWorkspaceModal";

export default function AdminDashboard() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [sharedWorkspaces, setSharedWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading && !user) router.push("/admin");
      return;
    }

    // Listen to user's own workspaces (subcollection)
    const unsubOwned = onSnapshot(
      collection(db, "users", user.uid, "workspaces"),
      (snap) => {
        const owned = snap.docs.map(doc => ({ 
          id: doc.id, 
          ownerId: user.uid,
          ...doc.data() 
        }));
        setWorkspaces(owned);
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to owned workspaces:", err);
        setLoading(false);
      }
    );

    // Listen to workspaces where user is a member (collection group query)
    const unsubShared = onSnapshot(
      query(
        collectionGroup(db, "workspaces"),
        where("memberEmails", "array-contains", user.email)
      ),
      (snap) => {
        const shared = snap.docs
          .map(doc => {
            // Extract ownerId from path: users/{ownerId}/workspaces/{wsId}
            const pathParts = doc.ref.path.split('/');
            const ownerId = pathParts[1];
            return { 
              id: doc.id, 
              ownerId,
              ...doc.data() 
            };
          })
          // Filter out workspaces we already own
          .filter(ws => ws.ownerId !== user.uid);
        setSharedWorkspaces(shared);
      },
      (err) => {
        console.error("Error listening to shared workspaces:", err);
      }
    );

    return () => {
      unsubOwned();
      unsubShared();
    };
  }, [user, authLoading, router]);

  // Combine owned and shared workspaces
  const allWorkspaces = [...workspaces, ...sharedWorkspaces];

  // Calculate stats from the new structure
  const unresolvedQueries = allWorkspaces.reduce((acc, ws) => 
    acc + Math.max(0, ws.stats?.unresolvedCount || 0), 0);
  
  const totalMembers = new Set(allWorkspaces.flatMap(ws => ws.memberEmails || [])).size;
  
  const totalCustomers = allWorkspaces.reduce((acc, ws) => 
    acc + Math.max(0, ws.stats?.conversationCount || 0), 0);

  // Format subscription info
  const planLabel = userProfile?.subscription?.plan 
    ? userProfile.subscription.plan.charAt(0).toUpperCase() + userProfile.subscription.plan.slice(1)
    : "Trial";

  const stats = [
    { label: "Total Workspaces", value: allWorkspaces.length, icon: Globe, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Team Members", value: totalMembers, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Total Customers", value: totalCustomers, icon: BarChart3, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Unresolved Queries", value: unresolvedQueries, icon: X, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <>
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
                {/* Subscription Badge */}
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 border border-amber-200 dark:border-amber-700 rounded-xl shadow-sm">
                  <Crown size={16} className="text-amber-600" />
                  <span className="text-sm font-bold text-amber-800 dark:text-amber-400">{planLabel} Plan</span>
                </div>
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
                 <div className="text-sm font-semibold text-[var(--text-muted)]">{allWorkspaces.length} total</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allWorkspaces.map(ws => (
                  <WorkspaceCard key={ws.id} workspace={ws} ownerId={ws.ownerId} />
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

          <CreateWorkspaceModal 
            userId={user?.uid || ""} 
            userEmail={user?.email || ""}
            isOpen={showCreateModal} 
            onClose={() => setShowCreateModal(false)} 
          />
          <HelpDeckWidget user={user} />
        </main>
      )}
    </>
  );
}
