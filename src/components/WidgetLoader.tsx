"use client";

import { useEffect } from "react";

export default function WidgetLoader() {
  useEffect(() => {
    const websiteId = (window as any).CRISP_WEBSITE_ID;
    if (!websiteId) return;

    const iframe = document.createElement("iframe");
    iframe.src = `${window.location.origin}/widget/${websiteId}`;
    iframe.style.position = "fixed";
    iframe.style.bottom = "20px";
    iframe.style.right = "20px";
    iframe.style.width = "400px";
    iframe.style.height = "600px";
    iframe.style.border = "none";
    iframe.style.zIndex = "999999";
    iframe.style.transition = "all 0.3s ease";
    iframe.id = "crisp-widget-iframe";

    // Initial state: just the bubble
    iframe.style.width = "80px";
    iframe.style.height = "80px";

    const updateWidgetStyle = (isExpanded: boolean) => {
      if (isExpanded) {
        if (window.innerWidth < 640) {
          iframe.style.width = "100vw";
          iframe.style.height = "100vh";
          iframe.style.bottom = "0px";
          iframe.style.right = "0px";
          iframe.style.borderRadius = "0px";
        } else {
          iframe.style.width = "400px";
          iframe.style.height = "610px";
          iframe.style.bottom = "20px";
          iframe.style.right = "20px";
          iframe.style.borderRadius = "16px";
        }
      } else {
        iframe.style.width = "80px";
        iframe.style.height = "80px";
        iframe.style.bottom = "20px";
        iframe.style.right = "20px";
        iframe.style.borderRadius = "9999px"; // Ensure round for bubble
      }
    };

    let isExpanded = false;

    window.addEventListener("message", (event) => {
      if (event.data === "expand") {
        isExpanded = true;
        updateWidgetStyle(true);
      } else if (event.data === "collapse") {
        isExpanded = false;
        updateWidgetStyle(false);
      }
    });

    window.addEventListener("resize", () => updateWidgetStyle(isExpanded));

    document.body.appendChild(iframe);
  }, []);

  return null;
}
