"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function WidgetIdentify({ onStart, color }: { onStart: (name: string, email: string) => void, color: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email) onStart(name, email);
  };

  return (
    <div className="flex-1 p-8 flex flex-col justify-center animate-in fade-in duration-500">
      <h3 className="text-xl font-bold mb-1">Hi there!</h3>
      <p className="text-gray-500 text-sm mb-6 font-medium">Please let us know how to contact you.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Your Name" required value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
        <Input label="Email Address" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" />
        <Button type="submit" className="w-full h-12" style={{ backgroundColor: color }}>Start Chatting</Button>
      </form>
    </div>
  );
}
