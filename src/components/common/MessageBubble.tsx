"use client";

import { cn } from "@/lib/utils";

export function MessageBubble({ message, color }: { message: any, color: string }) {
  const isAdmin = message.sender === "admin" || message.sender === "support";

  return (
    <div className={cn("flex flex-col group animate-in fade-in slide-in-from-bottom-2 duration-300", isAdmin ? "items-start" : "items-end")}>
      {isAdmin && (
        <div className="flex items-center gap-2 mb-1 pl-1">
           <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white scale-75 origin-left">
             <div className="bg-white/20 w-full h-full rounded-full" />
           </div>
           <span className="text-[10px] font-bold text-slate-400 tracking-tight">Support</span>
        </div>
      )}
      
      <div 
        className={cn(
          "max-w-[85%] px-1 py-1 text-[13px] leading-relaxed font-medium transition-all shadow-sm overflow-hidden",
          isAdmin 
            ? "bg-[#262626] text-white rounded-[1.25rem] rounded-tl-none" 
            : "bg-[#f1f1f1] text-[#262626] rounded-[1.25rem] rounded-tr-none"
        )}
      >
        {message.text.startsWith("data:image") ? (
          <img src={message.text} alt="Attached image" className="rounded-xl w-full h-auto block" />
        ) : (
          <div className="px-4 py-2">{message.text}</div>
        )}
      </div>
      
      {/* Optional: Status indicators like seen or time can go here */}
    </div>
  );
}
