// One-time script. Run ONCE after `npx prisma db push`:
//
//   node prisma/backfillModuleGuideSeen.js
//
// Marks the module demo video as already seen for every user who has already
// logged in and changed their password. Without this, existing users would see
// the demo video one more time on their next login.
// Users who have never logged in yet are NOT touched - they will see the demo
// video on their first login, as intended.

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const backfillModuleGuideSeen = async () => {
  const result = await prisma.user.updateMany({
    where: {
      isFirstLogin: false,
      moduleGuideSeenAt: null,
    },
    data: {
      moduleGuideSeenAt: new Date(),
    },
  });

  console.log(`Marked the module demo video as seen for ${result.count} existing user(s).`);
};

backfillModuleGuideSeen()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });