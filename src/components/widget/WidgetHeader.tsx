"use client";

import { MessageSquare, Minus } from "lucide-react";

export function WidgetHeader({ name, logo, color, onCollapse }: { name: string, logo: string, color: string, onCollapse: () => void }) {
  return (
    <div className="relative pt-8 pb-5 px-6 bg-[#171717] overflow-hidden shrink-0">
      {/* Subtle Noise Pattern Overlay */}
      <div className="absolute inset-0 noise-pattern pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        {/* Avatar Cluster */}
        <div className="flex items-center -space-x-2">
          <div className="w-10 h-10 rounded-full border-2 border-[#171717] bg-[#bef264] flex items-center justify-center font-bold text-xs">C</div>
          <div className="w-10 h-10 rounded-full border-2 border-[#171717] bg-gray-600 overflow-hidden">
            <img src="https://ui-avatars.com/api/?name=Support&background=333&color=fff" alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-[#171717] bg-blue-500 flex items-center justify-center text-white">
            <MessageSquare size={16} className="fill-current" />
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

      {/* Collapse button actually hidden in the reference, but let's keep it minimal if needed or remove it for exact match */}
      {/* <button onClick={onCollapse} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white"><Minus size={18} /></button> */}
    </div>
  );
}
