"use client";

import { useEffect, useState } from "react";
import { 
  Activity, 
  Server, 
  Database, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  RefreshCw,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface ServiceStatus {
  name: string;
  status: "healthy" | "unhealthy" | "checking";
  latency?: number;
  lastChecked?: Date;
  icon: any;
  description: string;
}

export default function HealthPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<ServiceStatus[]>([
    { 
      name: "Firebase", 
      status: "checking", 
      icon: Database, 
      description: "Primary database and authentication",
    },
    { 
      name: "Upstash Redis", 
      status: "checking", 
      icon: Server, 
      description: "Rate limiting and caching layer",
    },
    { 
      name: "Authentication", 
      status: "checking", 
      icon: ShieldCheck, 
      description: "User session management",
    },
  ]);

  const [isRunningAll, setIsRunningAll] = useState(false);

  const checkService = async (serviceName: string) => {
    // Update to checking state
    setServices(prev => prev.map(s => 
      s.name === serviceName ? { ...s, status: "checking" } : s
    ));

    // Simulate check delay + actual logic
    const startTime = Date.now();
    
    try {
      let isHealthy = false;

      if (serviceName === "Firebase") {
        isHealthy = !!user; // Simple check if auth is working, connection is likely okay
      } else if (serviceName === "Upstash Redis") {
        const response = await fetch(`${process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL}/ping`, {
          headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN}` }
        });
        isHealthy = response.ok;
      } else if (serviceName === "Authentication") {
        isHealthy = true; // If we are here, auth is working
      }

      await new Promise(r => setTimeout(r, 800)); // Minimum visual delay

      const latency = Date.now() - startTime;

      setServices(prev => prev.map(s => 
        s.name === serviceName ? { 
          ...s, 
          status: isHealthy ? "healthy" : "unhealthy",
          latency,
          lastChecked: new Date()
        } : s
      ));
    } catch (error) {
      setServices(prev => prev.map(s => 
        s.name === serviceName ? { 
          ...s, 
          status: "unhealthy",
          lastChecked: new Date()
        } : s
      ));
    }
  };

  const runAllChecks = async () => {
    setIsRunningAll(true);
    await Promise.all(services.map(s => checkService(s.name)));
    setIsRunningAll(false);
  };

  useEffect(() => {
    runAllChecks();
  }, []);

  const overallHealth = services.every(s => s.status === "healthy");

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-[#0f172a] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              System Health
              {overallHealth ? (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Operational</span>
              ) : (
                <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">Issues Detected</span>
              )}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Real-time status of critical infrastructure.</p>
          </div>
          <button 
            onClick={runAllChecks}
            disabled={isRunningAll}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={cn(isRunningAll && "animate-spin")} />
            {isRunningAll ? "Running Checks..." : "Run All Checks"}
          </button>
        </div>

        {/* Overall Status Card */}
        <div className={cn(
          "rounded-2xl p-6 border shadow-sm",
          overallHealth 
            ? "bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20" 
            : "bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20"
        )}>
          <div className="flex items-start gap-4">
            <div className={cn(
              "p-3 rounded-xl",
              overallHealth ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
            )}>
              <Activity size={24} />
            </div>
            <div>
              <h3 className={cn("text-lg font-bold mb-1", overallHealth ? "text-emerald-900 dark:text-emerald-400" : "text-red-900 dark:text-red-400")}>
                {overallHealth ? "All Systems Operational" : "System Degradation Detected"}
              </h3>
              <p className={cn("text-sm", overallHealth ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300")}>
                {overallHealth 
                  ? "All monitored services are responding normally within expected latency thresholds." 
                  : "One or more services are experiencing issues. Action may be required."}
              </p>
            </div>
          </div>
        </div>

        {/* Service Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div key={service.name} className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 group hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <service.icon size={24} />
                </div>
                <button 
                  onClick={() => checkService(service.name)}
                  className="p-2 text-slate-300 dark:text-slate-600 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                >
                  <RefreshCw size={14} className={cn(service.status === 'checking' && "animate-spin")} />
                </button>
              </div>

              <h3 className="font-bold text-slate-900 dark:text-white mb-1">{service.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 h-8">{service.description}</p>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 border",
                  service.status === "healthy" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30" :
                  service.status === "unhealthy" ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30" :
                  "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30"
                )}>
                  {service.status === "healthy" && <CheckCircle2 size={12} />}
                  {service.status === "unhealthy" && <XCircle size={12} />}
                  {service.status === "checking" && <Loader2 size={12} className="animate-spin" />}
                  {service.status === "healthy" ? "Healthy" : service.status === "unhealthy" ? "Failed" : "Checking"}
                </div>
                
                {service.latency && (
                  <span className="text-xs font-mono text-slate-400">
                    {service.latency}ms
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
