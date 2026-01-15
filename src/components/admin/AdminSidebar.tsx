"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  ChevronRight, 
  ChevronUp, 
  ChevronDown, 
  LifeBuoy,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

export function AdminSidebar({ workspaceId, activeTab }: { workspaceId?: string, activeTab: string }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard', enabled: true, section: 'main' },
    { id: 'settings-global', label: 'App Settings', icon: Settings, path: '/admin/settings', enabled: true, section: 'main' },
    { id: 'chat', label: 'Live Inbox', icon: MessageSquare, path: `/admin/chat/${workspaceId}`, enabled: !!workspaceId, section: 'workspace' },
    { id: 'settings', label: 'Workspace Config', icon: LifeBuoy, path: `/admin/workspace/${workspaceId}`, enabled: !!workspaceId, section: 'workspace' },
  ];

  return (
    <div className={cn(
      "bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col shrink-0 h-full shadow-sm transition-all duration-300 relative",
      isCollapsed ? "w-24" : "w-72"
    )}>
      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-10 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-full p-1.5 text-[var(--text-muted)] hover:text-blue-600 shadow-sm z-50 transition-colors"
      >
        {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </button>

      <div className={cn("p-8 overflow-hidden transition-all duration-300", isCollapsed ? "px-6" : "px-8")}>
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
            <LifeBuoy size={24} />
          </div>
          {!isCollapsed && (
            <span className="text-2xl font-black text-blue-600 tracking-tight transition-opacity duration-300">
              HelpDeck
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-6 overflow-hidden">
        {/* Main Section */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] px-4 mb-4 whitespace-nowrap opacity-50">
              General
            </div>
          )}
          {navItems.filter(i => i.section === 'main').map((item) => (
            <button 
              key={item.id}
              disabled={!item.enabled}
              onClick={() => router.push(item.path)}
              className={cn(
                "flex items-center w-full px-4 py-3 rounded-xl font-bold transition-all duration-200 group relative",
                isCollapsed ? "justify-center" : "justify-between",
                item.enabled ? (
                  activeTab === item.id 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                    : "text-[var(--text-muted)] hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-600"
                ) : "text-[var(--text-muted)] opacity-30 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={cn(
                  "transition-colors shrink-0",
                  activeTab === item.id ? "text-white" : "group-hover:text-blue-600"
                )} />
                {!isCollapsed && <span className="whitespace-nowrap text-sm">{item.label}</span>}
              </div>
              
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-2 bg-[var(--text-main)] text-[var(--bg-main)] text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 font-black uppercase tracking-widest shadow-xl">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Workspace Section */}
        {workspaceId && (
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] px-4 mb-4 whitespace-nowrap opacity-50">
                Workspace
              </div>
            )}
            {navItems.filter(i => i.section === 'workspace').map((item) => (
              <button 
                key={item.id}
                disabled={!item.enabled}
                onClick={() => router.push(item.path)}
                className={cn(
                  "flex items-center w-full px-4 py-3 rounded-xl font-bold transition-all duration-200 group relative",
                  isCollapsed ? "justify-center" : "justify-between",
                  item.enabled ? (
                    activeTab === item.id 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                      : "text-[var(--text-muted)] hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-600"
                  ) : "text-[var(--text-muted)] opacity-30 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} className={cn(
                    "transition-colors shrink-0",
                    activeTab === item.id ? "text-white" : "group-hover:text-blue-600"
                  )} />
                  {!isCollapsed && <span className="whitespace-nowrap text-sm">{item.label}</span>}
                </div>
                
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-3 py-2 bg-[var(--text-main)] text-[var(--bg-main)] text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 font-black uppercase tracking-widest shadow-xl">
                    {item.label}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </nav>

      <div className="p-4 mt-auto overflow-hidden">
        <div className={cn(
          "bg-[var(--bg-main)] rounded-2xl transition-all duration-300 overflow-hidden",
          isCollapsed ? "p-2" : "p-4"
        )}>
           <button 
             onClick={() => setShowLogout(!showLogout)}
             className={cn("flex items-center gap-3 w-full text-left", isCollapsed ? "justify-center" : "")}
           >
             <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-[var(--bg-card)] shadow-sm shrink-0 uppercase">
               {user?.displayName?.[0] || user?.email?.[0] || 'U'}
             </div>
             {!isCollapsed && (
               <div className="flex-1 min-w-0 transition-opacity duration-300">
                 <div className="text-sm font-bold text-[var(--text-main)] truncate">
                   {user?.displayName || user?.email?.split('@')[0]}
                 </div>
                 <div className="text-xs text-[var(--text-muted)] truncate">
                   {user?.email}
                 </div>
               </div>
             )}
             {!isCollapsed && (
               showLogout ? <ChevronDown size={16} className="text-[var(--text-muted)]" /> : <ChevronUp size={16} className="text-[var(--text-muted)]" />
             )}
           </button>
           
           <div 
             className={cn(
               "transition-all duration-300 ease-in-out overflow-hidden",
               showLogout ? "max-h-20 mt-4 pt-4 border-t border-[var(--border-color)] opacity-100" : "max-h-0 opacity-0"
             )}
           >
             <button 
              onClick={logout}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-semibold transition-colors",
                isCollapsed ? "justify-center" : ""
              )}
            >
              <LogOut size={18} className="shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">Sign Out</span>}
            </button>
           </div>
        </div>
        {!isCollapsed && (
          <div className="px-4 text-[10px] text-[var(--text-muted)] font-medium whitespace-nowrap">
            HelpDeck v1.0.4
          </div>
        )}
      </div>
    </div>
  );
}
