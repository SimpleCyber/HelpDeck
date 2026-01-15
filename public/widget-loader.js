(function() {
  const websiteId = window.CRISP_WEBSITE_ID;
  const userData = window.HELPDECK_USER || null;
  
  if (!websiteId) {
    console.error("HelpDeck: Missing window.CRISP_WEBSITE_ID");
    return;
  }

  const scriptTag = document.currentScript;
  const baseUrl = scriptTag ? new URL(scriptTag.src).origin : window.location.origin;

  // Encode user data as a base64 string or simple JSON to pass in URL
  let userParam = "";
  if (userData) {
    try {
      userParam = `&user=${encodeURIComponent(JSON.stringify(userData))}`;
    } catch (e) {
      console.error("HelpDeck: Invalid HELPDECK_USER data", e);
    }
  }

  const iframe = document.createElement('iframe');
  iframe.src = `${baseUrl}/widget/${websiteId}?v=1${userParam}`;
  iframe.style.position = 'fixed';
  iframe.style.bottom = '8px';
  iframe.style.right = '8px';
  iframe.style.width = '64px';
  iframe.style.height = '64px';
  iframe.style.border = 'none';
  iframe.style.background = 'transparent';
iframe.setAttribute('allowtransparency', 'true');
  iframe.style.zIndex = '2147483647';
  iframe.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  iframe.id = 'helpdeck-widget-iframe';
  
  window.addEventListener('message', (event) => {
    if (event.data === 'expand') {
      iframe.style.width = '396px';
      iframe.style.height = '656px';
    } else if (event.data === 'collapse') {
      iframe.style.width = '80px';
      iframe.style.height = '80px';
    }
  });

  document.body.appendChild(iframe);
})();
