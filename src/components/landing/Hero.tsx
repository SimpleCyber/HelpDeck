"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { MessageSquare, ArrowRight, Shield, Zap } from "lucide-react";

export function Hero() {
  return (
    <section className="pt-40 pb-20 px-6">
      <div className="max-w-7xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold mb-4">
          <Zap size={14} className="fill-current" />
          The fastest way to support your customers
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter leading-[0.9]">
          Connect with <br /> <span className="text-blue-600">Customers</span> instantly.
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-gray-500 font-medium">
          The simple, clean, and powerful chatbot for your business. HelpDeck gives you all the tools to talk to your customers in real-time.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/admin">
            <Button className="h-16 px-10 text-lg rounded-2xl shadow-xl shadow-blue-500/20" icon={ArrowRight}>
              Get Started for Free
            </Button>
          </Link>
          <Button variant="secondary" className="h-16 px-10 text-lg rounded-2xl" icon={MessageSquare}>
            View Demo
          </Button>
        </div>
      </div>
    </section>
  );
}
