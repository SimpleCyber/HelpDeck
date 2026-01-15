"use client";

import { MessageCircle } from "lucide-react";

export function WidgetBubble({ isOpen, onClick, color }: { isOpen: boolean, onClick: () => void, color: string }) {
  // When open, bubble is hidden
  if (isOpen) return null;
  
  return (
    <button 
      onClick={onClick}
      className="fixed bottom-2 right-2 w-[60px] h-[60px] rounded-full shadow-2xl flex items-center justify-center text-white pointer-events-auto transition-all transform hover:scale-110 active:scale-95 z-[99999] group"
      style={{ backgroundColor: color }}
    >
      <div className="absolute inset-0 noise-pattern opacity-10 group-hover:opacity-20 transition-opacity" />
      <div className="relative z-10">
        <MessageCircle size={28} className="fill-current" />
      </div>
    </button>
  );
}
