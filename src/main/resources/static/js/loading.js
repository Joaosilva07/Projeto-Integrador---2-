(function () {
  if (window.__jamesGlobalLoaderInstalled) return;
  window.__jamesGlobalLoaderInstalled = true;

  const SHOW_DELAY_MS = 140;
  const MIN_VISIBLE_MS = 220;
  let activeRequests = 0;
  let showTimer = null;
  let hideTimer = null;
  let visibleAt = 0;
  let overlay = null;

  function injectStyles() {
    if (document.getElementById("james-global-loader-style")) return;

    const style = document.createElement("style");
    style.id = "james-global-loader-style";
    style.textContent = `
      .james-global-loader {
        position: fixed;
        bottom: 18px;
        right: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 999px;
        border: 1px solid rgba(228, 217, 200, 0.95);
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 12px 30px rgba(78, 61, 39, 0.14);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transform: translateY(-8px) scale(0.92);
        transition: opacity 180ms ease, visibility 180ms ease, transform 180ms ease;
        z-index: 9999;
      }

      .james-global-loader.is-visible {
        opacity: 1;
        visibility: visible;
        transform: translateY(0) scale(1);
      }

      .james-global-loader__spinner {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 2.5px solid rgba(192, 107, 74, 0.18);
        border-top-color: #5c8268;
        border-right-color: #c06b4a;
        animation: james-global-loader-spin 0.9s linear infinite;
      }

      @keyframes james-global-loader-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;

    document.head.appendChild(style);
  }

  function ensureOverlay() {
    if (overlay) return overlay;

    overlay = document.createElement("div");
    overlay.className = "james-global-loader";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <div class="james-global-loader__spinner" role="status" aria-live="polite" aria-label="Carregando"></div>
    `;

    const parent = document.body || document.documentElement;
    parent.appendChild(overlay);
    return overlay;
  }

  function reveal() {
    injectStyles();
    const node = ensureOverlay();
    visibleAt = Date.now();
    node.classList.add("is-visible");
    node.setAttribute("aria-hidden", "false");
  }

  function conceal() {
    if (!overlay) return;
    overlay.classList.remove("is-visible");
    overlay.setAttribute("aria-hidden", "true");
  }

  function startLoading() {
    activeRequests += 1;
    clearTimeout(hideTimer);

    if (activeRequests > 1) {
      return;
    }

    clearTimeout(showTimer);
    showTimer = window.setTimeout(() => {
      if (activeRequests > 0) {
        reveal();
      }
    }, SHOW_DELAY_MS);
  }

  function stopLoading() {
    activeRequests = Math.max(0, activeRequests - 1);
    if (activeRequests > 0) return;

    clearTimeout(showTimer);
    const elapsed = Date.now() - visibleAt;
    const wait = overlay && overlay.classList.contains("is-visible")
      ? Math.max(0, MIN_VISIBLE_MS - elapsed)
      : 0;

    clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => {
      if (activeRequests === 0) {
        conceal();
      }
    }, wait);
  }

  function normalizeOptions(init) {
    if (!init || typeof init !== "object") return init;
    const { loading, loadingMessage, ...rest } = init;
    return rest;
  }

  function shouldTrack(init) {
    return !(init && typeof init === "object" && init.loading === false);
  }

  const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  if (!nativeFetch) return;

  window.showGlobalLoader = function (message) {
    startLoading(message);
  };

  window.hideGlobalLoader = function () {
    if (activeRequests === 0) {
      conceal();
      return;
    }
    stopLoading();
  };

  window.fetch = function (input, init) {
    const track = shouldTrack(init);
    const cleanedInit = normalizeOptions(init);
    if (track) {
      startLoading();
    }

    return nativeFetch(input, cleanedInit).finally(() => {
      if (track) stopLoading();
    });
  };
})();
