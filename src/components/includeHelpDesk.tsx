"use client";
import { useEffect } from 'react';

export default function HelpDeckWidget({ user }: { user: any }) {
  useEffect(() => {
    if (!user) return;

    (window as any).CRISP_WEBSITE_ID = "ws_1769008955071_a4oc3dqee";
    (window as any).CRISP_OWNER_ID = "7rXNAqOZC6e9lfdfNdh2VJoTtT63";
    (window as any).HELPDECK_USER = {
      name: user.displayName || user.email?.split('@')[0] || "User",
      email: user.email,
      userId: user.uid
    };
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || '';
    const s = document.createElement("script");
    s.src = `${baseUrl}/widget-loader.js`;
    s.async = true;
    document.head.appendChild(s);
  }, [user]);

  return null;
}