// src/components/PageLoader.jsx
//
// Small spinner shown for a moment while a page's file is downloading.
// fullScreen = true  -> covers the whole screen (used before the layout is ready)
// fullScreen = false -> sits inside the page area (sidebar stays visible)
const PageLoader = ({ fullScreen = false }) => (
  <div
    role="status"
    aria-label="Loading"
    className={
      fullScreen
        ? "flex min-h-screen w-full items-center justify-center bg-white"
        : "flex min-h-[60vh] w-full items-center justify-center"
    }
  >
    <div
      className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200"
      style={{ borderTopColor: "#25D366" }}
    />
  </div>
);

export default PageLoader;
