"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Users, 
  Heart, 
  Settings,
  ArrowRight,
  ShieldAlert,
  Activity
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
        const usersSnap = await getDocs(collection(db, "users"));
        const totalCustomers = usersSnap.size;
        
        let activeCount = 0;
        let workspaceCount = 0;
        
        for (const userDoc of usersSnap.docs) {
          const userData = userDoc.data();
          if (userData.subscription?.status === "active") {
            activeCount++;
          }
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
      subtext: `${stats.activeCustomers} Active Subscriptions`,
      icon: Users, 
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/superadmin/customers"
    },
    { 
      label: "Plan Configuration", 
      value: "3 Tiers",
      subtext: "Trial, Basic, Premium",
      icon: Settings, 
      color: "text-purple-600",
      bg: "bg-purple-50",
      href: "/superadmin/plans"
    },
    { 
      label: "System Health", 
      value: "Monitor",
      subtext: "Firebase & Upstash",
      icon: Heart, 
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      href: "/superadmin/health"
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50/50 p-8 h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
          <p className="text-slate-500 text-sm">Welcome back to the command center.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((stat, i) => (
            <Link
              key={i}
              href={stat.href}
              className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-6">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-colors scale-100 group-hover:scale-110 duration-300", stat.bg, stat.color)}>
                  <stat.icon size={24} />
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ArrowRight size={14} />
                </div>
              </div>
              
              <div>
                <h3 className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">
                  {loading ? (
                    <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" />
                  ) : (
                    stat.value
                  )}
                </h3>
                <div className="flex items-center justify-between mt-2">
                   <p className="text-sm font-semibold text-slate-900">{stat.label}</p>
                   {stat.subtext && (
                     <span className="text-xs font-medium text-slate-400">{stat.subtext}</span>
                   )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity / Status Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
             <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold text-slate-900 flex items-center gap-2">
                 <ShieldAlert size={18} className="text-orange-500" />
                 Security Alerts
               </h3>
               <span className="px-2 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-lg">All Clear</span>
             </div>
             <div className="h-32 flex flex-col items-center justify-center text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
               <p className="text-sm font-medium">No active security threats detected.</p>
             </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
             <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold text-slate-900 flex items-center gap-2">
                 <Activity size={18} className="text-blue-500" />
                 System Load
               </h3>
               <span className="text-xs font-medium text-slate-500">Last 24h</span>
             </div>
             <div className="space-y-4">
               {['Database', 'Storage', 'Authentication'].map(metric => (
                  <div key={metric} className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>{metric}</span>
                      <span className="text-emerald-500">Normal</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 w-[20%] rounded-full opacity-50" />
                    </div>
                  </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
