// ============================================
// KNOWLEDGE BASE - TENANT ISOLATION TESTS
// ============================================
// Proves that one company's knowledge base entries are never used for
// another company, in both the AI retrieval and the admin API.
//
// SAFETY: this talks to the database in DATABASE_URL and creates (then
// deletes) its own test companies. Run it on STAGING / a test database,
// never on production. It refuses to run unless you opt in:
//
//   KB_TEST_ALLOW_DB=yes npm run test:kb
//
// Needs the new tables first:  npx prisma db push

const test = require("node:test");
const assert = require("node:assert/strict");

if (process.env.KB_TEST_ALLOW_DB !== "yes") {
  console.error(
    "Refusing to run: these tests write to the database in DATABASE_URL.\n" +
      "Point DATABASE_URL at a STAGING/test database and run:\n" +
      "  KB_TEST_ALLOW_DB=yes npm run test:kb"
  );
  process.exit(1);
}

// Small limits so the "too many entries / rows" cases are quick to test.
// (Must be set before the app modules below are loaded.)
process.env.KB_MAX_ENTRIES_PER_COMPANY = "200";
process.env.KB_MAX_IMPORT_ROWS = "50";

// Fake AI provider for the end-to-end reply tests (no real AI is called)
process.env.AI_PROVIDER = "GROQ";
process.env.GROQ_API_KEY = "test-key";

const XLSX = require("xlsx");
const express = require("express");

const prisma = require("../src/config/prisma");
const {
  searchCompanyKb,
  buildKnowledgeContext,
} = require("../src/services/ai/knowledgeBase");
const { isKbSearchSetupInstalled } = require("../src/services/ai/knowledgeBaseSetup");
const {
  previewImport,
  applyImport,
  bulkUpdateEntries,
  ImportError,
} = require("../src/services/kbImportService");
const kbImportUpload = require("../src/middleware/kbImportUpload");
const axios = require("axios");
const { getAutoReply } = require("../src/services/aiService");
const { findReplyTag, resolveReplyContext } = require("../src/services/ai/replyContext");
const { saveIncomingMessage } = require("../src/helpers/messageHelper");
const {
  listEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  previewEntries,
  importEntries,
  deleteAllEntries,
} = require("../src/controllers/knowledgeBaseController");

const RUN = `kbtest${Date.now()}${Math.floor(Math.random() * 1000)}`;

const A_DELIVERY = "A_DELIVERY_MARKER";
const B_DELIVERY = "B_DELIVERY_MARKER";
const B_WARRANTY = "B_WARRANTY_MARKER";
const A_INACTIVE = "A_INACTIVE_MARKER";
const A_TAMIL = "A_TAMIL_MARKER";

let companyA;
let companyB;
let companyEmpty;
let entryA;
let entryB;
const extraCompanies = [];

const makeCompany = (label) =>
  prisma.company.create({
    data: {
      companyId: `${RUN}-${label}`,
      companyName: `KB Test ${label}`,
      ownerName: "KB Test",
      email: `${RUN}-${label}@example.test`,
      phone: "0000000000",
      address: "n/a",
      plan: "TEST",
      expiryDate: new Date(Date.now() + 86400000),
    },
  });

// Minimal Express-like response + request helpers
const makeRes = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const asAdmin = (company, extra = {}) => ({
  user: { userId: "test-admin", companyId: company.id, role: "ADMIN" },
  params: {},
  query: {},
  body: {},
  ...extra,
});

test.before(async () => {
  companyA = await makeCompany("A");
  companyB = await makeCompany("B");
  companyEmpty = await makeCompany("EMPTY");

  entryA = await prisma.kbEntry.create({
    data: {
      companyId: companyA.id,
      title: "Delivery charges",
      keywords: "shipping, courier",
      content: `${A_DELIVERY} We charge 50 rupees for delivery inside the city.`,
    },
  });

  entryB = await prisma.kbEntry.create({
    data: {
      companyId: companyB.id,
      title: "Delivery charges",
      content: `${B_DELIVERY} Delivery is free for orders above 500 rupees.`,
    },
  });

  await prisma.kbEntry.createMany({
    data: [
      {
        companyId: companyB.id,
        title: "Warranty",
        content: `${B_WARRANTY} All products carry a one year warranty.`,
      },
      {
        companyId: companyA.id,
        title: "Refund policy",
        isActive: false,
        content: `${A_INACTIVE} Refunds are processed in 7 days.`,
      },
      {
        companyId: companyA.id,
        title: "விநியோக கட்டணம்",
        content: `${A_TAMIL} நகரத்திற்குள் விநியோகம் இலவசம்.`,
      },
    ],
  });
});

test.after(async () => {
  // Deleting the companies also deletes their entries (onDelete: Cascade)
  await prisma.company.deleteMany({
    where: {
      id: {
        in: [companyA, companyB, companyEmpty, ...extraCompanies].filter(Boolean).map((c) => c.id),
      },
    },
  });
  await prisma.$disconnect();
});

// ---------------------------------------------
// RETRIEVAL (what the AI auto-reply uses)
// ---------------------------------------------
test("company A only gets its own entries", async () => {
  const results = await searchCompanyKb(companyA.id, "What are your delivery charges?");
  const text = JSON.stringify(results);

  assert.ok(results.length > 0, "expected a match");
  assert.ok(text.includes(A_DELIVERY));
  assert.ok(!text.includes(B_DELIVERY));
  assert.ok(!text.includes(B_WARRANTY));
});

test("company B only gets its own entries (same question, same title)", async () => {
  const results = await searchCompanyKb(companyB.id, "What are your delivery charges?");
  const text = JSON.stringify(results);

  assert.ok(text.includes(B_DELIVERY));
  assert.ok(!text.includes(A_DELIVERY));
  assert.ok(!text.includes(A_TAMIL));
});

test("every returned id belongs to the asking company", async () => {
  for (const [company, query] of [
    [companyA, "delivery charges shipping warranty refund"],
    [companyB, "delivery charges shipping warranty refund"],
  ]) {
    const results = await searchCompanyKb(company.id, query);
    const ids = results.map((r) => r.id);

    const rows = await prisma.kbEntry.findMany({ where: { id: { in: ids } } });

    assert.ok(rows.every((row) => row.companyId === company.id));
  }
});

test("a topic only company B has returns nothing for company A", async () => {
  const results = await searchCompanyKb(companyA.id, "tell me about the warranty");

  assert.deepEqual(results, []);
});

test("a company without entries gets nothing and no prompt block", async () => {
  const results = await searchCompanyKb(companyEmpty.id, "delivery charges warranty");
  const context = await buildKnowledgeContext({
    companyId: companyEmpty.id,
    query: "delivery charges warranty",
  });

  assert.deepEqual(results, []);
  assert.equal(context.block, "");
});

test("inactive entries are never used", async () => {
  const results = await searchCompanyKb(companyA.id, "refund policy refunds");

  assert.ok(!JSON.stringify(results).includes(A_INACTIVE));
});

test("keywords catch synonyms the title does not contain", async () => {
  const results = await searchCompanyKb(companyA.id, "courier");

  assert.ok(JSON.stringify(results).includes(A_DELIVERY));
});

test("works for non-English text (Tamil)", async () => {
  const results = await searchCompanyKb(companyA.id, "விநியோக கட்டணம் என்ன?");

  assert.ok(JSON.stringify(results).includes(A_TAMIL));
});

test("prompt block for A never contains B's text", async () => {
  const { block, entries } = await buildKnowledgeContext({
    companyId: companyA.id,
    query: "delivery charges and warranty",
  });

  assert.ok(block.includes(A_DELIVERY));
  assert.ok(!block.includes(B_DELIVERY));
  assert.ok(!block.includes(B_WARRANTY));
  assert.ok(entries.every((entry) => entry.id !== entryB.id));
});

test("company has entries but none match -> 'do not guess' block, no entry text", async () => {
  const { block, entries } = await buildKnowledgeContext({
    companyId: companyA.id,
    query: "do you sell aeroplanes",
  });

  assert.equal(entries.length, 0);
  assert.match(block, /no entry matched/i);
  assert.ok(!block.includes(A_DELIVERY));
});

test("hostile input cannot break out of the query", async () => {
  const nasty = [
    `delivery'); DROP TABLE "KbEntry"; --`,
    `delivery & ! ( | :* ) <-> '`,
    `" OR 1=1 --`,
    `${"x".repeat(5000)} delivery`,
  ];

  for (const query of nasty) {
    const results = await searchCompanyKb(companyA.id, query);
    assert.ok(Array.isArray(results));
    assert.ok(!JSON.stringify(results).includes(B_DELIVERY));
  }

  // table still there, data intact
  assert.ok((await prisma.kbEntry.count()) >= 5);
});

test("a lookup without a valid companyId is refused (never 'all companies')", async () => {
  for (const bad of [undefined, null, 0, -1, "abc", "1 OR 1=1", NaN, 1.5, {}]) {
    await assert.rejects(() => searchCompanyKb(bad, "delivery"), /valid companyId/);
    await assert.rejects(
      () => buildKnowledgeContext({ companyId: bad, query: "delivery" }),
      /valid companyId/
    );
  }
});

// ---------------------------------------------
// ADMIN API (create / read / update / delete)
// ---------------------------------------------
test("list shows only the admin's own company", async () => {
  const res = makeRes();
  await listEntries(asAdmin(companyB), res);

  assert.equal(res.statusCode, 200);
  assert.ok(res.body.entries.length >= 2);
  assert.ok(!JSON.stringify(res.body).includes(A_DELIVERY));
  assert.ok(!JSON.stringify(res.body).includes(A_TAMIL));
  assert.equal(res.body.useKnowledgeBase, true);
});

test("company B cannot edit company A's entry (404, unchanged)", async () => {
  const res = makeRes();
  await updateEntry(
    asAdmin(companyB, {
      params: { id: String(entryA.id) },
      body: { title: "HACKED", content: "HACKED" },
    }),
    res
  );

  assert.equal(res.statusCode, 404);

  const after = await prisma.kbEntry.findUnique({ where: { id: entryA.id } });
  assert.equal(after.title, "Delivery charges");
  assert.ok(after.content.includes(A_DELIVERY));
});

test("company B cannot delete company A's entry (404, still there)", async () => {
  const res = makeRes();
  await deleteEntry(asAdmin(companyB, { params: { id: String(entryA.id) } }), res);

  assert.equal(res.statusCode, 404);
  assert.ok(await prisma.kbEntry.findUnique({ where: { id: entryA.id } }));
});

test("a companyId sent in the request body is ignored on create", async () => {
  const res = makeRes();
  await createEntry(
    asAdmin(companyB, {
      body: {
        title: "Sneaky",
        content: "Trying to plant an entry in company A",
        companyId: companyA.id,
      },
    }),
    res
  );

  assert.equal(res.statusCode, 201);

  const row = await prisma.kbEntry.findUnique({ where: { id: res.body.entry.id } });
  assert.equal(row.companyId, companyB.id);
});

test("admin can edit and delete their own entry", async () => {
  const created = makeRes();
  await createEntry(
    asAdmin(companyA, { body: { title: "Hours", content: "Open 9 to 6", category: "Info" } }),
    created
  );
  const id = created.body.entry.id;

  const updated = makeRes();
  await updateEntry(
    asAdmin(companyA, { params: { id: String(id) }, body: { content: "Open 10 to 7" } }),
    updated
  );
  assert.equal(updated.statusCode, 200);
  assert.equal(updated.body.entry.content, "Open 10 to 7");
  assert.equal(updated.body.entry.title, "Hours");

  const removed = makeRes();
  await deleteEntry(asAdmin(companyA, { params: { id: String(id) } }), removed);
  assert.equal(removed.statusCode, 200);
  assert.equal(await prisma.kbEntry.findUnique({ where: { id } }), null);
});

test("invalid input is rejected", async () => {
  for (const body of [
    {},
    { title: "No content" },
    { title: "", content: "x" },
    { title: "x".repeat(201), content: "x" },
    { title: "ok", content: "x".repeat(4001) },
    { title: 123, content: "x" },
    { title: "ok", content: "x", isActive: "yes" },
  ]) {
    const res = makeRes();
    await createEntry(asAdmin(companyA, { body }), res);
    assert.equal(res.statusCode, 400, JSON.stringify(body).slice(0, 60));
  }
});

test("deleting a company deletes its entries (cascade)", async () => {
  const temp = await makeCompany("TEMP");
  await prisma.kbEntry.create({
    data: { companyId: temp.id, title: "t", content: "c" },
  });

  await prisma.company.delete({ where: { id: temp.id } });

  assert.equal(await prisma.kbEntry.count({ where: { companyId: temp.id } }), 0);
});

// ---------------------------------------------
// SEARCH INDEX (large catalogs)
// ---------------------------------------------
test("search trigger is installed (else: npm run kb:setup-search)", async () => {
  assert.ok(await isKbSearchSetupInstalled(), "trigger missing: start the server once or run `npm run kb:setup-search`");
});

test("every entry has a search vector (filled by the trigger)", async () => {
  const missing = await prisma.$queryRaw`
    SELECT count(*)::int AS n FROM "KbEntry"
    WHERE "companyId" IN (${companyA.id}, ${companyB.id}) AND "searchVector" IS NULL`;

  assert.equal(missing[0].n, 0);
});

test("an edited entry is searchable by its NEW text, not the old", async () => {
  const entry = await prisma.kbEntry.create({
    data: { companyId: companyA.id, title: "Gift hamper", content: "OLDWORDQQ hamper of dry fruits" },
  });

  assert.ok(JSON.stringify(await searchCompanyKb(companyA.id, "oldwordqq")).includes("OLDWORDQQ"));

  await prisma.kbEntry.update({ where: { id: entry.id }, data: { content: "NEWWORDQQ hamper of dry fruits" } });

  assert.deepEqual(await searchCompanyKb(companyA.id, "oldwordqq"), []);
  assert.ok(JSON.stringify(await searchCompanyKb(companyA.id, "newwordqq")).includes("NEWWORDQQ"));

  await prisma.kbEntry.delete({ where: { id: entry.id } });
});

// ---------------------------------------------
// CSV / EXCEL IMPORT
// ---------------------------------------------
const csvFile = (text, { bom = false } = {}) => ({
  originalname: "catalog.csv",
  buffer: Buffer.from((bom ? "\ufeff" : "") + text, "utf8"),
});

const xlsxFile = (rows) => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "Sheet1");
  return { originalname: "catalog.xlsx", buffer: XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) };
};

let impA;
let impB;

const countFor = (company) => prisma.kbEntry.count({ where: { companyId: company.id } });
const findFor = (company, title) =>
  prisma.kbEntry.findFirst({ where: { companyId: company.id, title: { equals: title, mode: "insensitive" } } });

test("import: set up two companies", async () => {
  impA = await makeCompany("IMPA");
  impB = await makeCompany("IMPB");
  extraCompanies.push(impA, impB);

  // Same title in BOTH companies, different facts
  await prisma.kbEntry.create({ data: { companyId: impA.id, title: "Mysore Pak", content: "A-ORIGINAL ghee sweet Rs 300" } });
  await prisma.kbEntry.create({ data: { companyId: impB.id, title: "Mysore Pak", content: "B-ORIGINAL ghee sweet Rs 320" } });
});

test("import: preview shows what would happen and changes nothing", async () => {
  const before = await countFor(impA);

  const result = await previewImport(
    impA.id,
    csvFile("Name,Description,Price\nKaju Katli,Cashew sweet,Rs 450\nMysore Pak,New recipe,Rs 310\n"),
    "update"
  );

  assert.equal(result.totals.willCreate, 1);
  assert.equal(result.totals.willUpdate, 1);
  assert.equal(result.totals.invalid, 0);
  assert.deepEqual(result.columns.addedToAnswer, ["Price"]);
  assert.equal(await countFor(impA), before);
  assert.ok((await findFor(impA, "Mysore Pak")).content.includes("A-ORIGINAL"));
});

test("import: creates entries; other columns become 'Header: value' lines", async () => {
  const result = await applyImport(
    impA.id,
    csvFile("Name,Description,Price,Tags,Category\nKaju Katli,Cashew sweet box,Rs 450,\"cashew, barfi\",Sweets\n"),
    "skip",
    "test-admin"
  );

  assert.equal(result.created, 1);

  const row = await findFor(impA, "Kaju Katli");
  assert.equal(row.companyId, impA.id);
  assert.equal(row.category, "Sweets");
  assert.equal(row.keywords, "cashew, barfi");
  assert.ok(row.content.includes("Cashew sweet box"));
  assert.ok(row.content.includes("Price: Rs 450"));
});

test("import: new entries are searchable right away", async () => {
  const results = await searchCompanyKb(impA.id, "price of kaju katli?");

  assert.ok(JSON.stringify(results).includes("Rs 450"));
});

test("import: same title in company B is updated ONLY in B (A untouched)", async () => {
  const beforeA = await findFor(impA, "Mysore Pak");

  const result = await applyImport(
    impB.id,
    csvFile("Title,Description\nmysore pak,B-UPDATED fresh ghee sweet Rs 330\n"),
    "update"
  );

  assert.equal(result.updated, 1);
  assert.equal(result.created, 0);

  const afterB = await findFor(impB, "Mysore Pak");
  const afterA = await findFor(impA, "Mysore Pak");

  assert.ok(afterB.content.includes("B-UPDATED"));
  assert.equal(afterA.content, beforeA.content);
  assert.equal(afterA.updatedAt.getTime(), beforeA.updatedAt.getTime());
  assert.equal(await countFor(impB), 1);
});

test("import: the bulk UPDATE refuses another company's entry ids", async () => {
  const victim = await findFor(impA, "Mysore Pak");

  // company B's import is handed company A's entry id (should never happen,
  // but the SQL must not allow it even then)
  const changed = await bulkUpdateEntries(
    prisma,
    impB.id,
    [{ id: victim.id, data: { title: "HACKED", content: "HACKED" } }],
    true
  );

  assert.equal(Number(changed), 0);

  const after = await prisma.kbEntry.findUnique({ where: { id: victim.id } });
  assert.equal(after.title, victim.title);
  assert.equal(after.content, victim.content);
});

test("import: updated entries are searched by their new text", async () => {
  assert.ok(JSON.stringify(await searchCompanyKb(impB.id, "fresh ghee sweet")).includes("B-UPDATED"));
  assert.deepEqual(await searchCompanyKb(impB.id, "A-ORIGINAL"), []);
});

test("import: update keeps category/keywords/active when the file has no such columns", async () => {
  // (the earlier import stored the title as written in the file, so look it up ignoring case)
  const target = await findFor(impB, "Mysore Pak");
  await prisma.kbEntry.update({
    where: { id: target.id },
    data: { category: "Sweets", keywords: "ghee sweet", isActive: false },
  });

  await applyImport(impB.id, csvFile("Title,Description\nMysore Pak,Again updated\n"), "update");

  const row = await findFor(impB, "Mysore Pak");
  assert.equal(row.content, "Again updated");
  assert.equal(row.category, "Sweets");
  assert.equal(row.keywords, "ghee sweet");
  assert.equal(row.isActive, false);
});

test("import: 'skip' mode leaves existing entries as they are", async () => {
  const before = await findFor(impA, "Mysore Pak");

  const result = await applyImport(impA.id, csvFile("Title,Description\nMysore Pak,SHOULD NOT APPEAR\n"), "skip");

  assert.equal(result.skipped, 1);
  assert.equal(result.updated, 0);
  assert.equal((await findFor(impA, "Mysore Pak")).content, before.content);
});

test("import: bad rows are reported, good rows still import", async () => {
  const text = [
    "Title,Description,Active",
    "Good One,Fine entry,yes",
    ",Missing title,yes",
    "No Description,,yes",
    "Bad Active,Some text,maybe",
    `${"T".repeat(201)},Too long title,yes`,
    "Inactive One,Hidden entry,no",
    ",,",
  ].join("\n");

  const preview = await previewImport(impA.id, csvFile(text), "update");

  assert.equal(preview.totals.invalid, 4);
  assert.equal(preview.totals.blankRows, 1);
  assert.equal(preview.totals.willCreate, 2);
  // exact spreadsheet row numbers (row 1 = header, row 8 = the blank line)
  assert.deepEqual(preview.errors.map((e) => e.row), [3, 4, 5, 6]);
  assert.ok(preview.errors.every((e) => e.message));

  const result = await applyImport(impA.id, csvFile(text), "update");
  assert.equal(result.created, 2);

  assert.equal((await findFor(impA, "Good One")).isActive, true);
  assert.equal((await findFor(impA, "Inactive One")).isActive, false);
  assert.equal(await findFor(impA, "Bad Active"), null);
});

test("import: repeated title inside the file -> one entry, the last row wins", async () => {
  const text = "Title,Description\nDup Item,first\ndup item,second\n";

  const preview = await previewImport(impA.id, csvFile(text), "update");
  assert.equal(preview.totals.duplicatesInFile, 1);

  await applyImport(impA.id, csvFile(text), "update");

  assert.equal(await prisma.kbEntry.count({ where: { companyId: impA.id, title: { equals: "dup item", mode: "insensitive" } } }), 1);
  assert.equal((await findFor(impA, "Dup Item")).content, "second");
});

test("import: Tamil text survives CSV with and without BOM, and Excel", async () => {
  const tamil = "Title,Description\nகாஜு கட்லி,இனிப்பு பெட்டி ரூ 450\n";

  await applyImport(impB.id, csvFile(tamil, { bom: true }), "update");
  await applyImport(impB.id, csvFile(tamil.replace("காஜு", "பாதாம்"), { bom: false }), "update");
  await applyImport(impB.id, xlsxFile([["Title", "Description"], ["மைசூர் பாக்", "நெய் இனிப்பு"]]), "update");

  assert.ok(await findFor(impB, "காஜு கட்லி"));
  assert.ok(await findFor(impB, "பாதாம் கட்லி"));
  assert.ok(await findFor(impB, "மைசூர் பாக்"));

  assert.ok(JSON.stringify(await searchCompanyKb(impB.id, "கட்லி விலை")).includes("காஜு கட்லி"));
});

test("import: Excel (.xlsx) files work; numbers and codes stay as shown", async () => {
  const result = await applyImport(
    impA.id,
    xlsxFile([
      ["Product", "Details", "Price", "SKU"],
      ["Rose Milk", "Chilled drink", 120, "007"],
    ]),
    "update"
  );

  assert.equal(result.created, 1);

  const row = await findFor(impA, "Rose Milk");
  assert.ok(row.content.includes("Price: 120"));
  assert.ok(row.content.includes("SKU: 007"), "leading zeros must be kept");
});

test("import: files that cannot be used are refused with a clear message", async () => {
  const cases = [
    [{ originalname: "x.csv", buffer: Buffer.alloc(0) }, /choose a CSV or Excel/],
    [csvFile("Title,Description\n"), /empty/],
    [csvFile("Foo,Bar\n1,2\n"), /No title column/],
    [csvFile(`Title,Description\n${Array.from({ length: 51 }, (_, i) => `Item ${i},x`).join("\n")}\n`), /more than 50 rows/],
  ];

  for (const [file, pattern] of cases) {
    await assert.rejects(() => previewImport(impA.id, file, "update"), (error) => {
      assert.ok(error instanceof ImportError);
      assert.equal(error.statusCode, 400);
      assert.match(error.message, pattern);
      return true;
    });
  }

  await assert.rejects(() => previewImport(impA.id, csvFile("Title,Description\na,b\n"), "wipe"), /Mode must be/);
});

test("import: over the entry limit -> refused, and NOTHING is imported", async () => {
  const full = await makeCompany("FULL");
  extraCompanies.push(full);

  await prisma.kbEntry.createMany({
    data: Array.from({ length: 195 }, (_, i) => ({ companyId: full.id, title: `Existing ${i}`, content: "x" })),
  });

  const text = `Title,Description\n${Array.from({ length: 10 }, (_, i) => `Extra ${i},y`).join("\n")}\n`;

  const preview = await previewImport(full.id, csvFile(text), "update");
  assert.equal(preview.capacity.overLimit, true);
  assert.equal(preview.capacity.limit, 200);

  await assert.rejects(() => applyImport(full.id, csvFile(text), "update"), /limit is 200/);
  assert.equal(await countFor(full), 195);

  // 5 new rows still fit exactly
  const ok = await applyImport(full.id, csvFile(`Title,Description\n${Array.from({ length: 5 }, (_, i) => `Fits ${i},y`).join("\n")}\n`), "update");
  assert.equal(ok.created, 5);
  assert.equal(await countFor(full), 200);
});

test("import: the API handlers use the admin's company and validate the mode", async () => {
  const res1 = makeRes();
  await previewEntries(asAdmin(impA, { file: csvFile("Title,Description\nApi Item,via api\n"), body: { mode: "update" } }), res1);
  assert.equal(res1.statusCode, 200);
  assert.equal(res1.body.totals.willCreate, 1);

  const res2 = makeRes();
  await importEntries(
    asAdmin(impA, { file: csvFile("Title,Description\nApi Item,via api\n"), body: { mode: "update", companyId: impB.id } }),
    res2
  );
  assert.equal(res2.statusCode, 200);
  assert.ok(await findFor(impA, "Api Item"), "lands in the admin's company");
  assert.equal(await findFor(impB, "Api Item"), null, "a companyId in the body is ignored");

  const res3 = makeRes();
  await importEntries(asAdmin(impA, { file: csvFile("Title,Description\nz,z\n"), body: { mode: "nope" } }), res3);
  assert.equal(res3.statusCode, 400);

  const res4 = makeRes();
  await importEntries(asAdmin(impA, { body: {} }), res4);
  assert.equal(res4.statusCode, 400);
});

// ---------------------------------------------
// UPLOAD MIDDLEWARE (real HTTP)
// ---------------------------------------------
test("upload: accepts csv/xlsx, rejects other types and files over 5 MB", async () => {
  const app = express();
  app.post("/up", kbImportUpload, (req, res) => res.json({ ok: true, size: req.file.size, mode: req.body.mode }));

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });

  const url = `http://127.0.0.1:${server.address().port}/up`;
  const send = async (name, content, mode = "update") => {
    const form = new FormData();
    form.append("mode", mode);
    form.append("file", new Blob([content]), name);
    const response = await fetch(url, { method: "POST", body: form });
    return { status: response.status, body: await response.json() };
  };

  try {
    const ok = await send("a.csv", "Title,Description\na,b\n");
    assert.equal(ok.status, 200);
    assert.equal(ok.body.mode, "update");

    const wrongType = await send("a.exe", "MZ");
    assert.equal(wrongType.status, 400);
    assert.match(wrongType.body.message, /\.csv or \.xlsx/);

    const tooBig = await send("big.csv", Buffer.alloc(5 * 1024 * 1024 + 10, 97));
    assert.equal(tooBig.status, 400);
    assert.match(tooBig.body.message, /too large/);
  } finally {
    server.close();
  }
});

// ---------------------------------------------
// DELETE ALL (this company only)
// ---------------------------------------------
test("delete all: needs the typed phrase, and only touches the admin's company", async () => {
  const noPhrase = makeRes();
  await deleteAllEntries(asAdmin(impB, { body: {} }), noPhrase);
  assert.equal(noPhrase.statusCode, 400);

  const wrong = makeRes();
  await deleteAllEntries(asAdmin(impB, { body: { confirm: "yes" } }), wrong);
  assert.equal(wrong.statusCode, 400);

  const beforeA = await countFor(impA);
  const beforeB = await countFor(impB);
  assert.ok(beforeA > 0 && beforeB > 0);

  const ok = makeRes();
  await deleteAllEntries(asAdmin(impB, { body: { confirm: "DELETE ALL", companyId: impA.id } }), ok);

  assert.equal(ok.statusCode, 200);
  assert.equal(ok.body.deleted, beforeB);
  assert.equal(await countFor(impB), 0);
  assert.equal(await countFor(impA), beforeA, "company A keeps everything");
});

// ---------------------------------------------
// CAMPAIGN / TAGGED-REPLY CONTEXT  ("how much is this?")
// ---------------------------------------------
// getAutoReply runs for real; only the AI HTTP call is replaced, so the tests
// can read exactly what the AI was told.
const realAxiosPost = axios.post;
const aiCalls = [];

axios.post = async (url, body) => {
  aiCalls.push(body);
  return {
    data: {
      choices: [{ message: { content: "Test reply" } }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    },
  };
};

test.after(() => {
  axios.post = realAxiosPost;
});

const promptOf = (call) => call.messages[0].content;

const ask = async (conversation) => {
  const before = aiCalls.length;
  const result = await getAutoReply(conversation.id);

  assert.equal(result.success, true, result.error);
  assert.equal(aiCalls.length, before + 1, "the AI should be called exactly once");

  return { result, prompt: promptOf(aiCalls[aiCalls.length - 1]) };
};

const minutes = (n) => new Date(Date.now() - n * 60 * 1000);
const hours = (n) => minutes(n * 60);

// rows: [{ sender, content, id?, tag?, at }]
const makeChat = async (company, rows) => {
  const conversation = await prisma.conversation.create({
    data: { companyId: company.id, phone: `9${String(Date.now()).slice(-8)}${Math.floor(Math.random() * 90 + 10)}` },
  });

  for (const row of rows) {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: row.sender,
        content: row.content,
        metaMessageId: row.id ? `${RUN}-${row.id}` : undefined,
        replyToMetaId: row.tag ? `${RUN}-${row.tag}` : undefined,
        createdAt: row.at,
      },
    });
  }

  return conversation;
};

const CAMPAIGN_KAJU = "Diwali offer! Kaju Katli Gift Box at a special price. Order today.";
const CAMPAIGN_MYSORE = "Festival special: Mysore Pak Sweet Box, fresh ghee sweets.";

let ctxA;
let ctxB;
let ctxNone;
let ctxOff;
let chatForeign; // company B's chat, holds a message id company A must never reach

test("context: set up companies, entries and AI settings", async () => {
  ctxA = await makeCompany("CTXA");
  ctxB = await makeCompany("CTXB");
  ctxNone = await makeCompany("CTXNONE");
  ctxOff = await makeCompany("CTXOFF");
  extraCompanies.push(ctxA, ctxB, ctxNone, ctxOff);

  for (const company of [ctxA, ctxB, ctxNone, ctxOff]) {
    await prisma.aiSettings.create({
      data: { companyId: company.id, isEnabled: true, useKnowledgeBase: company !== ctxOff },
    });
  }

  await prisma.kbEntry.createMany({
    data: [
      { companyId: ctxA.id, title: "Kaju Katli Gift Box", keywords: "kaju katli, cashew", content: "CTXA_KAJU Price Rs 450 for a 500g box." },
      { companyId: ctxA.id, title: "Mysore Pak Sweet Box", keywords: "mysore pak", content: "CTXA_MYSORE Price Rs 300 for a 500g box." },
      { companyId: ctxA.id, title: "Delivery charges", content: "CTXA_DELIVERY Delivery inside the city is Rs 40." },
      // same title in company B, different facts
      { companyId: ctxB.id, title: "Kaju Katli Gift Box", keywords: "kaju katli", content: "CTXB_KAJU Price Rs 999 for a 500g box." },
      { companyId: ctxOff.id, title: "Kaju Katli Gift Box", keywords: "kaju katli", content: "CTXOFF_KAJU Price Rs 111." },
    ],
  });

  chatForeign = await makeChat(ctxB, [
    { sender: "AGENT", content: "Only for B: Kaju Katli Gift Box Rs 999 CTXB_ONLY_TEXT", id: "B-ONLY", at: minutes(90) },
  ]);
});

test("context: findReplyTag picks the latest tag in the customer's latest burst", () => {
  const msg = (sender, tag) => ({ sender, replyToMetaId: tag });

  assert.equal(findReplyTag([msg("AGENT"), msg("CUSTOMER", "x"), msg("CUSTOMER")]), "x");
  assert.equal(findReplyTag([msg("AGENT"), msg("CUSTOMER", "x"), msg("CUSTOMER", "y")]), "y");
  assert.equal(findReplyTag([msg("CUSTOMER", "old"), msg("AGENT"), msg("CUSTOMER")]), null, "an old tag is not used");
  assert.equal(findReplyTag([]), null);
});

test("context: a vague question after a campaign finds the campaign's product (AI replies in between are skipped)", async () => {
  const chat = await makeChat(ctxA, [
    { sender: "AGENT", content: CAMPAIGN_KAJU, at: minutes(60) },
    { sender: "BOT", content: "Thanks for your interest, how can I help?", at: minutes(50) },
    { sender: "CUSTOMER", content: "how much is this?", at: minutes(1) },
  ]);

  const { result, prompt } = await ask(chat);

  assert.equal(result.kbContext, "recent");
  assert.ok(prompt.includes("CTXA_KAJU"), "the campaign's product entry is given to the AI");
  assert.ok(prompt.includes("most recent message the business sent"));
  assert.ok(!prompt.includes("CTXB_KAJU"), "company B's entry never appears");

  // best match first
  const mysore = prompt.indexOf("CTXA_MYSORE");
  assert.ok(mysore === -1 || prompt.indexOf("CTXA_KAJU") < mysore, "the campaign's own product ranks first");
});

test("context: a tagged older campaign beats the latest campaign", async () => {
  const chat = await makeChat(ctxA, [
    { sender: "AGENT", content: CAMPAIGN_MYSORE, id: "OLDCAMP", at: hours(30) },
    { sender: "AGENT", content: CAMPAIGN_KAJU, id: "NEWCAMP", at: minutes(60) },
    { sender: "CUSTOMER", content: "price?", tag: "OLDCAMP", at: minutes(1) },
  ]);

  const { result, prompt } = await ask(chat);

  assert.equal(result.kbContext, "reply");
  assert.ok(prompt.includes("replying to this earlier message"));
  assert.ok(prompt.includes("Mysore Pak Sweet Box, fresh ghee"), "the tagged message is quoted");
  assert.ok(prompt.includes("CTXA_MYSORE"));

  const kaju = prompt.indexOf("CTXA_KAJU");
  assert.ok(kaju === -1 || prompt.indexOf("CTXA_MYSORE") < kaju, "the tagged product ranks first");
});

test("context: a tag pointing at ANOTHER company's message is ignored", async () => {
  const chat = await makeChat(ctxA, [
    { sender: "AGENT", content: CAMPAIGN_KAJU, at: minutes(60) },
    { sender: "CUSTOMER", content: "how much is this?", tag: "B-ONLY", at: minutes(1) },
  ]);

  const { result, prompt } = await ask(chat);

  assert.ok(!prompt.includes("CTXB_ONLY_TEXT"), "text of company B's chat never reaches company A's prompt");
  assert.ok(!prompt.includes("CTXB_KAJU"));
  assert.ok(!prompt.includes("replying to this earlier message"));
  assert.equal(result.kbContext, "recent", "falls back to A's own latest campaign");
  assert.ok(prompt.includes("CTXA_KAJU"));

  // and directly
  const direct = await resolveReplyContext({ conversationId: chat.id, replyToMetaId: `${RUN}-B-ONLY` });
  assert.ok(!JSON.stringify(direct).includes("CTXB_ONLY_TEXT"));
});

test("context: a specific question does not pull in the campaign", async () => {
  const chat = await makeChat(ctxA, [
    { sender: "AGENT", content: CAMPAIGN_KAJU, at: minutes(60) },
    { sender: "CUSTOMER", content: "do you deliver to Chennai city centre", at: minutes(1) },
  ]);

  const { result, prompt } = await ask(chat);

  assert.equal(result.kbContext, null);
  assert.ok(prompt.includes("CTXA_DELIVERY"), "answered from its own words");
  assert.ok(!prompt.includes("most recent message the business sent"));
  assert.ok(!prompt.includes("CTXA_KAJU"), "the campaign product is not mixed in");
});

test("context: a tagged message is always shown to the AI, even for a longer question", async () => {
  const chat = await makeChat(ctxA, [
    { sender: "AGENT", content: CAMPAIGN_MYSORE, id: "TAGGED2", at: minutes(60) },
    { sender: "CUSTOMER", content: "can you deliver this to my home tomorrow morning", tag: "TAGGED2", at: minutes(1) },
  ]);

  const { prompt } = await ask(chat);

  assert.ok(prompt.includes("replying to this earlier message"));
  assert.ok(prompt.includes("Mysore Pak Sweet Box, fresh ghee"));

  // the question says enough on its own, so the tagged product is not searched for
  assert.ok(prompt.includes("CTXA_DELIVERY"));
  assert.ok(!prompt.includes("CTXA_MYSORE"));
});

test("context: the search itself only uses the earlier message when the question is vague", async () => {
  const context = { text: CAMPAIGN_KAJU, source: "recent" };

  const vague = await buildKnowledgeContext({ companyId: ctxA.id, query: "how much is this?", context });
  assert.equal(vague.contextUsed, "recent");
  assert.ok(vague.entries.some((entry) => entry.content.includes("CTXA_KAJU")));

  const specific = await buildKnowledgeContext({
    companyId: ctxA.id,
    query: "do you deliver to Chennai city centre",
    context,
  });
  assert.equal(specific.contextUsed, null);
  assert.ok(!specific.entries.some((entry) => entry.content.includes("CTXA_KAJU")));

  // company B asking with the same words only ever gets B's entries
  const other = await buildKnowledgeContext({ companyId: ctxB.id, query: "how much is this?", context });
  assert.ok(other.entries.every((entry) => entry.content.includes("CTXB_")));
  assert.ok(!JSON.stringify(other).includes("CTXA_"));
});

test("context: vague message, nothing recent from the business -> the AI is told to ask which product", async () => {
  const chat = await makeChat(ctxA, [
    { sender: "AGENT", content: CAMPAIGN_KAJU, at: hours(100) }, // older than the 72 hour window
    { sender: "CUSTOMER", content: "how much is this?", at: minutes(1) },
  ]);

  const { result, prompt } = await ask(chat);

  assert.equal(result.kbContext, null);
  assert.match(prompt, /no entry matched/i);
  assert.match(prompt, /Ask one short question about which product or topic they mean/);
  assert.ok(!prompt.includes("CTXA_"), "no entry text is offered");
  assert.equal(await resolveReplyContext({ conversationId: chat.id }), null);
});

test("context: a company without entries behaves exactly as before", async () => {
  const chat = await makeChat(ctxNone, [
    { sender: "AGENT", content: CAMPAIGN_KAJU, at: minutes(60) },
    { sender: "CUSTOMER", content: "how much is this?", at: minutes(1) },
  ]);

  const { result, prompt } = await ask(chat);

  assert.equal(result.kbContext, null);
  assert.ok(!prompt.includes("Company knowledge base"));
  assert.ok(!prompt.includes("most recent message the business sent"));
});

test("context: with the knowledge base switched off nothing is added", async () => {
  const chat = await makeChat(ctxOff, [
    { sender: "AGENT", content: CAMPAIGN_KAJU, at: minutes(60) },
    { sender: "CUSTOMER", content: "how much is this?", at: minutes(1) },
  ]);

  const { result, prompt } = await ask(chat);

  assert.equal(result.kbContext, null);
  assert.ok(!prompt.includes("Company knowledge base"));
  assert.ok(!prompt.includes("CTXOFF_KAJU"));
});

test("context: the tag is saved with the customer's message", async () => {
  const chat = await makeChat(ctxA, [{ sender: "AGENT", content: CAMPAIGN_KAJU, id: "SAVETAG", at: minutes(10) }]);

  const saved = await saveIncomingMessage(chat.id, "tell me more", {
    metaMessageId: `${RUN}-INCOMING1`,
    replyToMetaId: `${RUN}-SAVETAG`,
  });
  assert.equal(saved.replyToMetaId, `${RUN}-SAVETAG`);

  const plain = await saveIncomingMessage(chat.id, "hello", { metaMessageId: `${RUN}-INCOMING2` });
  assert.equal(plain.replyToMetaId, null, "messages without a tag stay without one");
});
