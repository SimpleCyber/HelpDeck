"use client";

import { MessageSquare } from "lucide-react";

export function WidgetHeader({ name, logo, color, onCollapse }: { name: string, logo: string, color: string, onCollapse: () => void }) {
  return (
    <div className="relative pt-12 pb-5 px-6 bg-[#171717] overflow-hidden shrink-0">
      {/* Subtle Noise Pattern Overlay */}
      <div className="absolute inset-0 noise-pattern pointer-events-none" />
      
      {/* Top Badge with Tooltip */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 group/chat z-20">

        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black text-white text-[10px] rounded-lg opacity-0 group-hover/chat:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/10">
          Help Desk
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        {/* Workspace Icon with Tooltip */}
        <div className="relative group/logo">
          <div className="w-12 h-12 rounded-full border-2 border-[#171717] bg-white overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.3)] transition-transform hover:scale-105">
            {logo ? (
              <img src={logo} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-black text-xl" style={{ backgroundColor: color }}>
                {name[0]}
              </div>
            )}
          </div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black text-white text-[10px] rounded-lg opacity-0 group-hover/logo:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-white/10">
            {name}
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-white font-bold text-sm tracking-tight leading-none pt-2">Questions? Chat with us!</h2>
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full" />
            <span className="text-[11px] text-[#a3a3a3] font-medium">Typically replies under an hour</span>
          </div>
        </div>
      </div>
    </div>
  );
}
