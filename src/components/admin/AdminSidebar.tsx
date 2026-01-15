"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { LayoutDashboard, MessageSquare, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminSidebar({ workspaceId, activeTab }: { workspaceId?: string, activeTab: string }) {
  const { logout } = useAuth();
  const router = useRouter();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard', enabled: true },
    { id: 'chat', label: 'Messages', icon: MessageSquare, path: `/admin/chat/${workspaceId}`, enabled: !!workspaceId },
    { id: 'settings', label: 'Settings', icon: Settings, path: `/admin/workspace/${workspaceId}`, enabled: !!workspaceId },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 h-full">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold">Crisp Clone</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <button 
            key={item.id}
            disabled={!item.enabled}
            onClick={() => router.push(item.path)}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-2 rounded-lg font-medium transition-colors",
              item.enabled ? (activeTab === item.id ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50") : "text-gray-300 cursor-not-allowed"
            )}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
}
