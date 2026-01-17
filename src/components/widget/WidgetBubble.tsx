"use client";

import { MessageSquareQuote } from "lucide-react";

export function WidgetBubble({ isOpen, onClick, color }: { isOpen: boolean, onClick: () => void, color: string }) {
  // When open, bubble is hidden (close button is in header)
  if (isOpen) return null;
  
  return (
    <button 
      onClick={onClick}
      className="w-18 h-18 shadow-2xl flex items-center justify-center text-white pointer-events-auto transition-all transform hover:scale-110 active:scale-95 z-[99999] group overflow-hidden"
      style={{ backgroundColor: color }}
    >
      <div className="absolute inset-0 noise-pattern opacity-10 group-hover:opacity-20 transition-opacity" />
      <div className="relative z-10">
        <MessageSquareQuote size={32} className="fill-current" />
      </div>
    </button>
  );
}
