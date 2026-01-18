"use client";

import { useEffect, useRef, useState } from "react";
import { Smile, Paperclip, Mic, Send } from "lucide-react";
import { MessageBubble } from "@/components/common/MessageBubble";
import { EmojiPicker } from "./EmojiPicker";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/image-utils";

export function WidgetChat({ messages, onSend, color }: { messages: any[], onSend: (text: string) => void, color: string }) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    };
    
    // Scroll after layout is painted
    requestAnimationFrame(() => {
      scrollToBottom();
      // Second pass for safety (handles images or slow renders)
      setTimeout(scrollToBottom, 100);
    });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) { onSend(text); setText(""); setShowEmoji(false); }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        if (ev.target?.result) {
          try {
            const compressed = await compressImage(ev.target.result as string);
            onSend(compressed);
          } catch (err) {
            console.error("Error compressing widget image:", err);
            onSend(ev.target.result as string);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-transparent">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-1.5 scroll-smooth">
        {/* Date Separator Example */}
        <div className="flex items-center justify-center gap-4 py-2">
          <div className="h-[1px] flex-1 bg-gray-100" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Thursday, 15 January</span>
          <div className="h-[1px] flex-1 bg-gray-100" />
        </div>

        {messages.map(m => <MessageBubble key={m.id} message={m} color={color} />)}
      </div>

      <div className="px-6 py-4 pb-8 bg-transparent flex flex-col gap-4">
   

        <form onSubmit={handleSubmit} className="space-y-4 relative">
          <input type="file" ref={fileRef} onChange={handleFile} accept="image/*" className="hidden" />
          {showEmoji && <EmojiPicker onSelect={(e) => setText(t => t + e)} onClose={() => setShowEmoji(false)} />}
          
          <div 
            className={cn(
              "rounded-2xl px-4 py-3 cursor-text border transition-all duration-200",
              text.length > 0 
                ? "bg-white border-gray-200 shadow-sm ring-1 ring-gray-100" 
                : "bg-white border-gray-100 focus-within:border-gray-200 "
            )}
            onClick={() => inputRef.current?.focus()}
          >
            <textarea
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
              placeholder="Compose your message..."
              className="w-full bg-transparent border-none focus:ring-0 text-[15px] text-slate-800 placeholder-slate-300 p-0 min-h-[44px] resize-none leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5 text-slate-300">
              <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="hover:text-slate-600 transition-colors"><Smile size={20} /></button>
              <button type="button" onClick={() => fileRef.current?.click()} className="hover:text-slate-600 transition-colors"><Paperclip size={20} /></button>
              <button type="button" className="hover:text-slate-600 transition-colors"><Mic size={20} /></button>
            </div>
            
            <div className="flex items-center gap-3">
              {text.trim().length > 0 && (
                <button 
                  type="submit" 
                  className="bg-[#262626] text-white p-2.5 rounded-xl hover:bg-black transition-all animate-in zoom-in-50 duration-200 shadow-lg"
                >
                  <Send size={16} className="fill-current" />
                </button>
              )}
              {!text.trim() && (
                <a 
                  href="https://help-deck-gamma.vercel.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:opacity-70 transition-opacity cursor-pointer"
                >
                  <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">We run on</span>
                  <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-400">
                    <div className="w-3.5 h-3.5 bg-slate-300 rounded-[3px] flex items-center justify-center">
                       <div className="w-1.5 h-1.5 bg-white rounded-full opacity-20" />
                    </div>
                    helpdeck
                  </div>
                </a>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
