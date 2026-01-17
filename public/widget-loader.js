(function () {
  const websiteId = window.CRISP_WEBSITE_ID;
  const userData = window.HELPDECK_USER || null;

  if (!websiteId) {
    console.error("HelpDeck: Missing window.CRISP_WEBSITE_ID");
    return;
  }

  const scriptTag = document.currentScript;
  const baseUrl = scriptTag
    ? new URL(scriptTag.src).origin
    : window.location.origin;

  let userParam = "";
  if (userData) {
    try {
      userParam = `&user=${encodeURIComponent(JSON.stringify(userData))}`;
    } catch (e) {
      console.error("HelpDeck: Invalid HELPDECK_USER data", e);
    }
  }

  const iframe = document.createElement("iframe");
  iframe.id = "helpdeck-widget-iframe";
  iframe.src = `${baseUrl}/widget/${websiteId}?v=1${userParam}`;

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
  iframe.style.width = "80px";
  iframe.style.height = "80px";
  iframe.style.borderRadius = "9999px";

  // 🔴 THIS IS THE KEY LINE
  iframe.style.overflow = "hidden";
  iframe.style.pointerEvents = "auto";
};

const applyPanel = () => {
  iframe.dataset.state = "panel";
  iframe.style.width = "380px";
  iframe.style.height = "640px";
  iframe.style.borderRadius = "16px";

  // Allow normal layout when expanded
  iframe.style.overflow = "visible";
};


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

  document.body.appendChild(iframe);
})();
