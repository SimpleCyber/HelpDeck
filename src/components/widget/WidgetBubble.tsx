"use client";

import { X, MessageCircle } from "lucide-react";

export function WidgetBubble({ isOpen, onClick, color }: { isOpen: boolean, onClick: () => void, color: string }) {
  return (
    <button 
      onClick={onClick}
      className="w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white pointer-events-auto transition-all transform hover:scale-110 active:scale-95 z-[99999] group overflow-hidden helpdeck-widget"
      style={{ backgroundColor: isOpen ? '#262626' : color }}
    >
      <div className="absolute inset-0 noise-pattern opacity-10 group-hover:opacity-20 transition-opacity" />
      <div className="relative z-10 transition-transform duration-300 transform" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0)' }}>
        {isOpen ? <X size={32} strokeWidth={2.5} /> : <MessageCircle size={32} className="fill-current" />}
      </div>
    </button>
  );
}
