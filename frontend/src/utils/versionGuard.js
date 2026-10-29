// If this page is running an OLDER build than the one on the server,
// reload once so the newest files are used. Never loops.
export function checkForNewBuild() {
  if (import.meta.env.DEV) return;

  let current;
  try {
    current = new URL(import.meta.url).pathname; // e.g. /assets/index-XXXX.js
  } catch {
    return;
  }

  fetch("/index.html?cb=" + Date.now(), { cache: "no-store" })
    .then((res) => (res.ok ? res.text() : ""))
    .then((html) => {
      const match = html.match(
        /<script[^>]+src="([^"]*\/assets\/index-[^"]+\.js)"/
      );
      if (!match) return;

      const latest = new URL(match[1], window.location.origin).pathname;
      if (latest === current) return;

      // Only try once per new version, so it can never reload forever.
      if (sessionStorage.getItem("vatup-build-reload") === latest) return;
      sessionStorage.setItem("vatup-build-reload", latest);
      window.location.reload();
    })
    .catch(() => {});
}
