"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { MessageBubble } from "@/components/common/MessageBubble";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function WidgetChat({ messages, onSend, color }: { messages: any[], onSend: (text: string) => void, color: string }) {
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) { onSend(text); setText(""); }
  };

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map(m => <MessageBubble key={m.id} message={m} color={color} />)}
      </div>
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t flex gap-2">
        <Input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." className="bg-gray-100 border-none" />
        <Button type="submit" icon={Send} disabled={!text.trim()} style={{ backgroundColor: color }} className="px-3" />
      </form>
    </>
  );
}
