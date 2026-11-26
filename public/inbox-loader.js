(function () {
  const websiteId = window.CRISP_WEBSITE_ID;
  const ownerId = window.CRISP_OWNER_ID;
  const settings = window.HELPDECK_INBOX_SETTINGS || {};

  if (!websiteId) {
    console.error("HelpDeck Live Inbox: Missing window.CRISP_WEBSITE_ID");
    return;
  }

  const getBaseUrl = () => {
    if (document.currentScript && document.currentScript.src) {
      return new URL(document.currentScript.src).origin;
    }
    const scripts = document.getElementsByTagName("script");
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src;
      if (src && src.includes("inbox-loader.js")) {
        return new URL(src).origin;
      }
    }
    return window.location.origin;
  };

  const baseUrl = getBaseUrl();
  const params = new URLSearchParams();
  if (ownerId) params.set("owner", ownerId);
  if (settings.fontFamily) params.set("font", settings.fontFamily);
  if (settings.fontSize) params.set("fontSize", settings.fontSize);
  if (settings.theme) params.set("theme", settings.theme);
  if (settings.accentColor) params.set("accent", settings.accentColor);
  if (settings.inboxTitle) params.set("title", settings.inboxTitle);
  if (settings.showSearch !== undefined) params.set("search", String(settings.showSearch));
  if (settings.showUserSidebar !== undefined) params.set("sidebar", String(settings.showUserSidebar));
  if (settings.showResolveButton !== undefined) params.set("resolve", String(settings.showResolveButton));
  if (settings.showImageUpload !== undefined) params.set("upload", String(settings.showImageUpload));
  if (settings.compact !== undefined) params.set("compact", String(settings.compact));
  if (settings.borderRadius) params.set("radius", settings.borderRadius);

  const mountInbox = () => {
    const selector = settings.containerSelector || "#helpdeck-live-inbox";
    let container = document.querySelector(selector);
    if (!container) {
      container = document.createElement("div");
      container.id = "helpdeck-live-inbox";
      document.body.appendChild(container);
    }

    // Avoid duplicate mounting
    const existing = container.querySelector("iframe[data-helpdeck-inbox]");
    if (existing) existing.remove();

    const iframe = document.createElement("iframe");
    iframe.setAttribute("data-helpdeck-inbox", "true");
    iframe.src = `${baseUrl}/inbox/${encodeURIComponent(websiteId)}?${params.toString()}`;
    iframe.style.width = settings.width || "100%";
    iframe.style.height = settings.height || "700px";
    iframe.style.border = settings.border || "1px solid rgba(148, 163, 184, 0.25)";
    iframe.style.borderRadius = settings.borderRadius || "16px";
    iframe.style.display = "block";
    iframe.style.overflow = "hidden";
    iframe.setAttribute("allow", "clipboard-write");

    container.appendChild(iframe);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountInbox);
  } else {
    mountInbox();
  }
})();
