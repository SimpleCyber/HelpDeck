"use client";

import { MessageSquare } from "lucide-react";

export function DesignPreview({ color, name, logo }: { color: string, name: string, logo?: string }) {
  return (
    <div className="bg-gray-100 p-8 rounded-2xl border border-gray-200 flex items-center justify-center relative min-h-[300px] overflow-hidden">
      <div className="absolute top-0 left-0 p-4 text-[10px] text-gray-400 font-mono tracking-widest">LIVE PREVIEW</div>
      
      {/* Bubble Preview */}
      <div className="absolute bottom-8 right-8 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white" style={{ backgroundColor: color }}>
        <MessageSquare size={24} />
      </div>

      {/* Window Preview */}
      <div className="bg-white w-72 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-2">
        <div className="p-4 flex items-center gap-3 text-white" style={{ backgroundColor: color }}>
          {logo ? (
            <img src={logo} alt="Logo" className="w-8 h-8 rounded-full bg-white object-contain" />
          ) : (
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold">{name[0]?.toUpperCase()}</div>
          )}
          <div>
            <div className="text-sm font-bold leading-tight">{name}</div>
            <div className="text-[10px] opacity-80">Online</div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 h-32 flex items-end">
          <div className="bg-white p-3 rounded-2xl rounded-bl-none text-[11px] text-gray-600 max-w-[80%] shadow-sm">
            Hi! How can we help?
          </div>
        </div>
        <div className="p-3 border-t border-gray-100 flex gap-2">
          <div className="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-[10px] text-gray-400">Type a message...</div>
          <div className="w-8 h-8 rounded-lg opacity-20" style={{ backgroundColor: color }}></div>
        </div>
      </div>
    </div>
  );
}
