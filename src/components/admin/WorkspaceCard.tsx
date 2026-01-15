"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function WorkspaceCard({ workspace }: { workspace: any }) {
  const router = useRouter();
  const logo = workspace.settings?.logo;
  const color = workspace.settings?.color || "#3b82f6";

  return (
    <div 
      onClick={() => router.push(`/admin/workspace/${workspace.id}`)}
      className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-4">
        {logo ? (
          <img src={logo} alt={workspace.name} className="w-12 h-12 rounded-xl object-contain border border-gray-100" />
        ) : (
          <div 
            className="w-12 h-12 text-white rounded-xl flex items-center justify-center font-bold text-xl"
            style={{ backgroundColor: color }}
          >
            {workspace.name[0].toUpperCase()}
          </div>
        )}
      </div>
      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
        {workspace.name}
      </h3>
      <p className="text-sm text-gray-500 mt-1">Manage chat and settings</p>
    </div>
  );
}
