import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'admin';
  createdAt?: any;
}

export function MessageBubble({ message, color }: { message: Message, color: string }) {
  const isAdmin = message.sender === 'admin';
  const time = message.createdAt?.toDate ? new Date(message.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className={cn("flex flex-col max-w-[85%] sm:max-w-[70%]", isAdmin ? "ml-auto items-end" : "mr-auto items-start")}>
      <div 
        className={cn("p-3 rounded-2xl text-sm shadow-sm", isAdmin ? "text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none")}
        style={isAdmin ? { backgroundColor: color } : {}}
      >
        {message.text}
      </div>
      {time && <span className="text-[10px] text-gray-400 mt-1 px-1">{time}</span>}
    </div>
  );
}
