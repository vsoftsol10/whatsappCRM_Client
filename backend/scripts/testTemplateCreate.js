// backend/scripts/testTemplateCreate.js
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const axios = require("axios");

const TOKEN = process.env.META_SYSTEM_USER_TOKEN;
const GRAPH_API_VERSION = "v23.0";

const wabasToTest = [
  { label: "Company 26 (Test Number)", wabaId: "1527109115071820" },
  { label: "Company 57 (Vedacrafts)", wabaId: "1075285831964171" },
];

async function testCreate(wabaId, label) {
  const testName = `debug_test_${Date.now()}`;

  try {
    const res = await axios.post(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/message_templates`,
      {
        name: testName,
        category: "UTILITY",
        language: "en_US",
        components: [
          {
            type: "BODY",
            text: "This is a diagnostic test template. Please ignore.",
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ ${label} (${wabaId}) — SUCCESS`);
    console.log(res.data);
  } catch (err) {
    const metaError = err.response?.data?.error;
    console.log(`❌ ${label} (${wabaId}) — FAILED`);
    console.log({
      status: err.response?.status,
      code: metaError?.code,
      subcode: metaError?.error_subcode,
      type: metaError?.type,
      message: metaError?.message,
      error_user_title: metaError?.error_user_title,
      error_user_msg: metaError?.error_user_msg,
    });
  }
  console.log("---");
}

async function main() {
  for (const w of wabasToTest) {
    await testCreate(w.wabaId, w.label);
  }
}

main();