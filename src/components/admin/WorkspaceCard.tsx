"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function WorkspaceCard({ workspace }: { workspace: any }) {
  const router = useRouter();
  const logo = workspace.settings?.logo;
  const color = workspace.settings?.color || "#3b82f6";

  return (
    <div 
      onClick={() => router.push(`/admin/workspace/${workspace.id}`)}
      className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-color)] hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
         <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-xl text-blue-600">
           <ArrowRight size={18} />
         </div>
      </div>

      <div className="flex items-start gap-4 mb-6">
        {logo ? (
          <img src={logo} alt={workspace.name} className="w-14 h-14 rounded-2xl object-contain border border-[var(--border-color)] shadow-sm" />
        ) : (
          <div 
            className="w-14 h-14 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg transition-transform group-hover:scale-110 duration-300"
            style={{ backgroundColor: color }}
          >
            {workspace.name[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0 pt-1">
          <h3 className="text-xl font-bold text-[var(--text-main)] group-hover:text-blue-600 transition-colors truncate">
            {workspace.name}
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Workspace</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
           <span className="text-xs font-semibold text-[var(--text-muted)]">Active</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
           <Settings size={14} />
           <span>Settings</span>
        </div>
      </div>
    </div>
  );
}
