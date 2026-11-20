// src/utils/lazyWithRetry.js
//
// Loads a page only when it is opened (lazy loading) and shows a small
// spinner while that page's file downloads.
//
// SAFETY NET FOR NEW DEPLOYS
// --------------------------
// Every build gives page files new names (Campaigns-AbC123.js). A browser
// that still has the OLD app open may ask for a page file that no longer
// exists on the server. When that happens we reload the page so the newest
// app is used.
//
// It can never reload in a loop: after one automatic reload we wait at least
// 30 seconds before allowing another. If the file is still missing after the
// reload, the normal "Something went wrong - Reload" screen is shown instead.
import { Suspense, lazy, createElement } from "react";
import PageLoader from "../components/PageLoader";

const RELOAD_KEY = "vatup-chunk-reload-at";
const MIN_GAP_MS = 30 * 1000;

const lastReloadAt = () => {
  try {
    return Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
  } catch {
    return Date.now(); // storage blocked -> never auto-reload (avoids any loop)
  }
};

const markReload = () => {
  try {
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
};

const lazyWithRetry = (importer) =>
  lazy(() =>
    importer().catch((error) => {
      if (Date.now() - lastReloadAt() > MIN_GAP_MS) {
        markReload();
        window.location.reload();
        // keep the spinner on screen while the browser reloads
        return new Promise(() => {});
      }
      throw error; // already reloaded a moment ago -> ErrorBoundary shows the message
    })
  );

// lazyPage(() => import("./pages/Dashboard"))
// Returns a normal component. It is used in JSX exactly like before:
//   <Dashboard />   <Conversations channel="WHATSAPP" />
// The spinner appears INSIDE the layout, so the sidebar stays on screen.
// Pass { fullScreen: true } only for the outer layout (AppLayout).
export const lazyPage = (importer, { fullScreen = false } = {}) => {
  const LazyComponent = lazyWithRetry(importer);

  const Page = (props) =>
    createElement(
      Suspense,
      { fallback: createElement(PageLoader, { fullScreen }) },
      createElement(LazyComponent, props)
    );

  return Page;
};

export default lazyWithRetry;