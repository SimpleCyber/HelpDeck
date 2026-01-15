"use client";

import { useEffect } from 'react';

export default function WidgetLoader() {
  useEffect(() => {
    const websiteId = (window as any).CRISP_WEBSITE_ID;
    if (!websiteId) return;

    const iframe = document.createElement('iframe');
    iframe.src = `${window.location.origin}/widget/${websiteId}`;
    iframe.style.position = 'fixed';
    iframe.style.bottom = '20px';
    iframe.style.right = '20px';
    iframe.style.width = '400px';
    iframe.style.height = '600px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '999999';
    iframe.style.transition = 'all 0.3s ease';
    iframe.id = 'crisp-widget-iframe';
    
    // Initial state: just the bubble
    iframe.style.width = '80px';
    iframe.style.height = '80px';

    window.addEventListener('message', (event) => {
      if (event.data === 'expand') {
        iframe.style.width = '400px';
        iframe.style.height = '610px';
      } else if (event.data === 'collapse') {
        iframe.style.width = '80px';
        iframe.style.height = '80px';
      }
    });

    document.body.appendChild(iframe);
  }, []);

  return null;
}
