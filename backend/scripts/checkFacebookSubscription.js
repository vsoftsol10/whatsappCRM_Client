// Usage (from /backend):  node scripts/checkFacebookSubscription.js
// Shows, for every connected Facebook Page, whether Meta is really set to
// deliver its messages to this app, and re-subscribes if it is not.
require("dotenv").config();
const axios = require("axios");
const prisma = require("../src/config/prisma");
const { decryptSecret } = require("../src/utils/secretCrypto");
const { PAGE_SUBSCRIBED_FIELDS, subscribePageToApp } = require("../src/services/facebookService");

const GRAPH = `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || "v23.0"}`;

(async () => {
  const pages = await prisma.facebookPage.findMany({
    where: { connectionType: "FACEBOOK_LOGIN", status: { not: "DISCONNECTED" } },
  });
  if (!pages.length) console.log("No connected Facebook pages in DB");

  for (const page of pages) {
    console.log("\n== Page", page.pageId, page.pageName, "status:", page.status);
    const token = decryptSecret(page.pageAccessToken);
    if (!token) { console.log("   NO TOKEN stored -> reconnect Facebook"); continue; }
    try {
      const r = await axios.get(`${GRAPH}/${page.pageId}/subscribed_apps`, { params: { access_token: token } });
      console.log("   subscribed_apps:", JSON.stringify(r.data.data));
      const mine = (r.data.data || []).find((a) => String(a.id) === String(process.env.META_APP_ID));
      if (!mine || !(mine.subscribed_fields || []).includes("messages")) {
        console.log("   !! Not subscribed to 'messages' -> re-subscribing");
        console.log("   result:", JSON.stringify(await subscribePageToApp(page.pageId, token)));
      } else console.log("   OK: Page is subscribed to messages");
    } catch (e) {
      console.log("   ERROR:", e?.response?.data?.error || e.message);
    }
  }
  process.exit(0);
})();