// Route-level checks for restore: real Express, real routes and middleware.
// Proves WHO may call the restore endpoints (admin only, own company only,
// not when the subscription is expired) and the 2-step confirmation over HTTP.
const base = require("./helpers/testApp"); // installs the shared fakes (db, audit log, ...)

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const http = require("http");
const express = require("express");

const SRC = path.resolve(__dirname, "../src");
const { db, seedWorld, tokenFor } = base;

const stub = (relPath, exports) => {
  const file = require.resolve(path.join(SRC, relPath));
  require.cache[file] = { id: file, filename: file, loaded: true, exports, children: [], paths: [] };
};
const files = new Map();
stub("services/backupStorage.js", {
  XLSX_TYPE: "application/test",
  saveBackupFile: async (k, name, buf) => { const p = `mem:${k}/${name}`; files.set(p, Buffer.from(buf)); return p; },
  readBackupFile: async (p) => files.get(p) || null,
  deleteBackupFile: async (p) => { files.delete(p); },
});
stub("services/backupExcelService.js", { buildBackupExcelBuffer: () => Buffer.from("x") });

const { createManualBackup } = require(path.join(SRC, "services/backupService.js"));

let server, baseUrl, world;
const call = async (method, url, { token, body } = {}) => {
  const res = await fetch(baseUrl + url, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null; try { json = await res.json(); } catch { /* */ }
  return { status: res.status, body: json };
};

test.before(async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/backups", require(path.join(SRC, "routes/backupRoutes.js")));
  server = http.createServer(app);
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => new Promise((r) => server.close(r)));

async function setup() {
  world = seedWorld();
  files.clear();
  const { backup } = await createManualBackup(1, "a-admin");
  return {
    backupId: backup.id,
    admin: tokenFor(world.users.aAdmin),
    emp: tokenFor(world.users.aEmp1),
    otherAdmin: tokenFor(world.users.bAdmin),
  };
}

test("restore endpoints need a login", async () => {
  const { backupId } = await setup();
  for (const [m, u] of [["GET", "/api/backups/restores"], ["GET", `/api/backups/${backupId}/restore-preview`], ["POST", `/api/backups/${backupId}/restore`]]) {
    assert.equal((await call(m, u)).status, 401, `${m} ${u}`);
  }
});

test("employees (non-admins) cannot preview, restore or see restore history", async () => {
  const { backupId, emp } = await setup();
  const before = db.rows("customer").length;
  for (const [m, u] of [["GET", "/api/backups/restores"], ["GET", `/api/backups/${backupId}/restore-preview`], ["POST", `/api/backups/${backupId}/restore`]]) {
    assert.equal((await call(m, u, { token: emp, body: m === "POST" ? { confirmText: "RESTORE" } : undefined })).status, 403, `${m} ${u}`);
  }
  assert.equal(db.rows("customer").length, before);
  assert.equal(db.rows("backupRestore").length, 0);
});

test("another company's admin cannot see or restore this company's backup", async () => {
  const { backupId, otherAdmin } = await setup();
  assert.equal((await call("GET", `/api/backups/${backupId}/restore-preview`, { token: otherAdmin })).status, 404);
  assert.equal((await call("POST", `/api/backups/${backupId}/restore`, { token: otherAdmin, body: { confirmText: "RESTORE", confirmToken: "x" } })).status, 400);
  assert.equal(db.rows("backupRestore").length, 0);
});

test("admin flow over HTTP: preview -> typed confirmation -> restored", async () => {
  const { backupId, admin } = await setup();
  await db.customer.deleteMany({ where: { companyId: 1 } }).catch(() => {});
  db.rows("conversation").length; // (non-strict fake: nothing else to clean)

  const pre = await call("GET", `/api/backups/${backupId}/restore-preview`, { token: admin });
  assert.equal(pre.status, 200);
  assert.equal(pre.body.confirmWord, "RESTORE");
  assert.ok(pre.body.preview.tables.find((t) => t.key === "customers").afterRestore >= 2);

  // typing the wrong word, or skipping the token, does nothing
  assert.equal((await call("POST", `/api/backups/${backupId}/restore`, { token: admin, body: { confirmToken: pre.body.confirmToken, confirmText: "ok" } })).status, 400);
  assert.equal((await call("POST", `/api/backups/${backupId}/restore`, { token: admin, body: { confirmText: "RESTORE" } })).status, 400);
  assert.equal(db.rows("customer").filter((c) => c.companyId === 1).length, 0);

  const done = await call("POST", `/api/backups/${backupId}/restore`, { token: admin, body: { confirmToken: pre.body.confirmToken, confirmText: "RESTORE" } });
  assert.equal(done.status, 200, JSON.stringify(done.body));
  assert.equal(db.rows("customer").filter((c) => c.companyId === 1).length, 2);
  assert.equal(db.rows("customer").filter((c) => c.companyId === 2).length, 2, "other company untouched");

  const hist = await call("GET", "/api/backups/restores", { token: admin });
  assert.equal(hist.body.restores.length, 1);
});

test("an expired subscription can look at a restore but cannot perform one", async () => {
  const { backupId, admin } = await setup();
  const pre = await call("GET", `/api/backups/${backupId}/restore-preview`, { token: admin });
  assert.equal(pre.status, 200);

  db.rows("company").find((c) => c.id === 1).status = "EXPIRED";
  const res = await call("POST", `/api/backups/${backupId}/restore`, { token: admin, body: { confirmToken: pre.body.confirmToken, confirmText: "RESTORE" } });
  assert.equal(res.status, 403);
  assert.equal(db.rows("backupRestore").length, 0);
});

test("the backup list says which backups are restorable and never leaks storage paths", async () => {
  const { admin } = await setup();
  db.insert("backup", { id: "old", companyId: 1, status: "COMPLETED", backupType: "MANUAL", snapshotPath: null, createdAt: new Date() });
  const res = await call("GET", "/api/backups", { token: admin });
  assert.equal(res.status, 200);
  const byId = Object.fromEntries(res.body.backups.map((b) => [b.id, b]));
  assert.equal(byId.old.restorable, false);
  assert.ok(res.body.backups.some((b) => b.restorable === true));
  res.body.backups.forEach((b) => assert.equal("snapshotPath" in b, false));
});
