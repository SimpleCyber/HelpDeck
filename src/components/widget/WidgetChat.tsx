"use client";

import { useEffect, useRef, useState } from "react";
import { Smile, Paperclip, Mic, Send } from "lucide-react";
import { MessageBubble } from "@/components/common/MessageBubble";

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
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-1.5 scroll-smooth">
        {/* Date Separator Example */}
        <div className="flex items-center justify-center gap-4 py-2">
          <div className="h-[1px] flex-1 bg-slate-50" />
          <span className="text-[10px] font-black text-[#1e293b] uppercase tracking-widest whitespace-nowrap">Thursday, 15 January</span>
          <div className="h-[1px] flex-1 bg-slate-50" />
        </div>

        {messages.map(m => <MessageBubble key={m.id} message={m} color={color} />)}
      </div>

      <div className="px-6 py-4 pb-8 bg-white flex flex-col gap-4">
        {/* System Notification - Matching Reference */}
        <div className="bg-[#e4f1ff] px-6 py-3 rounded-2xl text-center">
          <span className="text-[12px] font-bold text-[#35455c]">Thanks! We should reply in a few moments.</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
            placeholder="Compose your message..."
            className="w-full bg-transparent border-none focus:ring-0 text-[15px] text-[#2c3e50] placeholder-[#bdc3c7] p-0 min-h-[44px] resize-none leading-relaxed"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5 text-[#bdc3c7]">
              <button type="button" className="hover:text-[#34495e] transition-colors"><Smile size={20} /></button>
              <button type="button" className="hover:text-[#34495e] transition-colors"><Paperclip size={20} /></button>
              <button type="button" className="hover:text-[#34495e] transition-colors"><Mic size={20} /></button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#bdc3c7] font-bold uppercase tracking-wider">We run on</span>
              <div className="flex items-center gap-1.5 text-[11px] font-black text-[#5b6a7c]">
                <div className="w-3.5 h-3.5 bg-[#93a1b0] rounded-[3px] flex items-center justify-center">
                   <div className="w-1.5 h-1.5 bg-white rounded-full opacity-20" />
                </div>
                helpdeck
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
