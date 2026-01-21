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
  ExternalLink,
  ShieldCheck,
  Sun,
  Moon
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useTheme } from "@/lib/theme-context";

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/superadmin' },
  { id: 'customers', label: 'Customers', icon: Users, path: '/superadmin/customers' },
  { id: 'plans', label: 'Plans Config', icon: Settings, path: '/superadmin/plans' },
  { id: 'health', label: 'Systems Health', icon: Heart, path: '/superadmin/health' },
];

interface HealthStatus {
  firebase: boolean;
  upstash: boolean;
}

export function SuperAdminSidebar({ healthStatus }: { healthStatus?: HealthStatus }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
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
    <div className="w-[280px] bg-white dark:bg-[#0f172a] flex flex-col h-full text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-[#1e293b] transition-colors relative">
      {/* Header */}
      <div className="h-20 flex items-center px-6 border-b border-slate-200 dark:border-[#1e293b]">
        <Link href="/superadmin" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white text-base leading-tight">Super Admin</h1>
            <p className="text-[10px] uppercase tracking-wider font-bold text-blue-500">Control Panel</p>
          </div>
        </Link>
      </div>

      {/* Navigation Label */}
      <div className="px-6 pt-8 pb-4">
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-2">Platform</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <Link 
              key={item.id}
              href={item.path}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1e293b] hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <item.icon size={20} className={cn(isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white")} />
              <span className="text-sm font-bold">{item.label}</span>
              {/* Health indicator for Health nav item */}
              {item.id === 'health' && (
                <div className={cn(
                  "ml-auto w-2 h-2 rounded-full ring-2 ring-white dark:ring-[#0f172a]",
                  overallHealthy ? "bg-emerald-500" : "bg-red-500"
                )} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* External Links & Toggle */}
      <div className="px-6 py-6 border-t border-slate-200 dark:border-[#1e293b] space-y-4">
         {/* Theme Toggle */}
         <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center justify-between w-full px-4 py-3 bg-slate-50 dark:bg-[#1e293b] rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2d3b55] transition-colors group"
          >
            <div className="flex items-center gap-3">
               {theme === 'dark' ? <Moon size={18} className="text-purple-500" /> : <Sun size={18} className="text-amber-500" />}
               <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div className={cn(
               "w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded-full relative transition-colors",
               theme === 'dark' ? "bg-purple-900/50" : "bg-amber-200/50"
            )}>
               <div className={cn(
                  "absolute top-0.5 w-3 h-3 rounded-full shadow-sm transition-all duration-300",
                  theme === 'dark' ? "left-4.5 bg-purple-400" : "left-0.5 bg-amber-400",
                  "translate-x-0"
               )} style={{ left: theme === 'dark' ? '18px' : '2px' }} />
            </div>
         </button>

         <div className="space-y-2">
          {/* Quick Access Links */}
          <a 
            href={process.env.NEXT_PUBLIC_FIREBASE_CONSOLE_URL || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-400 hover:text-orange-500 transition-colors group"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            <span className="font-medium">Firebase Console</span>
            <ExternalLink size={12} className="ml-auto opacity-0 group-hover:opacity-100" />
          </a>
          <a 
            href={process.env.NEXT_PUBLIC_UPSTASH_CONSOLE_URL || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-400 hover:text-emerald-500 transition-colors group"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-medium">Upstash Console</span>
            <ExternalLink size={12} className="ml-auto opacity-0 group-hover:opacity-100" />
          </a>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-200 dark:border-[#1e293b]" ref={userMenuRef}>
        <button 
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-3 w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1e293b] transition-colors text-left group"
        >
          {/* Profile Image */}
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-white font-bold text-sm overflow-hidden ring-2 ring-white dark:ring-[#1e293b] group-hover:ring-slate-200 dark:group-hover:ring-slate-600 transition-all">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.displayName?.[0] || user?.email?.[0] || 'A'
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {user?.displayName || 'Admin'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-500 truncate group-hover:text-slate-700 dark:group-hover:text-slate-400">
              {user?.email}
            </div>
          </div>
          
          <div className="text-slate-400 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300">
             <ChevronDown size={16} className={cn("transition-transform", showUserMenu && "rotate-180")} />
          </div>
        </button>

        {/* User Menu */}
        {showUserMenu && (
          <div className="absolute bottom-20 left-4 right-4 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
            <Link 
              href="/admin/dashboard"
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
            >
              <LayoutDashboard size={16} />
              <span>User Dashboard</span>
            </Link>
            <button 
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 font-medium transition-colors border-t border-slate-100 dark:border-slate-700/50"
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
