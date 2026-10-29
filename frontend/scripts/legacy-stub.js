/*
 * SELF-HEALING STUB - generated into dist/assets/ under every OLD build name.
 * A stale page that still loads an old bundle ends up here. We fetch the
 * CURRENT page (cache-busted) and start the new app instead of the old one.
 */
(function () {
  if (window.__vatupHealing) return;
  window.__vatupHealing = true;

  function showMessage() {
    var root = document.getElementById("root");
    if (root) {
      root.style.cssText = "font-family:sans-serif;padding:24px;text-align:center";
      root.textContent =
        "A new version is available. Please press Ctrl + Shift + R to refresh.";
    }
  }

  fetch("/index.html?cb=" + Date.now(), { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("index.html not available");
      return res.text();
    })
    .then(function (html) {
      var doc = new DOMParser().parseFromString(html, "text/html");
      var scriptEl = doc.querySelector('script[type="module"][src]');
      if (!scriptEl) throw new Error("no app script found");

      doc.querySelectorAll('link[rel="stylesheet"]').forEach(function (l) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = l.getAttribute("href");
        document.head.appendChild(link);
      });

      var s = document.createElement("script");
      s.type = "module";
      s.src = scriptEl.getAttribute("src");
      document.body.appendChild(s);
    })
    .catch(showMessage);
})();
