// ============================================
// KNOWLEDGE BASE - SPEED CHECK WITH LARGE CATALOGS
// ============================================
// Creates temporary companies with many entries, times the AI search
// (searchCompanyKb) and prints a table, then deletes everything it made.
//
// SAFETY: writes to the database in DATABASE_URL. Use STAGING only:
//   KB_TEST_ALLOW_DB=yes node tests/kbLoadCheck.js
//   KB_TEST_ALLOW_DB=yes KB_LOAD_SIZES=300,2000,5000 node tests/kbLoadCheck.js
//
// Rule of thumb: the search runs before the AI call (which itself takes
// 1-3 seconds), so anything under ~100 ms is invisible to customers.

if (process.env.KB_TEST_ALLOW_DB !== "yes") {
  console.error("Refusing to run: writes to the DATABASE_URL database. Use STAGING and set KB_TEST_ALLOW_DB=yes");
  process.exit(1);
}

const prisma = require("../src/config/prisma");
const { searchCompanyKb } = require("../src/services/ai/knowledgeBase");

const SIZES = (process.env.KB_LOAD_SIZES || "300,1000,5000,20000")
  .split(",").map((n) => parseInt(n, 10)).filter((n) => n > 0);
const NOISE_COMPANIES = Number(process.env.KB_LOAD_NOISE || 3); // other tenants, 5000 rows each
const RUN = `kbload${Date.now()}`;

// ---------- deterministic pseudo data ----------
let seed = 12345;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (arr) => arr[Math.floor(rand() ** 1.6 * arr.length)]; // skewed: some words common, most rare

const SYL = ["ka","ju","ma","la","ri","su","na","bo","te","vi","sha","pa","do","ke","mi","ra","tu","go","ni","fa"];
const word = () => Array.from({ length: 2 + Math.floor(rand() * 2) }, () => SYL[Math.floor(rand() * SYL.length)]).join("");
const VOCAB = Array.from(new Set(Array.from({ length: 3000 }, word)));
const COMMON = ["sweet","box","gift","pack","delivery","price","offer","fresh","premium","festival","special","combo","kg","spicy","classic"];

const makeEntry = (companyId, i) => {
  const title = `${pick(COMMON)} ${pick(VOCAB)} ${pick(VOCAB)} ${i}`;
  const body = Array.from({ length: 45 + Math.floor(rand() * 40) }, () => (rand() < 0.12 ? pick(COMMON) : pick(VOCAB))).join(" ");
  return {
    companyId,
    title,
    keywords: `${pick(VOCAB)}, ${pick(VOCAB)}`,
    content: `Price: Rs ${50 + Math.floor(rand() * 900)}. ${body}`,
  };
};

const seedCompany = async (label, count) => {
  const company = await prisma.company.create({
    data: {
      companyId: `${RUN}-${label}`, companyName: `KB Load ${label}`, ownerName: "x",
      email: `${RUN}-${label}@example.test`, phone: "0", address: "n/a", plan: "TEST",
      expiryDate: new Date(Date.now() + 86400000),
    },
  });
  for (let start = 0; start < count; start += 1000) {
    const batch = Array.from({ length: Math.min(1000, count - start) }, (_, k) => makeEntry(company.id, start + k));
    await prisma.kbEntry.createMany({ data: batch });
  }
  return company;
};

const time = async (fn, runs = 25) => {
  const t = [];
  await fn(); // warm-up
  for (let i = 0; i < runs; i++) {
    const s = process.hrtime.bigint();
    await fn();
    t.push(Number(process.hrtime.bigint() - s) / 1e6);
  }
  t.sort((a, b) => a - b);
  return { p50: t[Math.floor(t.length * 0.5)], p95: t[Math.floor(t.length * 0.95) - 1] || t[t.length - 1] };
};

const fmt = (r) => `${r.p50.toFixed(0).padStart(4)} / ${r.p95.toFixed(0).padStart(4)}`;

(async () => {
  const created = [];
  try {
    console.log(`Seeding ${NOISE_COMPANIES} other tenants x 5000 rows + test companies ${SIZES.join(", ")} ...`);
    for (let n = 0; n < NOISE_COMPANIES; n++) created.push(await seedCompany(`noise${n}`, 5000));

    console.log("\nSearch time in ms (median / slowest-5%):");
    console.log("entries   specific product   common words   no match (worst case)");
    for (const size of SIZES) {
      const co = await seedCompany(`size${size}`, size);
      created.push(co);

      const sample = await prisma.kbEntry.findFirst({ where: { companyId: co.id }, skip: Math.floor(size / 2) });
      const [, w1, w2] = sample.title.split(" ");

      const specific = await time(() => searchCompanyKb(co.id, `price of ${w1} ${w2}?`));
      const common = await time(() => searchCompanyKb(co.id, "sweet gift box delivery price"));
      const nomatch = await time(() => searchCompanyKb(co.id, "do you make wedding cakes zzzcake"));

      console.log(`${String(size).padStart(7)}   ${fmt(specific)}      ${fmt(common)}      ${fmt(nomatch)}`);
    }
  } finally {
    await prisma.company.deleteMany({ where: { id: { in: created.map((c) => c.id) } } });
    await prisma.$disconnect();
    console.log("\nTemporary data deleted.");
  }
})().catch((e) => { console.error(e); process.exit(1); });