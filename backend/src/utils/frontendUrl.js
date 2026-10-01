// backend/src/utils/frontendUrl.js
require("dotenv").config();

// Same fallback your emailService.js already uses
const DEFAULT_FRONTEND_URL = "https://watsupcl.thevsoft.com";

/**
 * Returns the frontend base URL with no trailing slash.
 * Never returns "undefined".
 */
const getFrontendUrl = () => {
  let url = (process.env.FRONTEND_URL || "").trim();

  if (!url) {
    console.warn(
      `⚠️ FRONTEND_URL is not set. Falling back to ${DEFAULT_FRONTEND_URL}`
    );
    url = DEFAULT_FRONTEND_URL;
  }

  // Must start with http:// or https:// or the email link will not be clickable
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  // Remove trailing slash(es): "http://localhost:5173/" -> "http://localhost:5173"
  return url.replace(/\/+$/, "");
};

/**
 * buildFrontendUrl("/reset-password/abc") -> "https://your-site.com/reset-password/abc"
 */
const buildFrontendUrl = (path = "") => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${getFrontendUrl()}${cleanPath}`;
};

module.exports = { getFrontendUrl, buildFrontendUrl };