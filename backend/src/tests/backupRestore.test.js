// Restore-from-backup tests.
//
// "Tested on a copy": these tests never touch a real database. They run the
// REAL backup + restore code against an in-memory COPY of a company's data
// (strict mode = foreign keys, unique keys, cascades and transaction rollback
// behave like Postgres). Two companies are seeded so we can prove that a
// restore only ever affects the company that asked for it.
//
// Run:  node --test tests/backupRestore.test.js

require("./helpers/env");

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const zlib = require("zlib");

const { createDb } = require("./helpers/fakePrisma");

const SRC = path.resolve(__dirname, "../src");
const db = createDb();
const files = new Map(); // fake storage bucket
const auditCalls = [];

// ---- replace the outside world ---------------------------------------------
const stub = (relPath, exports) => {
  const file = require.resolve(path.join(SRC, relPath));
  require.cache[file] = { id: file, filename: file, loaded: true, exports, children: [], paths: [] };
};
const noop = async () => undefined;

stub("config/prisma.js", db);
stub("services/backupStorage.js", {
  XLSX_TYPE: "application/test",
  saveBackupFile: async (companyKey, fileName, buffer) => {
    const p = `mem:${companyKey}/${fileName}`;
    files.set(p, Buffer.from(buffer));
    return p;
  },
  readBackupFile: async (p) => files.get(p) || null,
  deleteBackupFile: async (p) => { files.delete(p); },
});
// The readable Excel file is not what is being tested here.
stub("services/backupExcelService.js", { buildBackupExcelBuffer: () => Buffer.from("fake-xlsx") });
stub("services/auditLogService.js", {
  logAction: async (args) => { auditCalls.push(args); },
  logDirect: noop,
});

const { createManualBackup } = require(path.join(SRC, "services/backupService.js"));
const { TABLES } = require(path.join(SRC, "services/backupSnapshot.js"));
const restoreService = require(path.join(SRC, "services/backupRestoreService.js"));
const { restoreBackup, previewRestore, RestoreError, checkSnapshot, planRestore } = restoreService;

let jwt = null;
try { jwt = require("jsonwebtoken"); } catch { /* controller tests are skipped without it */ }

// ---- test data ---------------------------------------------------------------
const A = 1; // the company that restores
const B = 2; // a different company that must never be affected
const ADMIN_A = "u-admin-a";
const t0 = (n) => new Date(Date.UTC(2026, 10, 1, 10, n, 0));

function seedWorld() {
  db.reset();
  files.clear();
  auditCalls.length = 0;
  db.strict = false; // seed without constraint noise, then switch on

  db.insert("company", { id: A, companyId: "COM-A", companyName: "Acme", status: "ACTIVE", expiryDate: new Date(Date.now() + 1e10) });
  db.insert("company", { id: B, companyId: "COM-B", companyName: "Bravo", status: "ACTIVE", expiryDate: new Date(Date.now() + 1e10) });

  [
    [ADMIN_A, A, "ADMIN"], ["u-a1", A, "USER"], ["u-a2", A, "USER"],
    ["u-admin-b", B, "ADMIN"], ["u-b1", B, "USER"],
  ].forEach(([id, companyId, role]) =>
    db.insert("user", { id, companyId, role, name: id, email: `${id}@x.com`, password: "hash", status: "ACTIVE" })
  );

  db.insert("whatsAppAccount", { id: 1, companyId: A });
  db.insert("whatsAppAccount", { id: 2, companyId: B });
  db.insert("service", { id: "svc-a", companyId: A, name: "Design" });
  db.insert("service", { id: "svc-b", companyId: B, name: "Design" });
  db.insert("integration", { id: 1, companyId: A });
  db.insert("template", { id: "tpl-a", companyId: A, name: "welcome", language: "en_US", metaTemplateId: "meta-a" });
  db.insert("template", { id: "tpl-b", companyId: B, name: "welcome", language: "en_US", metaTemplateId: "meta-b" });

  // ----- company A -----
  db.insert("customer", { id: "c1", companyId: A, name: "Ravi", phone: "9111", userId: "u-a1", status: "ACTIVE", createdAt: t0(1), updatedAt: t0(1) });
  db.insert("customer", { id: "c2", companyId: A, name: "Indira", phone: "9222", userId: "u-a2", status: "ACTIVE", createdAt: t0(2), updatedAt: t0(2) });
  db.insert("customer", { id: "c3", companyId: A, name: "Kumar", phone: "9333", userId: ADMIN_A, status: "ACTIVE", createdAt: t0(3), updatedAt: t0(3) });
  db.insert("conversation", { id: "conv1", companyId: A, customerId: "c1", whatsappAccountId: 1, phone: "9111", status: "OPEN", channel: "WHATSAPP", createdAt: t0(1), updatedAt: t0(5) });
  db.insert("conversation", { id: "conv2", companyId: A, customerId: "c2", whatsappAccountId: 1, phone: "9222", status: "OPEN", channel: "WHATSAPP", createdAt: t0(2), updatedAt: t0(6) });
  db.insert("conversation", { id: "conv3", companyId: A, customerId: null, contactName: "Facebook user 1", status: "OPEN", channel: "MESSENGER", createdAt: t0(3), updatedAt: t0(7) });
  [
    ["m1", "conv1", "Hello", "CUSTOMER", "wamid.A1", null],
    ["m2", "conv1", "Hi Ravi", "AGENT", "wamid.A2", { type: "quick_reply", items: ["Yes", "No"] }],
    ["m3", "conv2", "Price?", "CUSTOMER", "wamid.A3", null],
    ["m4", "conv3", "Demo please", "CUSTOMER", null, null],
    ["m5", "conv3", "Sure", "BOT", null, null],
  ].forEach(([id, conversationId, content, sender, metaMessageId, buttons], i) =>
    db.insert("message", { id, conversationId, content, sender, messageType: "TEXT", status: "SENT", metaMessageId, ...(buttons ? { buttons } : {}), createdAt: t0(10 + i), updatedAt: t0(10 + i) })
  );
  db.insert("lead", { id: 1, companyId: A, name: "Malar", phone: "9876", status: "NEW", isConverted: false, assignedToId: "u-a1", createdAt: t0(1), updatedAt: t0(1) });
  db.insert("lead", { id: 2, companyId: A, name: "Gopika", phone: "9877", status: "NEW", isConverted: false, assignedToId: null, createdAt: t0(2), updatedAt: t0(2) });
  db.insert("leadWorkNote", { id: 1, leadId: 1, employeeId: "u-a1", note: "Called, interested", createdAt: t0(3), updatedAt: t0(3) });
  db.insert("campaign", { id: "camp1", companyId: A, name: "Diwali", type: "ANNOUNCEMENT", status: "COMPLETED", templateId: "tpl-a", whatsappAccountId: 1, createdById: ADMIN_A, totalRecipients: 2, sentCount: 2, createdAt: t0(4), updatedAt: t0(4), scheduledAt: t0(30) });
  db.insert("campaignRecipient", { id: "cr1", campaignId: "camp1", customerId: "c1", status: "SENT", sentAt: t0(31), createdAt: t0(4) });
  db.insert("campaignRecipient", { id: "cr2", campaignId: "camp1", customerId: "c2", status: "FAILED", failedAt: t0(31), createdAt: t0(4) });
  db.insert("templateRecipient", { id: "tr1", templateId: "tpl-a", customerId: "c1", status: "SENT", sentAt: t0(20), createdAt: t0(20), updatedAt: t0(20) });
  db.insert("deal", { id: "d1", companyId: A, title: "Website", value: 5000, stage: "LEAD", customerId: "c1", createdById: ADMIN_A, assignedToId: "u-a1", createdAt: t0(5), updatedAt: t0(5) });
  db.insert("dealActivity", { id: "da1", dealId: "d1", type: "NOTE", note: "Sent quote", createdById: ADMIN_A, createdAt: t0(6) });
  db.insert("task", { id: "t1", companyId: A, title: "Call back", status: "TODO", priority: "HIGH", dueDate: t0(50), createdById: ADMIN_A, assignedToId: "u-a1", createdAt: t0(7), updatedAt: t0(7) });
  db.insert("taskWorkNote", { id: "tw1", taskId: "t1", employeeId: "u-a1", note: "Left voicemail", createdAt: t0(8), updatedAt: t0(8) });
  db.insert("ticket", { id: "tk1", companyId: A, title: "Not working", status: "OPEN", priority: "MEDIUM", customerId: "c2", createdById: ADMIN_A, assignedToId: null, createdAt: t0(9), updatedAt: t0(9) });
  db.insert("ticketWorkNote", { id: "tkw1", ticketId: "tk1", employeeId: ADMIN_A, note: "Looking into it", createdAt: t0(9), updatedAt: t0(9) });
  db.insert("customerService", { customerId: "c1", serviceId: "svc-a", createdAt: t0(1) });
  db.insert("purchase", { id: 1, companyId: A, customerId: "c1", integrationId: 1, amount: 999, currency: "INR", status: "PAID", purchaseDate: t0(12), createdAt: t0(12), updatedAt: t0(12) });
  db.insert("proposal", { id: "pr1", companyId: A, createdById: ADMIN_A, customerId: "c1", proposalNumber: "P-1", title: "Proposal", items: [] });

  // ----- company B (must never change) -----
  db.insert("customer", { id: "cb1", companyId: B, name: "Bala", phone: "9111", userId: "u-b1", status: "ACTIVE", createdAt: t0(1), updatedAt: t0(1) });
  db.insert("conversation", { id: "convb1", companyId: B, customerId: "cb1", whatsappAccountId: 2, phone: "9111", status: "OPEN", channel: "WHATSAPP", createdAt: t0(1), updatedAt: t0(1) });
  db.insert("message", { id: "mb1", conversationId: "convb1", content: "Hi B", sender: "CUSTOMER", messageType: "TEXT", status: "SENT", metaMessageId: "wamid.B1", createdAt: t0(1), updatedAt: t0(1) });
  db.insert("lead", { id: 3, companyId: B, name: "B lead", status: "NEW", isConverted: false, assignedToId: "u-b1", createdAt: t0(1), updatedAt: t0(1) });
  db.insert("deal", { id: "db1", companyId: B, title: "B deal", value: 1, stage: "LEAD", customerId: "cb1", createdById: "u-admin-b", createdAt: t0(1), updatedAt: t0(1) });
  db.insert("task", { id: "tb1", companyId: B, title: "B task", status: "TODO", priority: "LOW", createdById: "u-admin-b", assignedToId: "u-b1", createdAt: t0(1), updatedAt: t0(1) });
  db.insert("ticket", { id: "tkb1", companyId: B, title: "B ticket", status: "OPEN", priority: "LOW", customerId: "cb1", createdById: "u-admin-b", createdAt: t0(1), updatedAt: t0(1) });
  db.insert("purchase", { id: 2, companyId: B, customerId: "cb1", amount: 5, currency: "INR", status: "PAID", purchaseDate: t0(1), createdAt: t0(1), updatedAt: t0(1) });

  db.strict = true;
}

// Everything restorable that belongs to one company, in a stable order.
async function dump(companyId) {
  const out = {};
  for (const table of TABLES) {
    const rows = await db[table.model].findMany({ where: table.where(companyId) });
    out[table.key] = rows
      .map((row) => {
        // The fake adds createdAt/updatedAt/id to every row; real tables such
        // as campaignRecipient or customerService do not have all of them.
        const copy = { ...row };
        for (const col of ["createdAt", "updatedAt"]) {
          if (!table.dates.includes(col)) delete copy[col];
        }
        if (table.key === "customerServices") delete copy.id;
        return copy;
      })
      .sort((x, y) => JSON.stringify(x).localeCompare(JSON.stringify(y)));
  }
  return out;
}

// Temporarily replace a method of the fake DB; always puts it back.
async function withPatched(object, method, replacement, body) {
  const original = object[method];
  object[method] = replacement;
  try {
    return await body();
  } finally {
    object[method] = original;
  }
}

const makeBackup = async (companyId = A, userId = ADMIN_A, options = {}) => {
  const { backup } = await createManualBackup(companyId, userId, options);
  return backup;
};

// Delete a company's CRM data the way a person deleting everything would.
async function wipe(companyId) {
  for (const table of [...TABLES].reverse()) {
    await db[table.model].deleteMany({ where: table.where(companyId) });
  }
}

const restoreAs = (backupId, companyId = A, requestedById = ADMIN_A) =>
  restoreBackup({ companyId, backupId, requestedById });

const rejects = (promise, status, pattern) =>
  assert.rejects(promise, (err) => {
    assert.ok(err instanceof RestoreError, `expected RestoreError, got ${err && err.stack}`);
    assert.equal(err.status, status);
    if (pattern) assert.match(err.message, pattern);
    return true;
  });

//////////////////////////////////////////////////////
// BACKUP SIDE
//////////////////////////////////////////////////////

test("a new backup stores a restorable snapshot next to the Excel file", async () => {
  seedWorld();
  const backup = await makeBackup();

  assert.equal(backup.status, "COMPLETED");
  assert.ok(backup.storagePath, "excel file reference is kept");
  assert.ok(backup.snapshotPath, "snapshot reference is saved");
  assert.ok(files.has(backup.snapshotPath), "snapshot file exists in storage");

  const snapshot = JSON.parse(zlib.gunzipSync(files.get(backup.snapshotPath)).toString());
  assert.equal(snapshot.company.id, A);
  assert.equal(snapshot.tables.customers.length, 3);
  assert.equal(snapshot.tables.messages.length, 5);
});

test("the snapshot never contains another company's rows or any password", async () => {
  seedWorld();
  const backup = await makeBackup();
  const text = zlib.gunzipSync(files.get(backup.snapshotPath)).toString();
  const snapshot = JSON.parse(text);

  for (const table of TABLES) {
    if (!table.direct) continue;
    snapshot.tables[table.key].forEach((r) => assert.equal(r.companyId, A, `${table.key} row of another company`));
  }
  assert.ok(!text.includes("Bala") && !text.includes("wamid.B1") && !text.includes("cb1"));
  assert.ok(!text.includes("hash"), "no password hashes");
  assert.equal(snapshot.tables.users, undefined);
});

//////////////////////////////////////////////////////
// RESTORE - HAPPY PATH
//////////////////////////////////////////////////////

test("restore brings back deleted data and undoes later changes (exact copy of the backup)", async () => {
  seedWorld();
  const before = await dump(A);
  const backup = await makeBackup();

  // "mistakes": delete everything, then add some unrelated new data
  await wipe(A);
  await db.customer.createMany({ data: [{ id: "new1", companyId: A, name: "After backup", phone: "9000", userId: ADMIN_A, status: "ACTIVE" }] });
  assert.equal((await db.customer.count({ where: { companyId: A } })), 1);

  const result = await restoreAs(backup.id);

  assert.deepStrictEqual(await dump(A), before, "company A is exactly as it was at backup time");
  assert.equal(result.summary.restored.customers, 3);
  assert.equal(result.summary.restored.messages, 5);
  assert.ok(result.safetyBackupId);
});

test("restore also undoes edits and removes records created after the backup", async () => {
  seedWorld();
  const before = await dump(A);
  const backup = await makeBackup();

  await db.lead.update({ where: { id: 1 }, data: { name: "WRONG", status: "LOST" } });
  await db.message.deleteMany({ where: { id: "m3" } });
  await db.customer.createMany({ data: [{ id: "new1", companyId: A, name: "Extra", phone: "9444", userId: ADMIN_A, status: "ACTIVE" }] });

  await restoreAs(backup.id);

  assert.deepStrictEqual(await dump(A), before);
  assert.equal(db.get("customer", "new1"), null);
});

test("Json columns and dates survive the round trip", async () => {
  seedWorld();
  const backup = await makeBackup();
  await wipe(A);
  await restoreAs(backup.id);

  const m2 = db.get("message", "m2");
  assert.deepStrictEqual(m2.buttons, { type: "quick_reply", items: ["Yes", "No"] });
  assert.ok(m2.createdAt instanceof Date);
  assert.equal(m2.createdAt.getTime(), t0(11).getTime());
  assert.equal(db.get("task", "t1").dueDate.getTime(), t0(50).getTime());
});

test("restore writes a history row and keeps a safety backup of the data it replaced", async () => {
  seedWorld();
  const backup = await makeBackup();
  await db.customer.update({ where: { id: "c1" }, data: { name: "Changed" } });

  const result = await restoreAs(backup.id);

  const history = db.rows("backupRestore");
  assert.equal(history.length, 1);
  assert.equal(history[0].status, "COMPLETED");
  assert.equal(history[0].backupId, backup.id);
  assert.equal(history[0].requestedById, ADMIN_A);
  assert.equal(history[0].safetyBackupId, result.safetyBackupId);

  const safety = db.get("backup", result.safetyBackupId);
  assert.equal(safety.backupType, "PRE_RESTORE");
  assert.ok(safety.snapshotPath);
});

test("a restore can be undone by restoring its safety backup", async () => {
  seedWorld();
  const backup = await makeBackup();

  await db.customer.update({ where: { id: "c1" }, data: { name: "Edited after backup" } });
  await db.lead.deleteMany({ where: { id: 2 } });
  const stateBeforeRestore = await dump(A);

  const first = await restoreAs(backup.id);
  assert.notDeepStrictEqual(await dump(A), stateBeforeRestore);

  await restoreAs(first.safetyBackupId); // undo
  assert.deepStrictEqual(await dump(A), stateBeforeRestore);
});

//////////////////////////////////////////////////////
// ONLY THAT COMPANY IS AFFECTED
//////////////////////////////////////////////////////

test("restoring company A never changes company B (data, counts, team, templates)", async () => {
  seedWorld();
  const backup = await makeBackup(A, ADMIN_A);
  await makeBackup(B, "u-admin-b"); // B has its own backup too

  const bBefore = await dump(B);
  const bUsers = structuredClone(db.rows("user").filter((u) => u.companyId === B));
  const bTemplates = structuredClone(db.rows("template").filter((t) => t.companyId === B));

  await wipe(A);
  await restoreAs(backup.id);

  assert.deepStrictEqual(await dump(B), bBefore);
  assert.deepStrictEqual(db.rows("user").filter((u) => u.companyId === B), bUsers);
  assert.deepStrictEqual(db.rows("template").filter((t) => t.companyId === B), bTemplates);
});

test("a company cannot restore (or preview) another company's backup", async () => {
  seedWorld();
  const backupA = await makeBackup(A, ADMIN_A);
  const bBefore = await dump(B);
  const aBefore = await dump(A);

  await rejects(restoreAs(backupA.id, B, "u-admin-b"), 404, /not found/i);
  await rejects(previewRestore({ companyId: B, backupId: backupA.id, requestedById: "u-admin-b" }), 404);

  assert.deepStrictEqual(await dump(B), bBefore);
  assert.deepStrictEqual(await dump(A), aBefore);
  assert.equal(db.rows("backupRestore").length, 0);
});

test("a snapshot that contains another company's rows is refused and nothing changes", async () => {
  seedWorld();
  const backup = await makeBackup();

  // tamper: slip a row of company B into A's snapshot
  const snapshot = JSON.parse(zlib.gunzipSync(files.get(backup.snapshotPath)).toString());
  snapshot.tables.customers.push({ ...snapshot.tables.customers[0], id: "evil", phone: "1", companyId: B });
  files.set(backup.snapshotPath, zlib.gzipSync(JSON.stringify(snapshot)));

  const aBefore = await dump(A);
  const bBefore = await dump(B);
  const backupsBefore = db.rows("backup").length;

  await rejects(restoreAs(backup.id), 422, /another company/i);

  assert.deepStrictEqual(await dump(A), aBefore);
  assert.deepStrictEqual(await dump(B), bBefore);
  assert.equal(db.rows("backupRestore").length, 0, "validation happens before anything is recorded");
  assert.equal(db.rows("backup").length, backupsBefore, "no safety backup is made for a refused restore");
});

test("a snapshot made for another company cannot be restored into this one", async () => {
  seedWorld();
  const backup = await makeBackup(A);
  const snapshot = JSON.parse(zlib.gunzipSync(files.get(backup.snapshotPath)).toString());
  snapshot.company.id = B;
  files.set(backup.snapshotPath, zlib.gzipSync(JSON.stringify(snapshot)));

  await rejects(restoreAs(backup.id), 403, /does not belong/i);
});

test("references to another company's team members are never restored", async () => {
  seedWorld();
  const backup = await makeBackup();

  const snapshot = JSON.parse(zlib.gunzipSync(files.get(backup.snapshotPath)).toString());
  snapshot.tables.customers[0].userId = "u-b1"; // user of company B
  snapshot.tables.tasks[0].assignedToId = "u-b1";
  files.set(backup.snapshotPath, zlib.gzipSync(JSON.stringify(snapshot)));

  await restoreAs(backup.id);

  const c = db.rows("customer").find((r) => r.id === snapshot.tables.customers[0].id);
  assert.equal(c.userId, ADMIN_A);
  assert.equal(db.get("task", "t1").assignedToId, ADMIN_A);
});

//////////////////////////////////////////////////////
// ALL-OR-NOTHING
//////////////////////////////////////////////////////

test("if anything fails half-way, the company keeps exactly the data it had", async () => {
  seedWorld();
  const backup = await makeBackup();

  await db.customer.update({ where: { id: "c2" }, data: { name: "Edited after backup" } });
  const stateBefore = await dump(A);
  const bBefore = await dump(B);

  await withPatched(
    db.message,
    "createMany",
    async () => { throw new Error("disk full"); },
    () => assert.rejects(restoreAs(backup.id), /disk full/)
  );

  assert.deepStrictEqual(await dump(A), stateBefore, "rolled back completely");
  assert.deepStrictEqual(await dump(B), bBefore);

  const history = db.rows("backupRestore");
  assert.equal(history.length, 1);
  assert.equal(history[0].status, "FAILED");
  assert.match(history[0].errorMessage, /disk full/);
});

test("the row-count check stops a restore that did not write everything", async () => {
  seedWorld();
  const backup = await makeBackup();
  const stateBefore = await dump(A);

  // a table that silently inserts nothing (leaf table, so no foreign key fails first)
  await withPatched(
    db.ticketWorkNote,
    "createMany",
    async () => ({ count: 0 }),
    () => rejects(restoreAs(backup.id), 500, /Restore check failed/)
  );

  assert.deepStrictEqual(await dump(A), stateBefore);
});

test("no restore starts when the safety backup cannot be created", async () => {
  seedWorld();
  const backup = await makeBackup();
  await db.customer.update({ where: { id: "c1" }, data: { name: "Edited" } });
  const stateBefore = await dump(A);

  // make snapshot building fail for the NEXT backup only
  await withPatched(
    db.proposal,
    "findMany",
    async () => { throw new Error("db hiccup"); },
    () => rejects(restoreAs(backup.id), 500, /safety backup/i)
  );

  assert.deepStrictEqual(await dump(A), stateBefore, "nothing was changed");
  assert.equal(db.rows("backupRestore")[0].status, "FAILED");
});

test("only one restore can run per company at a time", async () => {
  seedWorld();
  const backup = await makeBackup();

  const first = restoreAs(backup.id);
  await rejects(restoreAs(backup.id), 409, /already running/i);
  await first;

  // lock released afterwards
  await restoreAs(backup.id);
});

test("a restore recorded as running (e.g. on another server) blocks a new one until it is stale", async () => {
  seedWorld();
  const backup = await makeBackup();

  db.insert("backupRestore", { id: "r-live", companyId: A, backupId: backup.id, status: "IN_PROGRESS", startedAt: new Date() });
  await rejects(restoreAs(backup.id), 409);

  db.rows("backupRestore")[0].startedAt = new Date(Date.now() - 2 * 3600 * 1000);
  await restoreAs(backup.id); // old crashed attempt no longer blocks
});

//////////////////////////////////////////////////////
// BACKUPS THAT CANNOT BE RESTORED
//////////////////////////////////////////////////////

test("old Excel-only backups, unfinished and failed backups are refused with a clear message", async () => {
  seedWorld();
  const before = await dump(A);
  db.insert("backup", { id: "old", companyId: A, status: "COMPLETED", backupType: "MANUAL", storagePath: "x.xlsx", snapshotPath: null });
  db.insert("backup", { id: "busy", companyId: A, status: "IN_PROGRESS", backupType: "MANUAL", snapshotPath: "mem:x" });
  db.insert("backup", { id: "bad", companyId: A, status: "FAILED", backupType: "MANUAL", snapshotPath: null });
  db.insert("backup", { id: "gone", companyId: A, status: "COMPLETED", backupType: "MANUAL", snapshotPath: "mem:missing" });

  await rejects(restoreAs("old"), 422, /Excel/);
  await rejects(restoreAs("busy"), 422, /completed/i);
  await rejects(restoreAs("bad"), 422, /completed/i);
  await rejects(restoreAs("gone"), 404, /storage/i);
  await rejects(restoreAs("does-not-exist"), 404);

  assert.deepStrictEqual(await dump(A), before);
});

test("a damaged snapshot file is refused", async () => {
  seedWorld();
  const backup = await makeBackup();
  files.set(backup.snapshotPath, Buffer.from("this is not gzip"));
  await rejects(restoreAs(backup.id), 422, /damaged/i);
});

//////////////////////////////////////////////////////
// THINGS THAT CHANGED SINCE THE BACKUP
//////////////////////////////////////////////////////

test("records of a removed team member are re-assigned instead of breaking the restore", async () => {
  seedWorld();
  const backup = await makeBackup();

  // employee u-a1 is deleted after the backup
  db.rows("user").splice(db.rows("user").findIndex((u) => u.id === "u-a1"), 1);

  const result = await restoreAs(backup.id); // strict mode would throw on a dangling reference

  assert.equal(db.get("customer", "c1").userId, ADMIN_A, "required owner -> admin who restored");
  assert.equal(db.get("lead", 1) === null ? null : db.rows("lead").find((l) => l.id === 1).assignedToId, null, "optional assignee -> unassigned");
  assert.equal(db.get("task", "t1").assignedToId, ADMIN_A);
  assert.equal(db.get("taskWorkNote", "tw1").employeeId, ADMIN_A);
  assert.ok(result.summary.reassignedToAdmin >= 3);
  assert.ok(result.summary.unassigned >= 2);
  // the remaining team is untouched
  assert.ok(db.rows("user").some((u) => u.id === "u-a2"));
});

test("a removed template or WhatsApp number clears the link instead of failing", async () => {
  seedWorld();
  const backup = await makeBackup();

  db.rows("template").splice(db.rows("template").findIndex((t) => t.id === "tpl-a"), 1);
  db.rows("whatsAppAccount").splice(db.rows("whatsAppAccount").findIndex((w) => w.id === 1), 1);

  const result = await restoreAs(backup.id);

  assert.equal(db.get("campaign", "camp1").templateId, null);
  assert.equal(db.get("campaign", "camp1").whatsappAccountId, null);
  assert.equal(db.get("conversation", "conv1").whatsappAccountId, null);
  assert.equal(db.rows("templateRecipient").length, 0, "template sends of a removed template are skipped");
  assert.equal(result.summary.skipped.templateRecipients, 1);
  assert.ok(result.summary.clearedLinks >= 3);
});

test("templates, team, passwords and WhatsApp connections are never modified by a restore", async () => {
  seedWorld();
  const backup = await makeBackup();
  const users = structuredClone(db.rows("user"));
  const templates = structuredClone(db.rows("template"));
  const accounts = structuredClone(db.rows("whatsAppAccount"));
  const company = structuredClone(db.rows("company"));

  await wipe(A);
  await restoreAs(backup.id);

  assert.deepStrictEqual(db.rows("user"), users);
  assert.deepStrictEqual(db.rows("template"), templates);
  assert.deepStrictEqual(db.rows("whatsAppAccount"), accounts);
  assert.deepStrictEqual(db.rows("company"), company);
});

test("proposals (not part of a restore) keep their customer link, even when the customer was deleted", async () => {
  seedWorld();
  const backup = await makeBackup();

  // a proposal created AFTER the backup, linked to an existing customer
  db.insert("proposal", { id: "pr2", companyId: A, createdById: ADMIN_A, customerId: "c2", proposalNumber: "P-2", title: "New", items: [] });
  // mistake: all customers deleted -> proposal links are cleared by the database
  await wipe(A);
  assert.equal(db.get("proposal", "pr1").customerId, null);

  await restoreAs(backup.id);

  assert.equal(db.get("proposal", "pr1").customerId, "c1", "link from the backup is re-attached");
  assert.equal(db.get("proposal", "pr2").proposalNumber, "P-2", "proposals are never deleted");
});

test("purchases and customer-service links are restored with their customers", async () => {
  seedWorld();
  const backup = await makeBackup();
  await wipe(A);
  assert.equal(db.rows("purchase").filter((p) => p.companyId === A).length, 0);

  await restoreAs(backup.id);

  assert.equal(db.rows("purchase").filter((p) => p.companyId === A).length, 1);
  assert.equal(db.rows("customerService").filter((x) => x.customerId === "c1").length, 1);
});

//////////////////////////////////////////////////////
// PREVIEW (the confirmation step) CHANGES NOTHING
//////////////////////////////////////////////////////

test("preview shows current vs backup counts and changes nothing", async () => {
  seedWorld();
  const backup = await makeBackup();
  await db.lead.deleteMany({ where: { id: { in: [1, 2] } } });

  const before = await dump(A);
  const backupsBefore = db.rows("backup").length;

  const preview = await previewRestore({ companyId: A, backupId: backup.id, requestedById: ADMIN_A });

  const leads = preview.tables.find((t) => t.key === "leads");
  assert.deepEqual([leads.current, leads.afterRestore], [0, 2]);
  assert.ok(preview.unchanged.length > 0);
  assert.deepStrictEqual(await dump(A), before);
  assert.equal(db.rows("backupRestore").length, 0);
  assert.equal(db.rows("backup").length, backupsBefore);
});

test("preview warns about records that will be re-assigned", async () => {
  seedWorld();
  const backup = await makeBackup();
  db.rows("user").splice(db.rows("user").findIndex((u) => u.id === "u-a1"), 1);

  const preview = await previewRestore({ companyId: A, backupId: backup.id, requestedById: ADMIN_A });
  assert.ok(preview.notes.some((n) => /no longer exist/.test(n)));
});

//////////////////////////////////////////////////////
// PURE CHECKS
//////////////////////////////////////////////////////

test("checkSnapshot rejects duplicate ids and rows that point to missing parents", async () => {
  seedWorld();
  const backup = await makeBackup();
  const good = JSON.parse(zlib.gunzipSync(files.get(backup.snapshotPath)).toString());
  const revive = (s) => require(path.join(SRC, "services/backupSnapshot.js")).parseSnapshot(zlib.gzipSync(JSON.stringify(s)));

  assert.doesNotThrow(() => checkSnapshot(revive(good), A));

  const dup = structuredClone(good);
  dup.tables.customers.push({ ...dup.tables.customers[0] });
  assert.throws(() => checkSnapshot(revive(dup), A), /duplicate/i);

  const orphan = structuredClone(good);
  orphan.tables.messages[0].conversationId = "nope";
  assert.throws(() => checkSnapshot(revive(orphan), A), /missing/i);

  const old = structuredClone(good);
  old.version = 99;
  assert.throws(() => checkSnapshot(revive(old), A), /different version/i);
});

test("planRestore is pure: it does not modify the snapshot it was given", async () => {
  seedWorld();
  const backup = await makeBackup();
  const snapshot = require(path.join(SRC, "services/backupSnapshot.js")).parseSnapshot(files.get(backup.snapshotPath));
  const copy = structuredClone(snapshot);

  const ids = (rows) => new Set(rows.map((r) => r.id));
  planRestore(snapshot, {
    userIds: new Set([ADMIN_A]), fallbackUserId: ADMIN_A,
    waIds: new Set(), fbPageIds: new Set(), templateIds: new Set(), serviceIds: ids([]), integrationIds: new Set(),
  });

  assert.deepStrictEqual(snapshot, copy);
});

//////////////////////////////////////////////////////
// CONFIRMATION STEP (controller level)
//////////////////////////////////////////////////////

const mockRes = () => ({
  code: 200, body: null,
  status(c) { this.code = c; return this; },
  json(b) { this.body = b; return this; },
});
const adminReq = (backupId, body = {}, user = {}) => ({
  user: { userId: ADMIN_A, companyId: A, role: "ADMIN", ...user },
  params: { id: backupId },
  body,
  headers: {},
});

const controllerTest = (name, fn) => test(name, { skip: !jwt && "jsonwebtoken not installed" }, fn);

controllerTest("restore is refused without the preview step, the typed word, or with a wrong/expired token", async () => {
  seedWorld();
  const { previewBackupRestore, restoreBackupData } = require(path.join(SRC, "controllers/backupRestoreController.js"));
  const backup = await makeBackup();
  await db.customer.update({ where: { id: "c1" }, data: { name: "Edited" } });
  const edited = await dump(A);

  const preview = mockRes();
  await previewBackupRestore(adminReq(backup.id), preview);
  assert.equal(preview.code, 200);
  assert.equal(preview.body.confirmWord, "RESTORE");
  const token = preview.body.confirmToken;

  // no token
  let res = mockRes();
  await restoreBackupData(adminReq(backup.id, { confirmText: "RESTORE" }), res);
  assert.equal(res.code, 400);

  // wrong typed word
  res = mockRes();
  await restoreBackupData(adminReq(backup.id, { confirmToken: token, confirmText: "yes" }), res);
  assert.equal(res.code, 400);
  assert.match(res.body.message, /RESTORE/);

  // token made for another backup
  const other = await makeBackup();
  res = mockRes();
  await restoreBackupData(adminReq(other.id, { confirmToken: token, confirmText: "RESTORE" }), res);
  assert.equal(res.code, 400);

  // token made for another admin
  res = mockRes();
  await restoreBackupData(adminReq(backup.id, { confirmToken: token, confirmText: "RESTORE" }, { userId: "u-a1" }), res);
  assert.equal(res.code, 400);

  // token of another company
  res = mockRes();
  await restoreBackupData(adminReq(backup.id, { confirmToken: token, confirmText: "RESTORE" }, { companyId: B }), res);
  assert.equal(res.code, 400);

  // expired token
  const expired = jwt.sign(
    { purpose: "backup-restore-confirm", backupId: backup.id, companyId: A, userId: ADMIN_A, exp: Math.floor(Date.now() / 1000) - 60 },
    process.env.JWT_SECRET
  );
  res = mockRes();
  await restoreBackupData(adminReq(backup.id, { confirmToken: expired, confirmText: "RESTORE" }), res);
  assert.equal(res.code, 400);
  assert.match(res.body.message, /expired/i);

  // a token that is not a confirmation token (e.g. a login token) is useless
  const loginLike = jwt.sign({ userId: ADMIN_A, companyId: A }, process.env.JWT_SECRET);
  res = mockRes();
  await restoreBackupData(adminReq(backup.id, { confirmToken: loginLike, confirmText: "RESTORE" }), res);
  assert.equal(res.code, 400);

  // none of the refused attempts changed anything
  assert.deepStrictEqual(await dump(A), edited);
  assert.equal(db.rows("backupRestore").length, 0);
});

controllerTest("preview then confirm restores the data and writes an audit entry", async () => {
  seedWorld();
  const { previewBackupRestore, restoreBackupData, getRestoreHistory } = require(path.join(SRC, "controllers/backupRestoreController.js"));
  const before = await dump(A);
  const backup = await makeBackup();
  await wipe(A);

  const preview = mockRes();
  await previewBackupRestore(adminReq(backup.id), preview);

  const res = mockRes();
  await restoreBackupData(adminReq(backup.id, { confirmToken: preview.body.confirmToken, confirmText: "RESTORE" }), res);

  assert.equal(res.code, 200, JSON.stringify(res.body));
  assert.equal(res.body.success, true);
  assert.deepStrictEqual(await dump(A), before);

  assert.equal(auditCalls.length, 1);
  assert.equal(auditCalls[0].action, "RESTORE");
  assert.equal(auditCalls[0].module, "BACKUP");

  const history = mockRes();
  await getRestoreHistory(adminReq(backup.id), history);
  assert.equal(history.body.restores.length, 1);
  assert.equal(history.body.restores[0].status, "COMPLETED");
});

controllerTest("restore history only lists the company's own restores", async () => {
  seedWorld();
  const { getRestoreHistory } = require(path.join(SRC, "controllers/backupRestoreController.js"));
  db.insert("backupRestore", { id: "ra", companyId: A, status: "COMPLETED", startedAt: new Date() });
  db.insert("backupRestore", { id: "rb", companyId: B, status: "COMPLETED", startedAt: new Date() });

  const res = mockRes();
  await getRestoreHistory(adminReq("x"), res);
  assert.deepEqual(res.body.restores.map((r) => r.id), ["ra"]);
});