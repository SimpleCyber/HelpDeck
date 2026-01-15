"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="text-2xl font-black text-gray-900 tracking-tight">HelpDeck</Link>
        <div className="hidden md:flex items-center gap-8 font-medium text-gray-600 mr-8">
          <Link href="#features" className="hover:text-blue-600 transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
          <Link href="#docs" className="hover:text-blue-600 transition-colors">Docs</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" className="text-gray-600">Sign In</Button>
          </Link>
          <Link href="/admin">
            <Button className="h-11 px-6">Get Started</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
