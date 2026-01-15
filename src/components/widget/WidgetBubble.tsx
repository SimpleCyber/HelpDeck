"use client";

import { X, MessageSquare } from "lucide-react";

export function WidgetBubble({ isOpen, onClick, color }: { isOpen: boolean, onClick: () => void, color: string }) {
  return (
    <button 
      onClick={onClick}
      className="w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white pointer-events-auto transition-all transform hover:scale-110 active:scale-95 z-[99999]"
      style={{ backgroundColor: color }}
    >
      {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
    </button>
  );
}
