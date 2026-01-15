"use client";
import { useEffect } from 'react';

export default function HelpDeckWidget({ user }: { user: any }) {
  useEffect(() => {
    if (!user) return;
    
    (window as any).CRISP_WEBSITE_ID = "jQQn1g4Xt6UMEfBYwoxR";
    (window as any).HELPDECK_USER = {
      name: user.displayName || user.email?.split('@')[0] || "User",
      email: user.email,
      userId: user.uid
    };
    
    const s = document.createElement("script");
    s.src = `${window.location.origin}/widget-loader.js`;
    s.async = true;
    document.head.appendChild(s);
  }, [user]);

  return null;
}