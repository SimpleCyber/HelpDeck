"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-gray-100 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center md:items-start gap-2">
          <Link href="/" className="text-xl font-black text-gray-900 tracking-tight">HelpDeck</Link>
          <p className="text-gray-400 text-sm font-medium">© 2026 HelpDeck Inc. All rights reserved.</p>
        </div>
        <div className="flex gap-8 text-sm font-bold text-gray-500">
          <Link href="#" className="hover:text-blue-600 transition-colors">Twitter</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">GitHub</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">Discord</Link>
        </div>
        <div className="flex gap-8 text-sm font-bold text-gray-500">
          <Link href="#" className="hover:text-blue-600 transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-blue-600 transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
