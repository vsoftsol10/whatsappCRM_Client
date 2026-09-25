// ============================================================
// CHECK IF A TEMPLATE ACTUALLY EXISTS ON META
// ============================================================
// This asks Meta directly (not your CRM's UI, not WhatsApp
// Manager's website) whether a template really exists on your
// WABA. This is the most reliable check there is — if it shows
// up here, it is 100% on Meta's side, no matter what any
// dashboard shows or doesn't show you.
//
// HOW TO RUN:
//   1. Copy this file into your backend/scripts/ folder
//      (create that folder if it doesn't exist yet)
//   2. Open a terminal in your backend folder:
//        cd D:\WatupCRM\WhatsappCRM\backend
//   3. Run:
//        node scripts/checkTemplateOnMeta.js
//   4. Read the output — full guidance is printed at the bottom
// ============================================================

require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const axios = require("axios");

const GRAPH_API_VERSION = "v23.0";

// 👇 The WABA you want to check (Vedacrafts / company 57)
const WABA_ID = "1075285831964171";

// 👇 The template name you're looking for
const TEMPLATE_NAME_TO_FIND = "vedaconnect_welcome_v2";

async function main() {
  const TOKEN = process.env.META_SYSTEM_USER_TOKEN;

  if (!TOKEN) {
    console.error("❌ META_SYSTEM_USER_TOKEN not found.");
    console.error(
      "   Make sure this script sits inside backend/scripts/ so the"
    );
    console.error("   ../.env path above correctly points to backend/.env");
    process.exit(1);
  }

  console.log("Token loaded:", TOKEN.slice(0, 10) + "..." + TOKEN.slice(-6));
  console.log(`Checking WABA ${WABA_ID} for all templates...\n`);

  try {
    const res = await axios.get(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${WABA_ID}/message_templates`,
      {
        params: {
          access_token: TOKEN,
          fields: "id,name,status,category,language",
          limit: 100,
        },
      }
    );

    const templates = res.data.data || [];

    console.log(`Meta returned ${templates.length} template(s) on this WABA:\n`);
    templates.forEach((t) => {
      console.log(
        `- ${t.name}  |  status: ${t.status}  |  category: ${t.category}  |  language: ${t.language}  |  id: ${t.id}`
      );
    });

    console.log("\n============================================");

    const match = templates.find((t) => t.name === TEMPLATE_NAME_TO_FIND);

    if (match) {
      console.log(`✅ FOUND IT: "${TEMPLATE_NAME_TO_FIND}" DOES exist on Meta.`);
      console.log(match);
      console.log(
        "\nThis confirms the template really was sent to Meta successfully."
      );
      console.log(
        "If you still don't see it on the WhatsApp Manager WEBSITE, the"
      );
      console.log("problem is one of these (not your code, not Meta's data):");
      console.log(
        "  1. You're viewing a different Business Portfolio / wrong WABA"
      );
      console.log(
        "     in the top-left switcher on business.facebook.com"
      );
      console.log(
        '  2. A status filter on the templates page is hiding "Pending"'
      );
      console.log(
        '     items — set the filter to "All statuses"'
      );
      console.log(
        "  3. The page is cached — hard refresh (Ctrl+Shift+R) or open"
      );
      console.log("     it in an incognito/private window");
    } else {
      console.log(
        `❌ NOT FOUND: "${TEMPLATE_NAME_TO_FIND}" does NOT exist on Meta right now.`
      );
      console.log(
        "\nThis would be unexpected given your earlier successful API"
      );
      console.log(
        "response — it may mean the WABA was reset/disconnected, or the"
      );
      console.log("template was deleted after creation. Worth investigating");
      console.log("further if you get this result.");
    }

    console.log("============================================");
  } catch (err) {
    console.error("\n❌ Request to Meta failed:");
    console.error(err.response?.data || err.message);
  }
}

main();