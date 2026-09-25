// backend/scripts/checkWabaAccess.js
require("dotenv").config();
const axios = require("axios");
const prisma = require("../src/config/prisma");

const GRAPH_API_VERSION = "v23.0";
const TOKEN = process.env.META_SYSTEM_USER_TOKEN;

async function checkAccount(account) {
  if (!account.wabaId) {
    return { ...base(account), result: "NO_WABA_ID" };
  }

  try {
    const res = await axios.get(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${account.wabaId}`,
      {
        params: { fields: "id,name" },
        headers: { Authorization: `Bearer ${TOKEN}` },
      }
    );
    return { ...base(account), result: "OK", metaName: res.data.name };
  } catch (err) {
    const metaError = err.response?.data?.error;
    return {
      ...base(account),
      result: "FAILED",
      code: metaError?.code,
      message: metaError?.message,
    };
  }
}

function base(account) {
  return {
    companyId: account.companyId,
    wabaId: account.wabaId,
    phoneNumberId: account.phoneNumberId,
    dbStatus: account.status,
  };
}

async function main() {
  if (!TOKEN) {
    console.error("META_SYSTEM_USER_TOKEN is not set in .env");
    process.exit(1);
  }

  const accounts = await prisma.whatsAppAccount.findMany({
    where: { status: "CONNECTED" },
  });

  console.log(`Checking ${accounts.length} CONNECTED accounts...\n`);

  const results = [];
  for (const account of accounts) {
    const result = await checkAccount(account);
    results.push(result);
    console.log(result);
  }

  const broken = results.filter((r) => r.result !== "OK");
  console.log(`\n${broken.length} of ${results.length} accounts FAILED access check.`);
  if (broken.length) {
    console.log("These companies' WABAs are NOT accessible with your current system token:");
    console.table(broken);
  }

  process.exit(0);
}

main();