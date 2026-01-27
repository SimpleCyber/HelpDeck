"use client";

import { MessageSquareQuote } from "lucide-react";

export function WidgetBubble({
  isOpen,
  onClick,
  color,
  unreadCount = 0,
}: {
  isOpen: boolean;
  onClick: () => void;
  color: string;
  unreadCount?: number;
}) {
  // When open, bubble is hidden (close button is in header)
  if (isOpen) return null;

  return (
    <div className="relative group overflow-hidden">
      {unreadCount > 0 && (
        <div className="absolute top-4 right-3 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center z-[100000] shadow-md animate-bounce">
          {unreadCount > 9 ? "9+" : unreadCount}
        </div>
      )}
      <button
        onClick={onClick}
        className="w-17 h-17 rounded-full shadow-2xl flex items-center justify-center text-white pointer-events-auto transition-all transform scale-110  hover:scale-100 active:scale-95 z-[99999] overflow-hidden"
        style={{ backgroundColor: color }}
      >
        <div className="absolute inset-0 noise-pattern opacity-10 group-hover:opacity-20 transition-opacity" />
        <div className="relative z-10">
          <MessageSquareQuote size={32} className="fill-current" />
        </div>
      </button>
    </div>
  );
}
