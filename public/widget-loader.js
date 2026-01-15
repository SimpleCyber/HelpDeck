(function() {
  const websiteId = window.CRISP_WEBSITE_ID;
  if (!websiteId) {
    console.error("Crisp Clone: Missing window.CRISP_WEBSITE_ID");
    return;
  }

  const scriptTag = document.currentScript;
  const baseUrl = scriptTag ? new URL(scriptTag.src).origin : window.location.origin;

  const iframe = document.createElement('iframe');
  iframe.src = `${baseUrl}/widget/${websiteId}`;
  iframe.style.position = 'fixed';
  iframe.style.bottom = '20px';
  iframe.style.right = '20px';
  iframe.style.width = '80px';
  iframe.style.height = '80px';
  iframe.style.border = 'none';
  iframe.style.zIndex = '2147483647';
  iframe.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
  iframe.style.colorScheme = 'none';
  iframe.id = 'crisp-widget-iframe';
  
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
})();
