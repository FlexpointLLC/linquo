(function () {
  try {
    var current = document.currentScript;
    var base = (function () {
      try {
        return new URL(current.src).origin;
      } catch {
        return window.location.origin;
      }
    })();

    var container = document.createElement('div');
    container.id = 'ic-widget-root';
    container.style.position = 'fixed';
    container.style.right = '16px';
    container.style.bottom = '16px';
    container.style.zIndex = '2147483647';
    container.style.width = '400px';
    container.style.height = '700px';
    container.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
    container.style.borderRadius = '12px';
    container.style.overflow = 'hidden';
    container.style.background = 'transparent';

    var iframe = document.createElement('iframe');
    var params = new URLSearchParams();
    var site = window.location.host;
    params.set('site', site);
    var conv = current && current.getAttribute('data-conversation');
    if (conv) params.set('cid', conv);
    iframe.src = base + '/embed' + '?' + params.toString();
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';
    iframe.allow = 'clipboard-write;';
    iframe.loading = 'lazy';

    // Minimal resize via postMessage (optional enhancement)
    window.addEventListener('message', function (e) {
      if (!e || !e.data) return;
      if (typeof e.data !== 'object') return;
      if (e.data.__ic_resize) {
        var s = e.data.__ic_resize;
        if (s.width) container.style.width = s.width + 'px';
        if (s.height) container.style.height = s.height + 'px';
      }
    });

    container.appendChild(iframe);
    document.body.appendChild(container);
  } catch (err) {
    console.error('[IC Widget] failed to load', err);
  }
})();


