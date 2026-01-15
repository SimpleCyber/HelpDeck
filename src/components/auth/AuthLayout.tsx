"use client";

import React from 'react';
import Link from 'next/link';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side: Infographic/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 p-12 flex-col justify-between text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-700 rounded-full blur-3xl opacity-50"></div>
        
        <div className="relative z-10">
          <Link href="/" className="text-3xl font-black tracking-tight">HelpDeck</Link>
          <div className="mt-20">
            <h1 className="text-5xl font-bold leading-tight mb-6">
              Empower your <br />
              Customer Support <br />
              with AI.
            </h1>
            <p className="text-xl text-blue-100 max-w-md">
              The all-in-one platform to manage customer conversations, 
              automate responses, and grow your business faster.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-3xl font-bold mb-1">10k+</div>
              <div className="text-blue-100">Active users</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">99.9%</div>
              <div className="text-blue-100">Uptime guaranteed</div>
            </div>
          </div>
          <div className="mt-12 text-blue-200 text-sm">
            © 2026 HelpDeck Inc. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[var(--bg-card)] relative overflow-hidden">
        {/* Decorative background for dark mode */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -z-10" />
        
        <div className="w-full max-w-md space-y-8 animate-in slide-in-from-right-8 duration-500">
          <div className="space-y-3">
            <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tight">
              {title}
            </h1>
            <p className="text-[var(--text-muted)] font-medium text-lg">
              {subtitle}
            </p>
          </div>
          
          <div className="space-y-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
