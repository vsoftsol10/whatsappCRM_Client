// Installs / repairs the knowledge base search trigger by hand.
// (The server already does this on start-up; this is for staging checks.)
//   npm run kb:setup-search
require("dotenv").config();

const prisma = require("../src/config/prisma");
const { ensureKbSearchSetup } = require("../src/services/ai/knowledgeBaseSetup");

ensureKbSearchSetup()
  .then(() => console.log("Knowledge base search index is ready."))
  .catch((error) => {
    console.error("Setup failed:", error.message);
    console.error("Did you run `npx prisma db push` first?");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
