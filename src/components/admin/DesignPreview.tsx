"use client";

import { MessageSquare } from "lucide-react";

export function DesignPreview({ color, name, logo }: { color: string, name: string, logo?: string }) {
  return (
    <div className="bg-[var(--bg-main)] p-8 rounded-3xl border border-[var(--border-color)] flex items-center justify-center relative min-h-[400px] overflow-hidden">
      <div className="absolute top-0 left-0 p-6 text-[10px] text-[var(--text-muted)] font-black tracking-widest uppercase opacity-50">Live Preview</div>
      
      {/* Bubble Preview */}
      <div className="absolute bottom-8 right-8 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white transition-transform hover:scale-110 cursor-pointer" style={{ backgroundColor: color }}>
        <MessageSquare size={28} />
      </div>

      {/* Window Preview */}
      <div className="bg-white dark:bg-[#1e293b] w-80 rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="p-6 flex items-center gap-4 text-white" style={{ backgroundColor: color }}>
          {logo ? (
            <img src={logo} alt="Logo" className="w-10 h-10 rounded-full bg-white object-contain p-1" />
          ) : (
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-black text-lg">{name[0]?.toUpperCase()}</div>
          )}
          <div>
            <div className="text-base font-black leading-tight">{name}</div>
            <div className="text-xs opacity-80 font-bold">Online</div>
          </div>
        </div>
        <div className="p-6 bg-gray-50 dark:bg-slate-900/50 h-40 flex items-end">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl rounded-bl-none text-sm text-[var(--text-main)] max-w-[85%] shadow-sm font-medium">
            Hi! How can we help you today? 👋
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex gap-3 bg-white dark:bg-slate-800">
          <div className="flex-1 bg-gray-100 dark:bg-slate-900 px-4 py-2.5 rounded-xl text-xs text-[var(--text-muted)] font-medium">Type a message...</div>
          <div className="w-10 h-10 rounded-xl opacity-20" style={{ backgroundColor: color }}></div>
        </div>
      </div>
    </div>
  );
}
