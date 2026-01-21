"use client";

import { useEffect, useState } from "react";
import { 
  RefreshCw, 
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceStatus {
  name: string;
  status: "healthy" | "unhealthy" | "checking";
  lastError?: string;
  lastChecked?: Date;
  icon: string;
  color: string;
}

export default function HealthPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { 
      name: "Firebase Service", 
      status: "checking", 
      icon: "🔥",
      color: "orange"
    },
    { 
      name: "Upstash Redis", 
      status: "checking", 
      icon: "⚡",
      color: "emerald"
    },
  ]);
  const [isRunningAll, setIsRunningAll] = useState(false);

  const checkFirebase = async (): Promise<{ healthy: boolean; error?: string }> => {
    try {
      // Simple check - try to access Firestore
      const { db } = await import("@/lib/firebase");
      const { collection, getDocs, limit, query } = await import("firebase/firestore");
      
      const testQuery = query(collection(db, "users"), limit(1));
      await getDocs(testQuery);
      
      return { healthy: true };
    } catch (error: any) {
      return { healthy: false, error: error.message || "Failed to connect to Firebase" };
    }
  };

  const checkUpstash = async (): Promise<{ healthy: boolean; error?: string }> => {
    try {
      const redisUrl = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN;
      
      if (!redisUrl || !redisToken) {
        return { healthy: false, error: "Redis credentials not configured" };
      }

      const response = await fetch(`${redisUrl}/ping`, {
        headers: { Authorization: `Bearer ${redisToken}` }
      });
      
      if (!response.ok) {
        return { healthy: false, error: `Request failed with code ${response.status}` };
      }
      
      return { healthy: true };
    } catch (error: any) {
      return { healthy: false, error: error.message || "Failed to connect to Upstash" };
    }
  };

  const runHealthCheck = async (serviceName: string) => {
    setServices(prev => prev.map(s => 
      s.name === serviceName ? { ...s, status: "checking" as const } : s
    ));

    let result: { healthy: boolean; error?: string };
    
    if (serviceName === "Firebase Service") {
      result = await checkFirebase();
    } else if (serviceName === "Upstash Redis") {
      result = await checkUpstash();
    } else {
      result = { healthy: false, error: "Unknown service" };
    }

    setServices(prev => prev.map(s => 
      s.name === serviceName 
        ? { 
            ...s, 
            status: result.healthy ? "healthy" : "unhealthy",
            lastError: result.error,
            lastChecked: new Date()
          } 
        : s
    ));
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    
    for (const service of services) {
      await runHealthCheck(service.name);
    }
    
    setIsRunningAll(false);
  };

  useEffect(() => {
    runAllTests();
  }, []);

  const getStatusIcon = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "healthy":
        return <CheckCircle size={18} className="text-emerald-500" />;
      case "unhealthy":
        return <XCircle size={18} className="text-red-500" />;
      case "checking":
        return <Loader2 size={18} className="text-blue-500 animate-spin" />;
    }
  };

  const healthyCount = services.filter(s => s.status === "healthy").length;
  const totalCount = services.length;

  return (
    <main className="flex-1 overflow-y-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <p className="text-sm text-[var(--text-muted)]">Admin / System Health</p>
          </div>
          <h1 className="text-3xl font-black text-[var(--text-main)]">System Health Monitor</h1>
          <p className="text-[var(--text-muted)] mt-1">
            Maintain and troubleshoot external API circuit breakers and automation status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm",
            healthyCount === totalCount 
              ? "bg-emerald-500/10 text-emerald-500"
              : "bg-red-500/10 text-red-500"
          )}>
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              healthyCount === totalCount ? "bg-emerald-500" : "bg-red-500"
            )} />
            Live State Monitor
          </div>
        </div>
      </div>

      {/* Service Connectivity Tests Section */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Zap size={20} className="text-yellow-500" />
            <div>
              <h2 className="font-bold text-[var(--text-main)]">Service Connectivity Tests</h2>
              <p className="text-sm text-blue-500">Test all external service connections at once</p>
            </div>
          </div>
          <button
            onClick={runAllTests}
            disabled={isRunningAll}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all",
              isRunningAll 
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-600 active:scale-95"
            )}
          >
            {isRunningAll ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Zap size={18} />
            )}
            {isRunningAll ? "Running..." : "Run All Tests"}
          </button>
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <div 
              key={service.name}
              className="bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <h3 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                      {service.name}
                      {service.status === "healthy" && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                      {service.status === "unhealthy" && (
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                      )}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      {service.status === "healthy" 
                        ? "System is healthy and processing requests normally."
                        : service.status === "unhealthy"
                        ? "Service is experiencing issues."
                        : "Checking service status..."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => runHealthCheck(service.name)}
                  disabled={service.status === "checking"}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-bold text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} className={service.status === "checking" ? "animate-spin" : ""} />
                  Reset
                </button>
              </div>

              {/* Error Display */}
              {service.status === "unhealthy" && service.lastError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">
                    <AlertTriangle size={12} />
                    Last Captured Error
                  </div>
                  <p className="text-sm text-red-500 font-mono">
                    {service.lastError}
                  </p>
                </div>
              )}

              {/* Last Checked */}
              {service.lastChecked && (
                <div className="mt-3 text-xs text-[var(--text-muted)]">
                  Last checked: {service.lastChecked.toLocaleTimeString()}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Health Summary */}
      <div className={cn(
        "p-6 rounded-2xl border",
        healthyCount === totalCount 
          ? "bg-emerald-500/10 border-emerald-500/30"
          : "bg-red-500/10 border-red-500/30"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {healthyCount === totalCount ? (
              <CheckCircle size={32} className="text-emerald-500" />
            ) : (
              <AlertTriangle size={32} className="text-red-500" />
            )}
            <div>
              <h3 className="font-bold text-[var(--text-main)]">
                {healthyCount === totalCount 
                  ? "All Systems Operational"
                  : `${totalCount - healthyCount} Service(s) Require Attention`}
              </h3>
              <p className="text-sm text-[var(--text-muted)]">
                {healthyCount}/{totalCount} services are healthy
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
