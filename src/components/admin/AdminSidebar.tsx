"use client";

import React, { useState, useEffect } from "react";

import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
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
  Plus,
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

import { collection, query, where, onSnapshot, collectionGroup } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CreateWorkspaceModal } from "@/components/admin/CreateWorkspaceModal";
import { DeleteWorkspaceModal } from "@/components/admin/DeleteWorkspaceModal";
import { useTheme } from "@/lib/theme-context";
import { doc } from "firebase/firestore";
import { Trash2, Sun, Moon, MoreVertical } from "lucide-react";
import { HelpDeckLogo } from "@/components/common/HelpDeckLogo";

export function AdminSidebar({ workspaceId, activeTab, ownerId: propOwnerId }: { workspaceId?: string, activeTab: string, ownerId?: string }) {
  const { user, userProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Resolve ownerId: from prop, then from search params, then from current user
  const resolvedOwnerId = propOwnerId || searchParams.get("owner") || user?.uid || "";

  // Workspace Switcher State
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [sharedWorkspaces, setSharedWorkspaces] = useState<any[]>([]);
  const [showWsSwitcher, setShowWsSwitcher] = useState(false);
  
  const allWorkspaces = [...workspaces, ...sharedWorkspaces];
  const currentWs = allWorkspaces.find(w => w.id === workspaceId);

  // Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [wsToDelete, setWsToDelete] = useState<any>(null);

  // Refs for click outside
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    // Listen to user's own workspaces (subcollection)
    const unsubOwned = onSnapshot(
      collection(db, "users", user.uid, "workspaces"),
      (snap) => {
        const owned = snap.docs.map(doc => ({ 
          id: doc.id, 
          ownerId: user.uid,
          ...doc.data() 
        }));
        setWorkspaces(owned);
      }
    );

    // Listen to shared workspaces (collection group)
    const unsubShared = onSnapshot(
      query(
        collectionGroup(db, "workspaces"),
        where("memberEmails", "array-contains", user.email)
      ),
      (snap) => {
        const shared = snap.docs
          .map(doc => {
            const pathParts = doc.ref.path.split('/');
            const ownerId = pathParts[1];
            return { 
              id: doc.id, 
              ownerId,
              ...doc.data() 
            };
          })
          .filter(ws => ws.ownerId !== user.uid);
        setSharedWorkspaces(shared);
      }
    );

    return () => {
      unsubOwned();
      unsubShared();
    };
  }, [user]);

  const handleDeleteClick = (e: React.MouseEvent, ws: any) => {
    e.stopPropagation();
    setWsToDelete(ws);
    setShowDeleteModal(true);
  };

  const onWorkspaceDeleted = () => {
     if (workspaceId === wsToDelete?.id) router.push('/admin/dashboard');
     setWsToDelete(null);
  };

  const navItems = [
    { 
      id: 'chat', 
      label: 'Live Inbox', 
      icon: MessageSquare, 
      path: `/admin/chat/${workspaceId}?owner=${resolvedOwnerId}`, 
      enabled: !!workspaceId 
    },
    { 
      id: 'design', 
      label: 'Design', 
      icon: Palette, 
      path: `/admin/workspace/${workspaceId}?owner=${resolvedOwnerId}`, 
      enabled: !!workspaceId 
    },
    { 
      id: 'installation', 
      label: 'Installation', 
      icon: Code2, 
      path: `/admin/workspace/${workspaceId}/install?owner=${resolvedOwnerId}`, 
      enabled: !!workspaceId 
    },
    { 
      id: 'members', 
      label: 'Members', 
      icon: Users, 
      path: `/admin/workspace/${workspaceId}/members?owner=${resolvedOwnerId}`, 
      enabled: !!workspaceId 
    },
  ];

  const planLabel = userProfile?.subscription?.plan 
    ? userProfile.subscription.plan.charAt(0).toUpperCase() + userProfile.subscription.plan.slice(1)
    : "Trial";

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
      <div className={cn("p-6 pb-2 transition-all duration-300 flex items-center justify-between", isCollapsed ? "px-0 justify-center" : "px-8")}>
        <Link href="/admin/dashboard" className="flex items-center gap-3 group">
          <HelpDeckLogo className="w-10 h-10" textClassName={cn("text-xl transition-opacity duration-300", isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100")} />
        </Link>
        
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
                   {currentWs.settings?.logo ? (
                      <img src={currentWs.settings.logo} alt={currentWs.name} className="w-8 h-8 rounded-lg object-contain bg-white border border-[var(--border-color)] text-[var(--text-muted)] shrink-0" />
                   ) : currentWs.name.toLowerCase() === 'help deck' ? (
                     <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0">
                        <span className="text-white font-black text-xs">HD</span>
                     </div>
                   ) : currentWs.name.toLowerCase() === 'pledgechat' ? (
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                        <span className="text-white font-black text-xs">PC</span>
                      </div>
                   ) : (
                     <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0"
                      style={{ backgroundColor: currentWs.settings?.color || '#3b82f6' }}
                     >
                       {currentWs.name[0].toUpperCase()}
                     </div>
                   )}
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
               {allWorkspaces.map(ws => (
                 <button 
                    key={ws.id}
                    onClick={() => { setShowWsSwitcher(false); router.push(`/admin/chat/${ws.id}?owner=${ws.ownerId}`); }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg-main)] transition-colors text-left group/item relative"
                 >
                     {ws.settings?.logo ? (
                        <img src={ws.settings.logo} alt={ws.name} className="w-8 h-8 rounded-lg object-contain bg-white border border-[var(--border-color)] shrink-0" />
                     ) : ws.name.toLowerCase() === 'help deck' ? (
                        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0">
                           <span className="text-white font-black text-xs">HD</span>
                        </div>
                     ) : ws.name.toLowerCase() === 'pledgechat' ? (
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                           <span className="text-white font-black text-xs">PC</span>
                        </div>
                     ) : (
                       <div 
                         className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0"
                         style={{ backgroundColor: ws.settings?.color || '#3b82f6' }}
                       >
                         {ws.name[0].toUpperCase()}
                       </div>
                     )}
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
               
               {allWorkspaces.length > 0 && <div className="h-[1px] bg-[var(--border-color)] my-1" />}
               
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
        userEmail={user?.email || ""}
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />

      {/* Delete Modal */}
      {wsToDelete && (
        <DeleteWorkspaceModal 
           workspaceId={wsToDelete.id}
           ownerId={wsToDelete.ownerId}
           workspaceName={wsToDelete.name}
           isOpen={showDeleteModal}
           onClose={() => setShowDeleteModal(false)}
           onSuccess={onWorkspaceDeleted}
        />
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto overflow-x-hidden no-scrollbar">
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
      <div className="p-4 mt-auto relative" ref={userMenuRef}>
        <div className={cn(
          "transition-all duration-300",
          !isCollapsed && "bg-[var(--bg-main)] rounded-[20px] border border-[var(--border-color)] p-2",
          isCollapsed && "flex justify-center"
        )}>
           <button 
             onClick={() => setShowUserMenu(!showUserMenu)}
             className={cn("flex items-center gap-3 w-full text-left rounded-xl transition-colors", 
               !isCollapsed && "hover:bg-[var(--bg-card)] p-2",
               isCollapsed && "justify-center grayscale hover:grayscale-0"
             )}
           >
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white dark:border-black shadow-sm shrink-0 uppercase text-lg overflow-hidden">
               {userProfile?.photoBase64 ? (
                 <img src={userProfile.photoBase64} alt="Profile" className="w-full h-full object-cover" />
               ) : user?.photoURL ? (
                 <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 user?.displayName?.[0] || user?.email?.[0] || 'U'
               )}
             </div>
             {!isCollapsed && (
               <div className="flex-1 min-w-0 transition-opacity duration-300">
                 <div className="text-sm font-black text-[var(--text-main)] truncate">
                   @{user?.displayName?.split(' ').join('_') || user?.email?.split('@')[0]}
                 </div>
                 <div className="text-[10px] font-bold text-amber-600 flex items-center gap-1 uppercase tracking-wider">
                   <Crown size={10} />
                   {planLabel}
                 </div>
               </div>
             )}
             {!isCollapsed && (
               <MoreVertical size={16} className="text-[var(--text-muted)]" />
             )}
           </button>
        </div>

        {/* User Popup Menu */}
        {showUserMenu && (
           <div className={cn(
             "absolute bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl p-2 z-50 animate-in duration-200",
             isCollapsed 
               ? "left-full bottom-4 ml-4 w-64 slide-in-from-left-2" 
               : "bottom-full left-0 right-0 mb-2 slide-in-from-bottom-2"
           )}>
              <div className="px-3 py-2 border-b border-[var(--border-color)] mb-1">
                 <div className="text-sm font-black text-[var(--text-main)] truncate">
                   {user?.displayName || 'User'}
                 </div>
                 <div className="text-xs text-[var(--text-muted)] truncate">
                   {user?.email}
                 </div>
              </div>
              <button 
                onClick={logout}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl font-bold transition-colors"
                >
               <LogOut size={16} className="shrink-0" />
               <span className="whitespace-nowrap">Sign Out</span>
             </button>
           </div>
        )}
      </div>
    </div>
  );
}
