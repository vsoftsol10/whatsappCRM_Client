// backend/scripts/debugTokenScopes.js
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const axios = require("axios");

const TOKEN = process.env.META_SYSTEM_USER_TOKEN;
const APP_ID = process.env.META_APP_ID;
const APP_SECRET = process.env.META_APP_SECRET;

async function main() {
  if (!TOKEN || !APP_ID || !APP_SECRET) {
    console.error("Missing META_SYSTEM_USER_TOKEN, META_APP_ID, or META_APP_SECRET in .env");
    process.exit(1);
  }

  try {
    const res = await axios.get("https://graph.facebook.com/debug_token", {
      params: {
        input_token: TOKEN,
        access_token: `${APP_ID}|${APP_SECRET}`,
      },
    });

    const data = res.data.data;

    console.log("Token valid:", data.is_valid);
    console.log("Expires at:", data.expires_at === 0 ? "Never" : new Date(data.expires_at * 1000));
    console.log("App ID:", data.app_id);
    console.log("Scopes:", data.scopes);
    console.log("\nGranular scopes (per-asset permissions):\n");

    if (!data.granular_scopes) {
      console.log("No granular_scopes returned — token may have full/blanket access, or is an older-style token.");
      return;
    }

    data.granular_scopes.forEach((scope) => {
      console.log(`Permission: ${scope.scope}`);
      console.log(`  Target IDs: ${scope.target_ids?.join(", ") || "(none listed)"}`);
    });

    console.log("\n--- Checking your two WABAs specifically ---");
    const wabaIdsToCheck = ["1527109115071820", "1075285831964171"];

    wabaIdsToCheck.forEach((wabaId) => {
      console.log(`\nWABA ${wabaId}:`);
      const relevantScopes = data.granular_scopes.filter((s) =>
        s.target_ids?.includes(wabaId)
      );
      if (relevantScopes.length === 0) {
        console.log("  ⚠️  NOT explicitly listed in any granular scope — likely missing management access.");
      } else {
        relevantScopes.forEach((s) => console.log(`  ✅ ${s.scope}`));
      }
    });
  } catch (err) {
    console.error("DEBUG TOKEN ERROR:", err.response?.data || err.message);
  }
}

main();