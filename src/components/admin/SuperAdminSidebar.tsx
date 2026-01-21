"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Heart,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useTheme } from "@/lib/theme-context";
import { HelpDeckLogo } from "@/components/common/HelpDeckLogo";

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/superadmin' },
  { id: 'customers', label: 'Customers', icon: Users, path: '/superadmin/customers' },
  { id: 'plans', label: 'Plans Config', icon: Settings, path: '/superadmin/plans' },
  { id: 'health', label: 'Health', icon: Heart, path: '/superadmin/health' },
];

interface HealthStatus {
  firebase: boolean;
  upstash: boolean;
}

export function SuperAdminSidebar({ healthStatus }: { healthStatus?: HealthStatus }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  // Determine active tab from pathname
  const getActiveTab = () => {
    if (pathname === '/superadmin') return 'overview';
    if (pathname.includes('/superadmin/customers')) return 'customers';
    if (pathname.includes('/superadmin/plans')) return 'plans';
    if (pathname.includes('/superadmin/health')) return 'health';
    return 'overview';
  };

  const activeTab = getActiveTab();

  // Calculate overall health
  const overallHealthy = healthStatus ? (healthStatus.firebase && healthStatus.upstash) : true;
  const healthyCount = healthStatus 
    ? (healthStatus.firebase ? 1 : 0) + (healthStatus.upstash ? 1 : 0) 
    : 2;

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-64 bg-[#1a1f2e] flex flex-col h-full text-white">
      {/* Header */}
      <div className="p-6 pb-4 flex items-center justify-between">
        <Link href="/superadmin" className="flex items-center gap-3">
          <HelpDeckLogo className="w-8 h-8" textClassName="text-lg text-white" />
        </Link>
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>

      {/* Navigation Label */}
      <div className="px-6 py-2">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Navigation</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <Link 
            key={item.id}
            href={item.path}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 group relative",
              activeTab === item.id 
                ? "bg-blue-600 text-white" 
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon size={18} />
            <span className="text-sm">{item.label}</span>
            {/* Health indicator for Health nav item */}
            {item.id === 'health' && (
              <div className={cn(
                "ml-auto w-2 h-2 rounded-full",
                overallHealthy ? "bg-green-500" : "bg-red-500"
              )} />
            )}
          </Link>
        ))}
      </nav>

      {/* Health Status Summary */}
      <div className="px-4 py-3 mx-3 mb-3 bg-white/5 rounded-xl">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400 font-medium">System Health</span>
          <span className={cn(
            "font-bold",
            overallHealthy ? "text-green-400" : "text-red-400"
          )}>
            {healthyCount}/2 Healthy
          </span>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-3 mt-auto relative" ref={userMenuRef}>
        <button 
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-3 w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm uppercase overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.displayName?.[0] || user?.email?.[0] || 'A'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate">
              {user?.displayName || 'Admin'}
            </div>
            <div className="text-[10px] text-purple-400 font-bold uppercase">
              Super Admin
            </div>
          </div>
          <ChevronDown size={16} className={cn(
            "text-gray-500 transition-transform",
            showUserMenu && "rotate-180"
          )} />
        </button>

        {/* User Menu */}
        {showUserMenu && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#252b3d] border border-white/10 rounded-xl shadow-2xl p-2 z-50">
            <div className="px-3 py-2 border-b border-white/10 mb-1">
              <div className="text-sm font-bold text-white truncate">
                {user?.displayName || 'Admin'}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {user?.email}
              </div>
            </div>
            <Link 
              href="/admin/dashboard"
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-blue-400 hover:bg-white/5 rounded-xl font-medium transition-colors"
            >
              <LayoutDashboard size={16} />
              <span>User Dashboard</span>
            </Link>
            <button 
              onClick={logout}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-400 hover:bg-white/5 rounded-xl font-medium transition-colors"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
