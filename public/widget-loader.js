(function () {
  const websiteId = window.CRISP_WEBSITE_ID;
  const ownerId = window.CRISP_OWNER_ID;
  const userData = window.HELPDECK_USER || null;

  if (!websiteId) {
    console.error("HelpDeck: Missing window.CRISP_WEBSITE_ID");
    return;
  }

  const getBaseUrl = () => {
    // 1. Try currentScript (works for synchronous)
    if (document.currentScript && document.currentScript.src) {
      return new URL(document.currentScript.src).origin;
    }
    // 2. Search for the script tag (works for async/injected)
    const scripts = document.getElementsByTagName("script");
    for (let i = 0; i < scripts.length; i++) {
      const src = scripts[i].src;
      if (
        src &&
        (src.includes("/widget-loader.js") || src.includes("widget-loader.js"))
      ) {
        return new URL(src).origin;
      }
    }
    // 3. Fallback to production if somehow not found (or window origin for self-hosted?)
    // Better to use window.location.origin only if we are ON the app itself, but strictly we want the CDN url.
    // Let's default to the detected script origin or fallback to specific logic if needed.
    // For now, let's assume if we can't find it, we might be in trouble, but the loop above is robust.
    return window.location.origin;
  };

  const baseUrl = getBaseUrl();
  const settings = window.HELPDECK_SETTINGS || {};
  const isDraggable = settings.draggable !== false;
  const hideLauncher = settings.hideLauncher === true;

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
  /* Persistence & Position                              */
  /* -------------------------------------------------- */
  const POS_KEY = `helpdeck_pos_${websiteId}`;
  const getSavedPos = () => {
    try {
      const saved = localStorage.getItem(POS_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  };

  const savedPos = getSavedPos();
  const defaultPos = settings.position || { bottom: "8px", right: "8px" };
  let currentPos = savedPos || defaultPos;

  /* -------------------------------------------------- */
  /* Base iframe styles (shared)                         */
  /* -------------------------------------------------- */
  Object.assign(iframe.style, {
    position: "fixed",
    background: "transparent",
    border: "none",
    zIndex: "2147483647",
    transition:
      "width 0.3s cubic-bezier(0.4,0,0.2,1), height 0.3s cubic-bezier(0.4,0,0.2,1), border-radius 0.3s ease, opacity 0.3s ease",
  });

  const applyPosition = (pos) => {
    iframe.style.top = "auto";
    iframe.style.bottom = "auto";
    iframe.style.left = "auto";
    iframe.style.right = "auto";

    Object.keys(pos).forEach((key) => {
      iframe.style[key] = pos[key];
    });
  };
  applyPosition(currentPos);

  iframe.setAttribute("allowtransparency", "true");

  /* -------------------------------------------------- */
  /* State handlers                                     */
  /* -------------------------------------------------- */
  const applyBubble = () => {
    iframe.dataset.state = "bubble";
    iframe.style.width = "60px";
    iframe.style.height = "60px";
    iframe.style.borderRadius = "9999px";
    iframe.style.overflow = "hidden";
    iframe.style.pointerEvents = "auto";

    if (hideLauncher) {
      iframe.style.opacity = "0";
      iframe.style.pointerEvents = "none";
    } else {
      iframe.style.opacity = "1";
    }

    applyPosition(currentPos);
  };

  const updatePanelStyle = () => {
    if (iframe.dataset.state === "panel") {
      if (window.innerWidth < 640) {
        iframe.style.width = "100vw";
        iframe.style.height = "100vh";
        iframe.style.bottom = "0px";
        iframe.style.right = "0px";
        iframe.style.top = "auto";
        iframe.style.left = "auto";
        iframe.style.borderRadius = "0px";
      } else {
        iframe.style.width = "380px";
        iframe.style.height = "640px";
        iframe.style.borderRadius = "16px";
        applyPosition(currentPos);
      }
      iframe.style.opacity = "1";
      iframe.style.pointerEvents = "auto";
    }
  };

  const applyPanel = () => {
    iframe.dataset.state = "panel";
    updatePanelStyle();
    iframe.style.overflow = "visible";
  };

  window.addEventListener("resize", updatePanelStyle);

  applyBubble();

  /* -------------------------------------------------- */
  /* Public API ($HelpDeck)                             */
  /* -------------------------------------------------- */
  window.$HelpDeck = {
    open: () => {
      iframe.contentWindow.postMessage("helpdeck:open", "*");
    },
    close: () => {
      iframe.contentWindow.postMessage("helpdeck:close", "*");
    },
    toggle: () => {
      iframe.contentWindow.postMessage("helpdeck:toggle", "*");
    },
    updateSettings: (newSettings) => {
      Object.assign(settings, newSettings);
      if (newSettings.hideLauncher !== undefined) {
        if (iframe.dataset.state === "bubble") applyBubble();
      }
    },
  };

  /* -------------------------------------------------- */
  /* Custom Button Listeners                             */
  /* -------------------------------------------------- */
  const initCustomButtons = () => {
    if (settings.buttonSelector) {
      const btns = document.querySelectorAll(settings.buttonSelector);
      btns.forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          window.$HelpDeck.toggle();
        });
      });
    }
  };

  initCustomButtons();
  window.addEventListener("DOMContentLoaded", initCustomButtons);

  /* -------------------------------------------------- */
  /* Drag and Drop                                      */
  /* -------------------------------------------------- */
  let isDragging = false;
  let startX, startY, startBottom, startRight;

  document.addEventListener("mousedown", (e) => {
    if (!isDraggable || iframe.dataset.state !== "bubble" || hideLauncher)
      return;

    const rect = iframe.getBoundingClientRect();
    if (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    ) {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const style = window.getComputedStyle(iframe);
      startBottom = parseInt(style.bottom) || 0;
      startRight = parseInt(style.right) || 0;

      iframe.style.transition = "none";
      e.preventDefault();
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const deltaX = startX - e.clientX;
    const deltaY = startY - e.clientY;

    const newBottom = startBottom + deltaY;
    const newRight = startRight + deltaX;

    const b = Math.max(0, Math.min(window.innerHeight - 60, newBottom));
    const r = Math.max(0, Math.min(window.innerWidth - 60, newRight));

    currentPos = { bottom: b + "px", right: r + "px" };
    applyPosition(currentPos);
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) {
      isDragging = false;
      iframe.style.transition = "";
      localStorage.setItem(POS_KEY, JSON.stringify(currentPos));
    }
  });


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
  /* -------------------------------------------------- */
  /* Analytics Tracking                                  */
  /* -------------------------------------------------- */
  const TRACKING_API = `${baseUrl}/api/analytics/track`;

  // Debug mode: enable if localhost or properly flagged
  const DEBUG =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.HELPDECK_DEBUG === true;

  const log = (msg, ...args) => {
    if (DEBUG) {
      console.log(
        `%c[HelpDeck] ${msg}`,
        "color: #3b82f6; font-weight: bold;",
        ...args,
      );
    }
  };

  // --- 1. Bot Detection ---
  const isBot = () => {
    const nav = window.navigator;
    if (!nav) return true;
    const ua = nav.userAgent.toLowerCase();

    // Check known bot strings
    if (
      ua.includes("headless") ||
      ua.includes("bot") ||
      ua.includes("crawl") ||
      ua.includes("spider") ||
      ua.includes("webdriver") ||
      ua.includes("lighthouse")
    ) {
      return true;
    }

    // Check webdriver properties
    if (
      ("webdriver" in nav && nav.webdriver) ||
      window.callPhantom ||
      window._phantom ||
      window.__nightmare
    ) {
      return true;
    }

    return false;
  };

  if (isBot()) {
    log("Bot detected, tracking disabled");
    document.body.appendChild(iframe);
    return;
  }

  // --- 2. Cookie Helpers (Better than localStorage) ---
  const setCookie = (name, value, days) => {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = "; expires=" + date.toUTCString();
    }
    // Secure cookie attributes
    document.cookie =
      name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
  };

  const getCookie = (name) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  // --- 3. Identity (Visitors & Sessions) ---
  const VISITOR_KEY = "hd_vid";
  const SESSION_KEY = "hd_sid";

  // Visitor ID (1 year)
  let visitorId = getCookie(VISITOR_KEY);
  if (!visitorId) {
    visitorId =
      "v." +
      Math.random().toString(36).substring(2, 10) +
      "." +
      Date.now().toString(36);
    setCookie(VISITOR_KEY, visitorId, 365);
  }

  // Session ID (30 mins)
  let sessionId = getCookie(SESSION_KEY);
  if (!sessionId) {
    sessionId =
      "s." +
      Math.random().toString(36).substring(2, 10) +
      "." +
      Date.now().toString(36);
    setCookie(SESSION_KEY, sessionId, 0.0208); // ~30 mins
  } else {
    setCookie(SESSION_KEY, sessionId, 0.0208); // Refresh expiry
  }

  // --- 4. Transport ---
  const sendEvent = (type, payload = {}) => {
    // If no websiteId, only log in debug mode
    if (!websiteId) {
      if (DEBUG) log("Skipping send: No websiteId", { type, payload });
      return;
    }

    const data = {
      type,
      websiteId,
      ownerId, // Include ownerId context if available
      payload: {
        ...payload,
        sessionId,
        visitorId,
        url: window.location.href,
        path: window.location.pathname,
        referrer: document.referrer,
        timestamp: Date.now(),
        // Add technical context
        ua: navigator.userAgent,
        screen: `${window.screen.width}x${window.screen.height}`,
        lang: navigator.language,
      },
    };

    log(`Sending ${type}`, data);

    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(TRACKING_API, blob);
    } else {
      fetch(TRACKING_API, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch((err) => log("Send failed", err));
    }
  };

  // --- 5. Tracking Logic (SPA Support) ---
  let lastPath = window.location.pathname;
  let lastEventTime = 0;

  const trackPageview = () => {
    const now = Date.now();
    // Simple debounce/throttle for rapid firing (e.g. React double mount)
    // Only block if same path within 500ms
    if (now - lastEventTime < 500 && window.location.pathname === lastPath) {
      return;
    }

    lastPath = window.location.pathname;
    lastEventTime = now;
    sendEvent("pageview");
  };

  // Hook validation: Ensure we don't break the site if something changes
  try {
    // 1. Initial Load
    trackPageview();

    // 2. History API (Next.js / React Router support)
    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      requestAnimationFrame(trackPageview); // Wait for microtask/update
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function (...args) {
      // replaceState typically doesn't trigger new pageview, but some might want it.
      // For now, logging it as internal calc or ignoring.
      originalReplaceState.apply(this, args);
      // Usually we don't track replaceState as pageview unless URL path changes significantly
      if (window.location.pathname !== lastPath) {
        requestAnimationFrame(trackPageview);
      }
    };

    // 3. Popstate (Back/Forward buttons)
    window.addEventListener("popstate", () =>
      requestAnimationFrame(trackPageview),
    );
  } catch (err) {
    log("SPA tracking setup failed", err);
  }

  // --- 6. Session & Vitals ---
  let sessionStartTime = Date.now();

  // Track session duration on visibility toggle (tab switch/close)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      const duration = Date.now() - sessionStartTime;
      sendEvent("session_end", { duration });
    } else {
      sessionStartTime = Date.now();
    }
  });

  // Track basic vitals if supported
  if ("PerformanceObserver" in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === "largest-contentful-paint") {
            sendEvent("vitals", {
              metric: "LCP",
              value: Math.round(entry.startTime),
            });
          }
          if (entry.name === "first-contentful-paint") {
            sendEvent("vitals", {
              metric: "FCP",
              value: Math.round(entry.startTime),
            });
          }
        });
      });
      observer.observe({ type: "paint", buffered: true });
      observer.observe({ type: "largest-contentful-paint", buffered: true });
    } catch (e) {
      // Vitals not supported
    }
  }

  // Finalize
  document.body.appendChild(iframe);
})();
