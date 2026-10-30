// One-time script. Run ONCE after `npx prisma db push`:
//
//   node prisma/backfillTourSeen.js
//
// Marks the user guide (product tour) as already seen for every user who
// has already logged in and changed their password. Without this, existing
// customers would see the guide one more time on their next login.
// Users who have never logged in yet are NOT touched - they will see the
// guide on their first login, as intended.

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const backfillTourSeen = async () => {
  const result = await prisma.user.updateMany({
    where: {
      isFirstLogin: false,
      tourSeenAt: null,
    },
    data: {
      tourSeenAt: new Date(),
    },
  });

  console.log(`Marked the user guide as seen for ${result.count} existing user(s).`);
};

backfillTourSeen()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });