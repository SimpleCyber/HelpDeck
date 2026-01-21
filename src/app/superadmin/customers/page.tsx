"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, deleteDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Search, 
  ChevronDown, 
  ChevronRight,
  Trash2,
  ArrowUpCircle,
  PauseCircle,
  ExternalLink,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Workspace {
  id: string;
  name: string;
  settings?: {
    logo?: string;
    color?: string;
  };
  createdAt?: Timestamp;
  lastVisitedAt?: Timestamp;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  photoBase64?: string;
  createdAt?: Timestamp;
  subscription: {
    plan: "trial" | "basic" | "premium";
    status: "active" | "expired" | "cancelled";
    startDate?: Timestamp;
    endDate?: Timestamp;
  };
  workspaces: Workspace[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const customersData: Customer[] = [];

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        
        // Fetch workspaces for this user
        const workspacesSnap = await getDocs(collection(db, "users", userDoc.id, "workspaces"));
        const workspaces: Workspace[] = workspacesSnap.docs.map(wsDoc => ({
          id: wsDoc.id,
          ...wsDoc.data()
        } as Workspace));

        customersData.push({
          id: userDoc.id,
          name: userData.name || userData.email?.split("@")[0] || "Unknown",
          email: userData.email || "",
          photoBase64: userData.photoBase64,
          createdAt: userData.createdAt,
          subscription: userData.subscription || {
            plan: "trial",
            status: "active",
          },
          workspaces,
        });
      }

      setCustomers(customersData);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleSuspend = async (customerId: string) => {
    if (!confirm("Are you sure you want to suspend this user?")) return;
    try {
      await updateDoc(doc(db, "users", customerId), {
        "subscription.status": "cancelled"
      });
      fetchCustomers();
    } catch (error) {
      console.error("Error suspending user:", error);
    }
  };

  const handleDelete = async (customerId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      // Delete user's workspaces first
      const workspacesSnap = await getDocs(collection(db, "users", customerId, "workspaces"));
      for (const wsDoc of workspacesSnap.docs) {
        await deleteDoc(doc(db, "users", customerId, "workspaces", wsDoc.id));
      }
      // Delete user
      await deleteDoc(doc(db, "users", customerId));
      fetchCustomers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate();
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "trial":
        return <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold">⏱ Trial</span>;
      case "basic":
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold">⚡ Basic</span>;
      case "premium":
        return <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-xs font-bold">👑 Pro</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">{plan}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="text-emerald-500 font-bold text-sm">Active</span>;
      case "expired":
        return <span className="text-red-500 font-bold text-sm">Expired</span>;
      case "cancelled":
        return <span className="text-gray-500 font-bold text-sm">Inactive</span>;
      default:
        return <span className="text-gray-500 font-bold text-sm">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin h-10 w-10 text-blue-500" />
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm text-[var(--text-muted)] mb-1">Dashboard / Customers</p>
          <h1 className="text-3xl font-black text-[var(--text-main)]">Customer Information</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
            <input
              type="text"
              placeholder="Search by name, email or twitter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-3 w-80 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-sm font-bold text-blue-500">
            Total Customers: {customers.length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[40px_1fr_120px_100px_150px_150px_180px] gap-4 px-6 py-4 bg-[var(--bg-main)] border-b border-[var(--border-color)] text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
          <div></div>
          <div>Profile</div>
          <div>Plan</div>
          <div>Status</div>
          <div>Period End / Trial End</div>
          <div>Connected Accounts</div>
          <div>Actions</div>
        </div>

        {/* Table Body */}
        {filteredCustomers.length === 0 ? (
          <div className="px-6 py-12 text-center text-[var(--text-muted)]">
            No customers found
          </div>
        ) : (
          filteredCustomers.map((customer, index) => (
            <div key={customer.id}>
              {/* Main Row */}
              <div 
                className={cn(
                  "grid grid-cols-[40px_1fr_120px_100px_150px_150px_180px] gap-4 px-6 py-4 items-center transition-colors cursor-pointer hover:bg-[var(--bg-main)]/50",
                  index % 2 === 1 && "bg-[var(--bg-main)]/30"
                )}
                onClick={() => toggleRow(customer.id)}
              >
                {/* Expand Button */}
                <div>
                  {customer.workspaces.length > 0 && (
                    <button className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                      {expandedRows.has(customer.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>
                  )}
                </div>

                {/* Profile */}
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm uppercase overflow-hidden shrink-0"
                    style={{ backgroundColor: `hsl(${customer.name.charCodeAt(0) * 10}, 60%, 50%)` }}
                  >
                    {customer.photoBase64 ? (
                      <img src={customer.photoBase64} alt={customer.name} className="w-full h-full object-cover" />
                    ) : (
                      customer.name[0]
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-[var(--text-main)]">{customer.name}</div>
                    <div className="text-xs text-[var(--text-muted)] truncate max-w-[200px]">
                      ✉️ {customer.email}
                    </div>
                  </div>
                </div>

                {/* Plan */}
                <div>{getPlanBadge(customer.subscription.plan)}</div>

                {/* Status */}
                <div>{getStatusBadge(customer.subscription.status)}</div>

                {/* Period End */}
                <div className="text-sm text-[var(--text-muted)] font-mono">
                  {formatDate(customer.subscription.endDate)}
                </div>

                {/* Connected Accounts */}
                <div>
                  {customer.workspaces.length > 0 ? (
                    <span className="text-blue-500 font-bold text-sm">
                      ↗ {customer.workspaces.length} Connected
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">None</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => handleSuspend(customer.id)}
                    className="px-3 py-1.5 bg-yellow-100 text-yellow-600 rounded-lg text-xs font-bold hover:bg-yellow-200 transition-colors"
                  >
                    Suspend
                  </button>
                  <button 
                    className="px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-200 transition-colors"
                  >
                    Upgrade
                  </button>
                  <button 
                    onClick={() => handleDelete(customer.id)}
                    className="px-3 py-1.5 bg-red-100 text-red-500 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors"
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>

              {/* Expanded Row - Workspace Details */}
              {expandedRows.has(customer.id) && customer.workspaces.length > 0 && (
                <div className="px-6 py-4 bg-[var(--bg-main)] border-t border-[var(--border-color)]">
                  <div className="ml-10 pl-4 border-l-2 border-blue-500/30">
                    <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                      ↗ Connected Accounts Details
                    </div>
                    <div className="space-y-3">
                      {customer.workspaces.map((ws) => (
                        <div 
                          key={ws.id}
                          className="flex items-center gap-4 p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]"
                        >
                          {/* Workspace Logo */}
                          <div 
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 overflow-hidden"
                            style={{ backgroundColor: ws.settings?.color || '#3b82f6' }}
                          >
                            {ws.settings?.logo ? (
                              <img src={ws.settings.logo} alt={ws.name} className="w-full h-full object-contain bg-white" />
                            ) : (
                              ws.name[0]?.toUpperCase()
                            )}
                          </div>
                          
                          {/* Workspace Info */}
                          <div className="flex-1">
                            <div className="font-bold text-[var(--text-main)] flex items-center gap-2">
                              {ws.name}
                              <ExternalLink size={14} className="text-[var(--text-muted)]" />
                            </div>
                            <div className="text-xs text-[var(--text-muted)] font-mono">
                              # {ws.id}
                            </div>
                          </div>

                          {/* Dates */}
                          <div className="text-right">
                            <div className="text-xs text-[var(--text-muted)]">
                              📅 Created: {formatDate(ws.createdAt)}
                            </div>
                            <div className="text-xs text-[var(--text-muted)]">
                              👁 Last visited: {formatDate(ws.lastVisitedAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
