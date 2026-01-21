"use client";

import { useEffect, useState } from "react";
import { 
  RefreshCw, 
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Server,
  Database,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceStatus {
  name: string;
  type: "database" | "cache" | "api";
  status: "healthy" | "unhealthy" | "checking";
  lastError?: string;
  lastChecked?: Date;
  latency?: number;
}

export default function HealthPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { 
      name: "Firebase Firestore", 
      type: "database",
      status: "checking" 
    },
    { 
      name: "Upstash Redis", 
      type: "cache",
      status: "checking" 
    },
  ]);
  const [isRunningAll, setIsRunningAll] = useState(false);

  const checkFirebase = async (): Promise<{ healthy: boolean; error?: string; latency: number }> => {
    const start = Date.now();
    try {
      const { db } = await import("@/lib/firebase");
      const { collection, getDocs, limit, query } = await import("firebase/firestore");
      const testQuery = query(collection(db, "users"), limit(1));
      await getDocs(testQuery);
      return { healthy: true, latency: Date.now() - start };
    } catch (error: any) {
      return { healthy: false, error: error.message || "Connection failed", latency: 0 };
    }
  };

  const checkUpstash = async (): Promise<{ healthy: boolean; error?: string; latency: number }> => {
    const start = Date.now();
    try {
      const redisUrl = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN;
      if (!redisUrl || !redisToken) throw new Error("Credentials missing");

      const response = await fetch(`${redisUrl}/ping`, {
        headers: { Authorization: `Bearer ${redisToken}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      return { healthy: true, latency: Date.now() - start };
    } catch (error: any) {
      return { healthy: false, error: error.message || "Connection failed", latency: 0 };
    }
  };

  const runHealthCheck = async (serviceName: string) => {
    setServices(prev => prev.map(s => s.name === serviceName ? { ...s, status: "checking" } : s));
    
    let result;
    if (serviceName.includes("Firebase")) result = await checkFirebase();
    else result = await checkUpstash();

    setServices(prev => prev.map(s => s.name === serviceName ? {
      ...s,
      status: result.healthy ? "healthy" : "unhealthy",
      lastError: result.error,
      latency: result.latency,
      lastChecked: new Date()
    } : s));
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    for (const s of services) await runHealthCheck(s.name);
    setIsRunningAll(false);
  };

  useEffect(() => { runAllTests(); }, []);

  const healthyCount = services.filter(s => s.status === "healthy").length;

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
             <h1 className="text-2xl font-bold text-slate-900">System Health</h1>
             <p className="text-sm text-slate-500">Monitor external service connectivity and latency.</p>
          </div>
          <button
            onClick={runAllTests}
            disabled={isRunningAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={cn(isRunningAll && "animate-spin")} />
            {isRunningAll ? "Running Tests..." : "Run All Checks"}
          </button>
        </div>

        {/* Global Status Banner */}
        <div className={cn(
          "rounded-2xl p-6 border shadow-sm flex items-center gap-6",
          healthyCount === services.length 
            ? "bg-emerald-50/50 border-emerald-100" 
            : "bg-red-50/50 border-red-100"
        )}>
           <div className={cn(
             "w-16 h-16 rounded-full flex items-center justify-center shrink-0",
             healthyCount === services.length ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
           )}>
             {healthyCount === services.length ? <Activity size={32} /> : <AlertTriangle size={32} />}
           </div>
           <div>
             <h2 className={cn(
               "text-lg font-bold mb-1",
               healthyCount === services.length ? "text-emerald-900" : "text-red-900"
             )}>
               {healthyCount === services.length ? "All Systems Operational" : "System Issues Detected"}
             </h2>
             <p className={cn(
               "text-sm font-medium",
               healthyCount === services.length ? "text-emerald-700" : "text-red-700"
             )}>
               {healthyCount} / {services.length} services are responding normally.
             </p>
           </div>
        </div>

        {/* Service Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <div key={service.name} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 group hover:border-blue-200 transition-colors">
              <div className="flex items-start justify-between mb-6">
                 <div className="flex items-center gap-4">
                   <div className={cn(
                     "w-12 h-12 rounded-xl flex items-center justify-center",
                     service.type === 'database' ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"
                   )}>
                     {service.type === 'database' ? <Database size={24} /> : <Server size={24} />}
                   </div>
                   <div>
                     <h3 className="font-bold text-slate-900">{service.name}</h3>
                     <p className="text-xs font-semibold text-slate-400 upper tracking-wider">{service.type}</p>
                   </div>
                 </div>
                 <div className={cn(
                   "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border",
                   service.status === "healthy" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                   service.status === "unhealthy" ? "bg-red-50 text-red-600 border-red-100" :
                   "bg-blue-50 text-blue-600 border-blue-100"
                 )}>
                   {service.status === "checking" && <Loader2 size={12} className="animate-spin" />}
                   {service.status === "healthy" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                   {service.status === "unhealthy" && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                   {service.status === "healthy" ? "Healthy" : service.status === "unhealthy" ? "Failed" : "Checking"}
                 </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-50">
                <div>
                   <span className="text-xs text-slate-400 font-medium">Latency</span>
                   <div className="font-mono font-bold text-slate-700 text-lg">
                      {service.latency ? `${service.latency}ms` : '-'}
                   </div>
                </div>
                <div className="text-right">
                   <span className="text-xs text-slate-400 font-medium">Last Checked</span>
                   <div className="text-xs font-semibold text-slate-600 mt-1">
                      {service.lastChecked ? service.lastChecked.toLocaleTimeString() : 'Never'}
                   </div>
                </div>
              </div>

              {/* Error Message */}
              {service.status === "unhealthy" && service.lastError && (
                 <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100 text-xs text-red-600 font-medium flex items-start gap-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                    {service.lastError}
                 </div>
              )}
              
              <div className="mt-4 flex justify-end">
                 <button 
                    onClick={() => runHealthCheck(service.name)}
                    disabled={service.status === "checking"}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50"
                 >
                    Retest Connection
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
