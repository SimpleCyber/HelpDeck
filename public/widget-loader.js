(function () {
  const websiteId = window.CRISP_WEBSITE_ID;
  const ownerId = window.CRISP_OWNER_ID;
  const userData = window.HELPDECK_USER || null;

  if (!websiteId) {
    console.error("HelpDeck: Missing window.CRISP_WEBSITE_ID");
    return;
  }

  const scriptTag = document.currentScript;
  const baseUrl = scriptTag
    ? new URL(scriptTag.src).origin
    : window.location.origin;

  let queryParams = `v=1`;
  if (ownerId) {
    queryParams += `&owner=${encodeURIComponent(ownerId)}`;
  }

  if (userData) {
    try {
      queryParams += `&user=${encodeURIComponent(JSON.stringify(userData))}`;
    } catch (e) {
      console.error("HelpDeck: Invalid HELPDECK_USER data", e);
    }
  }

  const iframe = document.createElement("iframe");
  iframe.id = "helpdeck-widget-iframe";
  iframe.src = `${baseUrl}/widget/${websiteId}?${queryParams}`;

  /* -------------------------------------------------- */
  /* Base iframe styles (shared)                         */
  /* -------------------------------------------------- */
  Object.assign(iframe.style, {
    position: "fixed",
    bottom: "8px",
    right: "8px",
    background: "transparent",
    border: "none",
    zIndex: "2147483647",
    transition:
      "width 0.3s cubic-bezier(0.4,0,0.2,1), height 0.3s cubic-bezier(0.4,0,0.2,1), border-radius 0.3s ease",
  });

  iframe.setAttribute("allowtransparency", "true");

  /* -------------------------------------------------- */
  /* State handlers                                     */
  /* -------------------------------------------------- */
  const applyBubble = () => {
    iframe.dataset.state = "bubble";
    iframe.style.width = "60px";
    iframe.style.height = "60px";
    iframe.style.borderRadius = "9999px";

    // 🔴 THIS IS THE KEY LINE
    iframe.style.overflow = "hidden";
    iframe.style.pointerEvents = "auto";
  };

  const updatePanelStyle = () => {
    if (iframe.dataset.state === "panel") {
      if (window.innerWidth < 640) {
        iframe.style.width = "100vw";
        iframe.style.height = "100vh";
        iframe.style.bottom = "0px";
        iframe.style.right = "0px";
        iframe.style.borderRadius = "0px";
      } else {
        iframe.style.width = "380px";
        iframe.style.height = "640px";
        iframe.style.bottom = "8px";
        iframe.style.right = "8px";
        iframe.style.borderRadius = "16px";
      }
    }
  };

  const applyPanel = () => {
    iframe.dataset.state = "panel";
    updatePanelStyle();

    // Allow normal layout when expanded
    iframe.style.overflow = "visible";
  };

  window.addEventListener("resize", updatePanelStyle);

  // Initial state
  applyBubble();

  /* -------------------------------------------------- */
  /* Listen for widget messages                          */
  /* -------------------------------------------------- */
  window.addEventListener("message", (event) => {
    if (event.data === "expand") {
      applyPanel();
    } else if (event.data === "collapse") {
      applyBubble();
    }
  });

  /* -------------------------------------------------- */
  /* Analytics Tracking                                  */
  /* -------------------------------------------------- */
  const TRACKING_API = `${baseUrl}/api/analytics/track`;
  const SESSION_KEY = "helpdeck_session";
  const SESSION_EXPIRY = 30 * 60 * 1000; // 30 minutes

  // Helper to send data
  const sendEvent = (type, payload = {}) => {
    if (!websiteId) return;

    const data = {
      type,
      websiteId,
      ownerId,
      payload: {
        ...payload,
        url: window.location.href,
        referrer: document.referrer,
        timestamp: Date.now(),
      },
    };

    // Use sendBeacon for reliability during unload, fallback to fetch
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], {
        type: "application/json",
      });
      navigator.sendBeacon(TRACKING_API, blob);
    } else {
      fetch(TRACKING_API, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    }
  };

  // 1. Track Page View
  sendEvent("pageview");

  // 2. Track Session Duration
  let sessionStart = Date.now();
  let lastActivity = Date.now();

  const updateActivity = () => {
    lastActivity = Date.now();
  };

  ["click", "scroll", "keypress"].forEach((evt) =>
    window.addEventListener(evt, updateActivity, { passive: true }),
  );

  // Send session end on unload
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      const duration = Date.now() - sessionStart;
      sendEvent("session_end", { duration });
    } else {
      // Reset if coming back? Maybe new session logic needed but simple for now
      sessionStart = Date.now();
    }
  });

  // 3. Performance Metrics (Core Web Vitals approximation)
  // Simple LCP and FCP using PerformanceObserver
  if ("PerformanceObserver" in window) {
    try {
      // FCP
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntriesByName(
          "first-contentful-paint",
        )) {
          sendEvent("vitals", {
            metric: "FCP",
            value: entry.startTime,
            rating: entry.startTime < 1800 ? "good" : "poor",
          });
        }
      }).observe({ type: "paint", buffered: true });

      // LCP
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          sendEvent("vitals", {
            metric: "LCP",
            value: lastEntry.startTime,
            rating: lastEntry.startTime < 2500 ? "good" : "poor",
          });
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch (e) {
      // Ignore if not supported
    }
  }

  document.body.appendChild(iframe);
})();
