"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Users, 
  Heart, 
  Settings,
  ExternalLink,
  Zap,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";

interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalWorkspaces: number;
}

export default function SuperAdminOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    totalWorkspaces: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all users
        const usersSnap = await getDocs(collection(db, "users"));
        const totalCustomers = usersSnap.size;
        
        // Count active users (those with active subscription)
        let activeCount = 0;
        let workspaceCount = 0;
        
        for (const userDoc of usersSnap.docs) {
          const userData = userDoc.data();
          if (userData.subscription?.status === "active") {
            activeCount++;
          }
          
          // Count workspaces for each user
          const workspacesSnap = await getDocs(collection(db, "users", userDoc.id, "workspaces"));
          workspaceCount += workspacesSnap.size;
        }
        
        setStats({
          totalCustomers,
          activeCustomers: activeCount,
          totalWorkspaces: workspaceCount,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { 
      label: "Total Customers", 
      value: stats.totalCustomers, 
      icon: Users, 
      color: "bg-red-500",
      href: "/superadmin/customers"
    },
    { 
      label: "Plan Config", 
      description: "Configure dynamic plan limits.",
      icon: Settings, 
      color: "bg-emerald-500",
      href: "/superadmin/plans"
    },
    { 
      label: "System Health", 
      description: "Monitor all services in real-time.",
      icon: Heart, 
      color: "bg-pink-500",
      href: "/superadmin/health"
    },
  ];


  return (
    <main className="flex-1 overflow-y-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-[var(--text-muted)] mb-1">Dashboard / Overview</p>
          <h1 className="text-3xl font-black text-[var(--text-main)]">System Overview</h1>
        </div>
        <div className="flex items-center gap-3">
          <a 
            href={process.env.NEXT_PUBLIC_FIREBASE_CONSOLE_URL || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-500 rounded-xl font-bold text-sm hover:bg-orange-500/20 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            Firebase
            <ExternalLink size={14} />
          </a>
          <a 
            href={process.env.NEXT_PUBLIC_UPSTASH_CONSOLE_URL || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl font-bold text-sm hover:bg-emerald-500/20 transition-colors"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Upstash
            <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <Link
            key={i}
            href={stat.href}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 hover:shadow-lg transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center text-white`}>
                <stat.icon size={24} />
              </div>
              <ArrowUpRight size={20} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-3xl font-black text-[var(--text-main)] mb-1">
              {loading ? "..." : stat.value}
            </div>
            <div className="text-sm font-medium text-[var(--text-muted)]">{stat.label}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
