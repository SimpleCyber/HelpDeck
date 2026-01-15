import { User } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConversationItem({ conv, active, onClick }: { conv: any, active: boolean, onClick: () => void }) {
  const time = conv.createdAt?.toDate ? new Date(conv.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50 flex gap-3",
        active && "bg-blue-50 border-l-4 border-l-blue-500"
      )}
    >
      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
        <User size={20} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-sm truncate">{conv.userName}</h3>
          <span className="text-[10px] text-gray-400">{time}</span>
        </div>
        <p className="text-xs text-gray-500 truncate mt-1">
          {conv.lastMessage || "Started a conversation"}
        </p>
      </div>
    </div>
  );
}
