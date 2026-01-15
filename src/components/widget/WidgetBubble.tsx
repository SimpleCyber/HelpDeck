"use client";

import { MessageSquareQuote } from "lucide-react";

export function WidgetBubble({ isOpen, onClick, color, unreadCount = 0 }: { isOpen: boolean, onClick: () => void, color: string, unreadCount?: number }) {
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
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-[var(--bg-card)] shadow-sm animate-in zoom-in duration-300">
             <span className="text-[10px] font-bold text-white px-1 leading-none">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </div>
        )}
      </div>
    </button>
  );
}
