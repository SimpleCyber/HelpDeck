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
  PanelLeftOpen,
  Palette,
  Code2,
  Users,
  CheckCircle2,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CreateWorkspaceModal } from "@/components/admin/CreateWorkspaceModal";
import { DeleteWorkspaceModal } from "@/components/admin/DeleteWorkspaceModal";
import { useTheme } from "@/lib/theme-context";
import { doc } from "firebase/firestore";
import { Trash2, Sun, Moon, MoreVertical } from "lucide-react";

export function AdminSidebar({ workspaceId, activeTab }: { workspaceId?: string, activeTab: string }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Workspace Switcher State
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [showWsSwitcher, setShowWsSwitcher] = useState(false);
  const currentWs = workspaces.find(w => w.id === workspaceId);

  // Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [wsToDelete, setWsToDelete] = useState<any>(null); // Store full workspace object

  useEffect(() => {
    if (user) {
      const fetchWorkspaces = async () => {
        // Fetch owned
        const qOwner = query(collection(db, "workspaces"), where("ownerId", "==", user.uid));
        const snapOwner = await getDocs(qOwner);
        const owned = snapOwner.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch shared
        const qMember = query(collection(db, "workspaces"), where("memberEmails", "array-contains", user.email));
        const snapMember = await getDocs(qMember);
        const shared = snapMember.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Merge and remove duplicates
        const all = [...owned, ...shared.filter(s => !owned.some(o => o.id === s.id))];
        setWorkspaces(all);
      };
      fetchWorkspaces();
    }
  }, [user, showCreateModal]); // Refresh list when modal closes (created)

  const handleDeleteClick = (e: React.MouseEvent, ws: any) => {
    e.stopPropagation();
    setWsToDelete(ws);
    setShowDeleteModal(true);
  };

  const onWorkspaceDeleted = () => {
     setWorkspaces(prev => prev.filter(w => w.id !== wsToDelete?.id));
     if (workspaceId === wsToDelete?.id) router.push('/admin/dashboard');
     setWsToDelete(null);
  };

  const navItems = [
    { 
      id: 'chat', 
      label: 'Live Inbox', 
      icon: MessageSquare, 
      path: `/admin/chat/${workspaceId}`, 
      enabled: !!workspaceId 
    },
    { 
      id: 'design', 
      label: 'Design', 
      icon: Palette, 
      path: `/admin/workspace/${workspaceId}`, 
      enabled: !!workspaceId 
    },
    { 
      id: 'installation', 
      label: 'Installation', 
      icon: Code2, 
      path: `/admin/workspace/${workspaceId}/install`, 
      enabled: !!workspaceId 
    },
    { 
      id: 'members', 
      label: 'Members', 
      icon: Users, 
      path: `/admin/workspace/${workspaceId}/members`, 
      enabled: !!workspaceId 
    },
  ];

  return (
    <div className={cn(
      "bg-[var(--bg-card)] border-r border-[var(--border-color)] flex flex-col shrink-0 h-full shadow-2xl transition-all duration-300 relative z-50",
      isCollapsed ? "w-24" : "w-72"
    )}>
      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-12 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-full p-1.5 text-[var(--text-muted)] hover:text-blue-600 shadow-xl z-50 transition-colors transform hover:scale-110 active:scale-95"
      >
        {isCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
      </button>

      {/* Header / Logo */}
      <div className={cn("p-6 pb-2 transition-all duration-300 flex items-center justify-between", isCollapsed ? "px-6 flex-col gap-4" : "px-8")}>
        <Link href="/admin/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-black shadow-lg shrink-0 transition-transform group-hover:scale-105 duration-300">
            <LifeBuoy size={20} className="animate-spin-slow" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-black text-[var(--text-main)] tracking-tight transition-opacity duration-300">
              HelpDeck
            </span>
          )}
        </Link>
        
        {/* Theme Toggle in Header */}
        {!isCollapsed && (
           <button 
             onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
             className="w-8 h-8 rounded-full bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors border border-[var(--border-color)]"
           >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
           </button>
        )}
      </div>

      {/* Workspace Switcher */}
      {!isCollapsed && (
        <div className="px-6 py-4 relative">
          <button 
            onClick={() => setShowWsSwitcher(!showWsSwitcher)}
            className="w-full flex items-center justify-between p-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-main)] hover:border-blue-500/30 transition-all shadow-sm group"
          >
             <div className="flex items-center gap-3 overflow-hidden">
               {currentWs ? (
                 <>
                   <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0"
                    style={{ backgroundColor: currentWs.settings?.color || '#3b82f6' }}
                   >
                     {currentWs.name[0].toUpperCase()}
                   </div>
                   <div className="flex flex-col items-start min-w-0">
                      <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Workspace</span>
                      <span className="text-sm font-black text-[var(--text-main)] truncate w-full">{currentWs.name}</span>
                   </div>
                 </>
               ) : (
                 <>
                   <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
                     <LayoutDashboard size={14} />
                   </div>
                   <div className="flex flex-col items-start">
                      <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Select</span>
                      <span className="text-sm font-black text-[var(--text-main)]">Dashboard</span>
                   </div>
                 </>
               )}
             </div>
             <ChevronDown size={14} className={cn("text-[var(--text-muted)] transition-transform duration-300", showWsSwitcher ? "rotate-180" : "")} />
          </button>

          {/* Switcher Dropdown */}
          <div 
             className={cn(
               "absolute top-full left-6 right-6 mt-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 z-50 origin-top",
               showWsSwitcher ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
             )}
          >
            <div className="max-h-64 overflow-y-auto p-2 space-y-1">
               {workspaces.map(ws => (
                 <button 
                    key={ws.id}
                    onClick={() => { setShowWsSwitcher(false); router.push(`/admin/chat/${ws.id}`); }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg-main)] transition-colors text-left group/item relative"
                 >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0"
                      style={{ backgroundColor: ws.settings?.color || '#3b82f6' }}
                    >
                      {ws.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-[var(--text-main)] truncate">{ws.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)] truncate">{ws.id === workspaceId && "Current"}</div>
                    </div>
                    {ws.id === workspaceId && <CheckCircle2 size={14} className="text-blue-600" />}
                    
                    {/* Delete Action (only for owner) */}
                    {ws.ownerId === user?.uid && (
                      <div 
                        onClick={(e) => handleDeleteClick(e, ws)}
                        className="absolute right-2 opacity-0 group-hover/item:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-all hover:scale-110"
                        title="Delete Workspace"
                      >
                         <Trash2 size={14} />
                      </div>
                    )}
                 </button>
               ))}
               
               {workspaces.length > 0 && <div className="h-[1px] bg-[var(--border-color)] my-1" />}
               
               <button 
                  onClick={() => { setShowWsSwitcher(false); setShowCreateModal(true); }}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg-main)] transition-colors text-left group"
               >
                  <div className="w-8 h-8 rounded-lg border border-dashed border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-blue-600 group-hover:border-blue-600 transition-colors shrink-0">
                     <Plus size={14} />
                  </div>
                  <span className="text-sm font-bold text-[var(--text-muted)] group-hover:text-blue-600 transition-colors">Create Workspace</span>
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <CreateWorkspaceModal 
        userId={user?.uid || ""} 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />

      {/* Delete Modal */}
      {wsToDelete && (
        <DeleteWorkspaceModal 
           workspaceId={wsToDelete.id}
           workspaceName={wsToDelete.name}
           isOpen={showDeleteModal}
           onClose={() => setShowDeleteModal(false)}
           onSuccess={onWorkspaceDeleted}
        />
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <button 
            key={item.id}
            disabled={!item.enabled}
            onClick={() => router.push(item.path)}
            className={cn(
              "flex items-center w-full px-4 py-3.5 rounded-2xl font-bold transition-all duration-200 group relative",
              isCollapsed ? "justify-center" : "justify-between",
              item.enabled ? (
                activeTab === item.id 
                  ? "bg-black dark:bg-white text-white dark:text-black shadow-lg shadow-black/10 dark:shadow-white/10" 
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)]"
              ) : "text-[var(--text-muted)] opacity-30 cursor-not-allowed"
            )}
          >
            <div className="flex items-center gap-3.5">
              <item.icon size={20} className={cn(
                "transition-colors shrink-0",
                activeTab === item.id ? "text-white dark:text-black" : "group-hover:text-[var(--text-main)]"
              )} />
              {!isCollapsed && <span className="whitespace-nowrap text-[15px]">{item.label}</span>}
            </div>
            
            {isCollapsed && (
              <div className="absolute left-full ml-5 px-3 py-2 bg-[var(--text-main)] text-[var(--bg-main)] text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 font-bold shadow-xl translate-x-2 group-hover:translate-x-0">
                {item.label}
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 mt-auto">
        <div className={cn(
          "bg-[var(--bg-main)] rounded-[20px] transition-all duration-300 overflow-hidden border border-[var(--border-color)]",
          isCollapsed ? "p-1.5" : "p-2"
        )}>
           <button 
             onClick={() => setShowLogout(!showLogout)}
             className={cn("flex items-center gap-3 w-full text-left p-2 rounded-xl hover:bg-[var(--bg-card)] transition-colors", isCollapsed ? "justify-center" : "")}
           >
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white dark:border-black shadow-sm shrink-0 uppercase text-lg">
               {user?.displayName?.[0] || user?.email?.[0] || 'U'}
             </div>
             {!isCollapsed && (
               <div className="flex-1 min-w-0 transition-opacity duration-300">
                 <div className="text-sm font-black text-[var(--text-main)] truncate">
                   @{user?.displayName?.split(' ').join('_') || user?.email?.split('@')[0]}
                 </div>
                 <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                   Workspace
                 </div>
               </div>
             )}
             {!isCollapsed && (
               showLogout ? <ChevronDown size={14} className="text-[var(--text-muted)]" /> : <ChevronUp size={14} className="text-[var(--text-muted)]" />
             )}
           </button>
           
           <div 
             className={cn(
               "transition-all duration-300 ease-in-out overflow-hidden px-2",
               showLogout ? "max-h-20 mt-2 opacity-100" : "max-h-0 opacity-0"
             )}
           >
             <button 
              onClick={logout}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl font-bold transition-colors mb-2",
                isCollapsed ? "justify-center" : ""
              )}
            >
              <LogOut size={16} className="shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">Sign Out</span>}
            </button>
           </div>
        </div>
      </div>
    </div>
  );
}
