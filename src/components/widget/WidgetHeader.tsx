"use client";

import { Minus } from "lucide-react";

export function WidgetHeader({ name, logo, color, onCollapse }: { name: string, logo: string, color: string, onCollapse: () => void }) {
  return (
    <div className="p-4 flex items-center justify-between text-white shrink-0" style={{ backgroundColor: color }}>
      <div className="flex items-center gap-3">
        {logo ? (
          <img src={logo} alt={name} className="w-10 h-10 bg-white rounded-full object-contain" />
        ) : (
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">{name[0]?.toUpperCase()}</div>
        )}
        <div>
          <div className="font-bold text-sm leading-tight">{name}</div>
          <div className="text-[10px] opacity-90 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Online
          </div>
        </div>
      </div>
      <button onClick={onCollapse} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Minus size={18} /></button>
    </div>
  );
}
