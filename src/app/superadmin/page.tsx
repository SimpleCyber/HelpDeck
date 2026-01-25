"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Users,
  Heart,
  Settings,
  ArrowRight,
  ShieldAlert,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalWorkspaces: number;
  totalConversations: number;
  totalUnresolved: number;
  totalMembers: number;
}

interface UpgradeRequest {
  id: string;
  userId: string;
  userEmail: string;
  plan: string;
  period: string;
  createdAt: any;
}

export default function SuperAdminOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalWorkspaces: 0,
    totalConversations: 0,
    totalUnresolved: 0,
    totalMembers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // 1. Fetch Stats
      const usersSnap = await getDocs(collection(db, "users"));
      const totalUsers = usersSnap.size;

      let activeCount = 0;
      let workspaceCount = 0;
      let conversationCount = 0;
      let unresolvedCount = 0;
      const allMembers = new Set<string>();

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        if (userData.subscription?.status === "active") {
          activeCount++;
        }
        const workspacesSnap = await getDocs(
          collection(db, "users", userDoc.id, "workspaces"),
        );
        workspaceCount += workspacesSnap.size;

        for (const wsDoc of workspacesSnap.docs) {
          const wsData = wsDoc.data();
          conversationCount += wsData.stats?.conversationCount || 0;
          unresolvedCount += wsData.stats?.unresolvedCount || 0;
          wsData.memberEmails?.forEach((email: string) =>
            allMembers.add(email),
          );
        }
      }

      setStats({
        totalUsers,
        activeSubscriptions: activeCount,
        totalWorkspaces: workspaceCount,
        totalConversations: conversationCount,
        totalUnresolved: unresolvedCount,
        totalMembers: allMembers.size,
      });

      // 2. Fetch Pending Requests
      const q = query(
        collection(db, "upgrade_requests"),
        where("status", "==", "pending"),
        orderBy("createdAt", "desc"),
      );
      const requestsSnap = await getDocs(q);
      const reqs = requestsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UpgradeRequest[];
      setRequests(reqs);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (
    req: UpgradeRequest,
    action: "approve" | "reject",
  ) => {
    setProcessingId(req.id);
    try {
      if (action === "approve") {
        // 1. Update User Subscription
        const userRef = doc(db, "users", req.userId);
        await updateDoc(userRef, {
          subscription: {
            plan: req.plan,
            status: "active",
            period: req.period,
            startDate: serverTimestamp(),
            // End date logic could be added here (e.g. +30 days), but keeping simple for now
          },
        });
      }

      // 2. Update Request Status
      const reqRef = doc(db, "upgrade_requests", req.id);
      await updateDoc(reqRef, {
        status: action === "approve" ? "approved" : "rejected",
        processedAt: serverTimestamp(),
      });

      // 3. Refresh Local State
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      alert(`Request ${action}d successfully.`);

      // Refresh stats if approved (to update active counts potentially)
      if (action === "approve") fetchData();
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      alert(`Failed to ${action} request.`);
    } finally {
      setProcessingId(null);
    }
  };

  const statCards = [
    {
      label: "Total Admin Users",
      value: stats.totalUsers,
      subtext: `${stats.activeSubscriptions} Active Subscriptions`,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      href: "/superadmin/customers",
    },
    {
      label: "Total Conversations",
      value: stats.totalConversations,
      subtext: `${stats.totalUnresolved} Unresolved Queries`,
      icon: MessageSquare,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-900/20",
      href: "/superadmin/customers",
    },
    {
      label: "Team Members",
      value: stats.totalMembers,
      subtext: `Across ${stats.totalWorkspaces} Workspaces`,
      icon: Activity,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      href: "/superadmin/health",
    },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-[#0f172a] p-8 h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Overview
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Welcome back to the command center.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((stat, i) => (
            <Link
              key={i}
              href={stat.href}
              className="group bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-6">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors scale-100 group-hover:scale-110 duration-300",
                    stat.bg,
                    stat.color,
                  )}
                >
                  <stat.icon size={24} />
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ArrowRight size={14} />
                </div>
              </div>

              <div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
                  {loading ? (
                    <div className="h-8 w-16 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                  ) : (
                    stat.value
                  )}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {stat.label}
                  </p>
                  {stat.subtext && (
                    <span className="text-xs font-medium text-slate-400">
                      {stat.subtext}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Requests Queue */}
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock size={18} className="text-blue-500" />
                Pending Requests
              </h3>
              {requests.length > 0 && (
                <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg animate-pulse">
                  {requests.length} New
                </span>
              )}
            </div>

            <div className="flex-1 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="animate-spin text-slate-400" />
                </div>
              ) : requests.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-center text-slate-400 border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50">
                  <p className="text-sm font-medium">
                    No pending upgrade requests.
                  </p>
                </div>
              ) : (
                requests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between group hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {req.userEmail}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="capitalize font-semibold text-blue-600 dark:text-blue-400">
                          {req.plan} Plan
                        </span>
                        <span>•</span>
                        <span className="capitalize">{req.period}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(req, "approve")}
                        disabled={processingId === req.id}
                        className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50"
                        title="Approve"
                      >
                        {processingId === req.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => handleAction(req, "reject")}
                        disabled={processingId === req.id}
                        className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                        title="Reject"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity size={18} className="text-blue-500" />
                System Load
              </h3>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Last 24h
              </span>
            </div>
            <div className="space-y-4">
              {["Database", "Storage", "Authentication"].map((metric) => (
                <div key={metric} className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span>{metric}</span>
                    <span className="text-emerald-500">Normal</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
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
