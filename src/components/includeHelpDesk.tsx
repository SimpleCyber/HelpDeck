"use client";
import { useEffect } from 'react';

export default function HelpDeckWidget({ user }: { user: any }) {
  useEffect(() => {
    if (!user) return;
    
    (window as any).CRISP_WEBSITE_ID = "gdqL1xH0Q4Jn5L3YWzrC";
    (window as any).HELPDECK_USER = {
      name: user.displayName || user.email?.split('@')[0] || "User",
      email: user.email,
      userId: user.uid
    };
    
    const s = document.createElement("script");
    s.src = `${process.env.NEXT_PUBLIC_APP_URL}/widget-loader.js`;
    s.async = true;
    document.head.appendChild(s);
  }, [user]);

  return null;
}