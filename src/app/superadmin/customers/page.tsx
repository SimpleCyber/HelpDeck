"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Users, 
  ChevronDown, 
  ChevronRight,
  MoreHorizontal,
  Search,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

// ... Keep existing interfaces ...
interface Workspace {
  id: string;
  name: string;
  settings?: {
    logo?: string;
    color?: string;
  };
  createdAt?: any;
  lastVisitedAt?: any;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  photoBase64?: string;
  createdAt?: any;
  subscription: {
    plan: "trial" | "basic" | "premium";
    status: "active" | "expired" | "cancelled";
    startDate?: any;
    endDate?: any;
  };
  workspaces: Workspace[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // ... Keep fetching logic ...
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const customersData: Customer[] = [];

        for (const userDoc of usersSnap.docs) {
          const userData = userDoc.data();
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
            subscription: userData.subscription || { plan: "trial", status: "active" },
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
    fetchCustomers();
  }, []);

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPlanBadge = (plan: string) => {
    const styles = {
      trial: "bg-orange-50 text-orange-600 border-orange-100",
      basic: "bg-blue-50 text-blue-600 border-blue-100",
      premium: "bg-purple-50 text-purple-600 border-purple-100",
    };
    const style = styles[plan as keyof typeof styles] || "bg-slate-50 text-slate-600 border-slate-100";
    
    return (
      <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold border capitalize", style)}>
        {plan}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    return (
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-2 h-2 rounded-full",
          status === "active" ? "bg-emerald-500" : 
          status === "expired" ? "bg-red-500" : "bg-slate-300"
        )} />
        <span className={cn(
          "text-sm font-semibold capitalize",
          status === "active" ? "text-slate-700" : "text-slate-500"
        )}>{status}</span>
      </div>
    );
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
            <p className="text-slate-500 text-sm">Manage user access and subscriptions.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 shadow-sm"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
              <Filter size={16} />
              Filter
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[50px_2fr_1fr_1fr_1fr_1fr_50px] gap-4 px-6 py-4 bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div></div>
            <div>User</div>
            <div>Plan</div>
            <div>Status</div>
            <div>Workspaces</div>
            <div>Joined</div>
            <div></div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-12 text-center text-slate-400">Loading customers...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-12 text-center text-slate-400">No customers found matching your search.</div>
            ) : (
              filteredCustomers.map((customer) => (
                <div key={customer.id}>
                  {/* Row */}
                  <div 
                    className="grid grid-cols-[50px_2fr_1fr_1fr_1fr_1fr_50px] gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => toggleRow(customer.id)}
                  >
                    <div className="text-slate-400">
                      {customer.workspaces.length > 0 && (
                        expandedRows.has(customer.id) ? <ChevronDown size={18} /> : <ChevronRight size={18} />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden shadow-sm"
                        style={{ backgroundColor: `hsl(${customer.name.charCodeAt(0) * 5}, 70%, 50%)` }}
                      >
                        {customer.photoBase64 ? (
                          <img src={customer.photoBase64} alt={customer.name} className="w-full h-full object-cover" />
                        ) : (
                          customer.name[0]
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{customer.name}</div>
                        <div className="text-xs text-slate-500 truncate">{customer.email}</div>
                      </div>
                    </div>

                    <div>{getPlanBadge(customer.subscription.plan)}</div>
                    <div>{getStatusBadge(customer.subscription.status)}</div>
                    
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                       <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs">
                         {customer.workspaces.length}
                       </span>
                       Workspaces
                    </div>

                    <div className="text-sm font-medium text-slate-500">
                      {customer.createdAt?.toDate().toLocaleDateString()}
                    </div>

                    <div>
                      <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedRows.has(customer.id) && customer.workspaces.length > 0 && (
                    <div className="px-16 py-4 bg-slate-50/50 border-t border-slate-100 shadow-inner">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Linked Workspaces</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {customer.workspaces.map((ws) => (
                           <div key={ws.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm overflow-hidden"
                                style={{ backgroundColor: ws.settings?.color || '#3b82f6' }}
                              >
                                {ws.settings?.logo ? (
                                  <img src={ws.settings.logo} alt={ws.name} className="w-full h-full object-contain bg-white" />
                                ) : (
                                  ws.name[0]?.toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 text-sm truncate">{ws.name}</div>
                                <div className="font-mono text-[10px] text-slate-400 truncate">{ws.id}</div>
                              </div>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
