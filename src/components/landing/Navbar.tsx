"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { HelpDeckLogo } from "@/components/common/HelpDeckLogo";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-xl transition-all supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <HelpDeckLogo className="w-10 h-10" textClassName="text-2xl" />
        </Link>
        <div className="hidden md:flex items-center gap-10 font-medium text-sm text-gray-500">
          <Link href="#features" className="hover:text-black transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-black transition-colors">Pricing</Link>
          <Link href="#docs" className="hover:text-black transition-colors">Docs</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin">
            {/* <Button variant="ghost" className="text-gray-600 hover:text-black font-medium">Sign In</Button> */}
          </Link>
          <Link href="/admin">
            <Button className="h-10 px-6 rounded-full bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/20 hover:shadow-black/10 transition-all font-medium">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
