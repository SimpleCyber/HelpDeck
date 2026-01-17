"use client";

import { useRouter } from "next/navigation";
import { MessageSquare, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function WorkspaceCard({ workspace }: { workspace: any }) {
  const router = useRouter();
  const logo = workspace.settings?.logo;
  const color = workspace.settings?.color || "#3b82f6";

  return (
    <div 
      onClick={() => router.push(`/admin/chat/${workspace.id}`)}
      className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-color)] hover:border-blue-300 dark:hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
         <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20">
           <MessageSquare size={18} />
         </div>
      </div>
      
      {workspace.unreadCount > 0 && (
         <div className="absolute top-5 right-5 z-10">
            <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-[var(--bg-card)] shadow-sm animate-in zoom-in">
              {workspace.unreadCount} New
            </div>
         </div>
      )}

      <div className="flex items-start gap-4 mb-6">
        {logo ? (
          <img src={logo} alt={workspace.name} className="w-14 h-14 rounded-2xl object-contain border border-[var(--border-color)] shadow-sm bg-white" />
        ) : workspace.name.toLowerCase() === 'help deck' ? (
           <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center border border-white/10 shadow-lg shrink-0">
              <span className="text-white font-black text-xl">HD</span>
           </div>
        ) : workspace.name.toLowerCase() === 'pledgechat' ? (
           <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg shrink-0">
              <span className="text-white font-black text-xl">PC</span>
           </div>
        ) : (
          <div 
            className="w-14 h-14 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg transition-transform group-hover:scale-105 duration-300"
            style={{ backgroundColor: color }}
          >
            {workspace.name[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0 pt-1">
          <h3 className="text-xl font-black text-[var(--text-main)] group-hover:text-blue-600 transition-colors truncate tracking-tight">
            {workspace.name}
          </h3>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5 uppercase font-black tracking-widest opacity-60">Workspace</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-5 border-t border-[var(--border-color)]">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
           <span className="text-xs font-bold text-[var(--text-muted)]">Active</span>
        </div>
        <button 
           onClick={(e) => {
             e.stopPropagation();
             router.push(`/admin/workspace/${workspace.id}`);
           }}
           className="flex items-center gap-1.5 text-xs font-black text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-2 rounded-xl transition-colors"
        >
           <Settings size={14} className="group-hover:rotate-90 transition-transform duration-500" />
           <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
