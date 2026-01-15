"use client";

import { cn } from "@/lib/utils";

export function MessageBubble({ message, color }: { message: any, color: string }) {
  const isAdmin = message.sender === "admin" || message.sender === "support";

  return (
    <div className={cn("flex flex-col group animate-in fade-in slide-in-from-bottom-2 duration-500", isAdmin ? "items-start" : "items-end")}>
      {isAdmin && (
        <div className="flex items-center gap-2 mb-1.5 pl-1 opacity-60">
           <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
           <span className="text-[10px] font-black text-[var(--text-muted)] tracking-widest uppercase">Support</span>
        </div>
      )}
      
      <div 
        className={cn(
          "max-w-[80%] transition-all shadow-sm overflow-hidden border",
          isAdmin 
            ? "text-white rounded-[24px] rounded-tl-none border-transparent shadow-md"
            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-[24px] rounded-tr-none border-gray-100 dark:border-slate-700/50" 
        )}
        style={{ 
          backgroundColor: isAdmin ? color : undefined,
          boxShadow: isAdmin ? `0 8px 24px -8px ${color}66` : undefined
        }}
      >
        {message.text.startsWith("data:image") ? (
          <img src={message.text} alt="Attached image" className="rounded-xl w-full h-auto block" />
        ) : (
          <div className="px-5 py-3.5 text-sm font-medium leading-relaxed tracking-tight">{message.text}</div>
        )}
      </div>
      
      {/* Time could be added here in the future */}
    </div>
  );
}
