import { User, Check, X, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConversationItem({ conv, active, onClick, locked }: { conv: any, active: boolean, onClick: () => void, locked?: boolean }) {
  const time = conv.lastUpdatedAt?.toDate 
    ? new Date(conv.lastUpdatedAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : '';

  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-5 cursor-pointer transition-all border-b border-[var(--border-color)] flex gap-4 relative overflow-hidden group",
        active ? "bg-blue-50/50 dark:bg-blue-900/10" : "hover:bg-gray-50 dark:hover:bg-white/5",
        locked && "opacity-60 grayscale bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed"
      )}
    >
      {active && !locked && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]" />}
      
      <div 
        className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm shrink-0 transition-transform group-hover:scale-105 relative"
        style={{ 
          backgroundColor: active && !locked ? '#3b82f6' : 'var(--bg-main)',
          color: active && !locked ? 'white' : 'var(--text-muted)',
          border: active && !locked ? 'none' : '1px solid var(--border-color)'
        }}
      >
        {locked ? <Lock size={20} className="text-slate-400" /> : conv.userName[0]?.toUpperCase()}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h3 className={cn("font-black text-sm truncate tracking-tight flex-1", active && !locked ? "text-blue-600" : "text-[var(--text-main)]")}>
            {conv.userName}
          </h3>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] font-bold text-[var(--text-muted)] opacity-60 uppercase shrink-0">{time}</span>
            <div className="flex items-center gap-1 mt-0.5">
              {locked ? (
                 <Lock size={12} className="text-slate-400" />
              ) : (
                <>
                  {conv.status === "resolved" ? (
                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center shadow-sm shrink-0">
                      <Check size={9} strokeWidth={5} className="text-white" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shadow-sm shrink-0">
                      <X size={9} strokeWidth={5} className="text-white" />
                    </div>
                  )}
                  {conv.unreadCountAdmin > 0 && (
                    <div className="min-w-[15px] h-[15px] bg-blue-600 rounded-md shadow-lg shadow-blue-500/20 shrink-0 flex items-center justify-center px-1">
                      <span className="text-[8px] font-black text-white leading-none">{Math.max(0, conv.unreadCountAdmin)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <p className={cn("text-xs truncate font-medium -mt-4", active && !locked ? "text-[var(--text-main)]" : "text-[var(--text-muted)]")}>
          {locked ? "Upgrade to view" : (conv.lastMessage || "Started a conversation")}
        </p>
      </div>
    </div>
  );
}
