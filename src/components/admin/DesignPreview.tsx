"use client";

import { MessageSquare, Smile, Paperclip, Mic } from "lucide-react";

export function DesignPreview({
  color,
  name,
  logo,
  headerColor,
}: {
  color: string;
  name: string;
  logo?: string;
  headerColor?: string;
}) {
  return (
    <div className="bg-[var(--bg-main)] p-8 rounded-[40px] border border-[var(--border-color)] flex items-center justify-center relative min-h-[450px] overflow-hidden group shadow-inner">
      {/* Background decoration for contrast */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      ></div>

      <div className="absolute top-0 left-0 p-8 text-[10px] text-[var(--text-muted)] font-black tracking-widest uppercase opacity-40">
        Live Preview
      </div>

      {/* Bubble Preview */}
      <div
        className="absolute bottom-10 right-10 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 cursor-pointer z-10 hover:rotate-3 shadow-blue-500/20"
        style={{ backgroundColor: color }}
      >
        <MessageSquare size={28} />
      </div>

      {/* Window Preview */}
      <div className="bg-white w-[340px] rounded-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        {/* Header */}
        <div
          className="p-7 flex items-center gap-4 text-white relative overflow-hidden"
          style={{ backgroundColor: headerColor || color }}
        >
          <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
          {logo ? (
            <div className="relative">
              <img
                src={logo}
                alt="Logo"
                className="w-11 h-11 rounded-2xl bg-white object-contain p-1.5 shadow-sm"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
          ) : (
            <div className="relative">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center font-black text-xl shadow-inner">
                {name[0]?.toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
          )}
          <div className="relative">
            <div className="text-base font-black leading-tight tracking-tight">
              {name}
            </div>
            <div className="text-[10px] opacity-90 font-bold uppercase tracking-widest mt-0.5">
              Online
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div
          className="p-8 h-48 flex items-end"
          style={{ backgroundColor: "#f3f4f6" }}
        >
          <div className="bg-white p-5 rounded-[24px] rounded-bl-none text-sm text-slate-800 max-w-[90%] shadow-md font-medium border border-gray-200 leading-relaxed animate-in fade-in dash-in duration-700 delay-300">
            Hi! How can we help you today? 👋
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 pb-2" style={{ backgroundColor: "#f3f4f6" }}>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 bg-white px-5 py-3 rounded-2xl text-[11px] text-slate-400 font-bold tracking-tight shadow-sm border border-gray-100 flex items-center justify-between">
              <span>Type a message...</span>
            </div>
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white/90 shadow-sm transition-transform hover:scale-105"
              style={{ backgroundColor: color }}
            >
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full opacity-50 bg-white rotate-45 transform origin-center"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
