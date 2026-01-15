"use client";
import { useEffect } from 'react';

export default function HelpDeckWidget() {
  useEffect(() => {
    (window as any).CRISP_WEBSITE_ID = "jQQn1g4Xt6UMEfBYwoxR";
    (window as any).HELPDECK_USER = {
      name: "John Doe",
      email: "john@example.com",
      userId: "12345"
    };
    const s = document.createElement("script");
    s.src = "http://localhost:3000/widget-loader.js";
    s.async = true;
    document.head.appendChild(s);
  }, []);

  return null;
}