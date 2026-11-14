// Restores ONE company's CRM data from one of ITS OWN backups.
//
// Safety rules (each one is enforced in code AND covered by a test):
//   1. companyId always comes from the logged-in admin's token, never the body.
//   2. The backup must belong to that company, and every row inside the
//      snapshot must carry that company's id - otherwise nothing is touched.
//   3. The snapshot is fully validated BEFORE any change is made.
//   4. A safety backup of the CURRENT data is taken first, so a restore can
//      itself be undone. If it cannot be created, the restore does not start.
//   5. Everything is deleted/re-inserted inside ONE database transaction, and
//      row counts are verified before it commits. Any failure = full rollback,
//      the company keeps exactly the data it had.
//   6. Every delete is filtered by this company's id. Other companies, team
//      members, passwords, billing, WhatsApp credentials and templates are
//      never touched.
//   7. Only one restore can run per company at a time.

const prisma = require("../config/prisma");
const { readBackupFile, deleteBackupFile } = require("./backupStorage");
const { createManualBackup } = require("./backupService");
const {
  SNAPSHOT_VERSION,
  TABLES,
  hasIdColumn,
  parseSnapshot,
} = require("./backupSnapshot");

const INSERT_BATCH = 1000;
const TRANSACTION_TIMEOUT_MS = 10 * 60 * 1000;
const STALE_RESTORE_MS = 30 * 60 * 1000;
const KEEP_SAFETY_BACKUPS = 5;

class RestoreError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "RestoreError";
    this.status = status;
  }
}

// Prisma needs a special value to write NULL into a Json column.
const dbNull = () => {
  try {
    return require("@prisma/client").Prisma.DbNull;
  } catch (err) {
    return null; // tests run without the real client
  }
};

//////////////////////////////////////////////////////
// WHAT HAPPENS TO REFERENCES TO OTHER DATA
//////////////////////////////////////////////////////

// Team members are NOT restored (their passwords are not in a backup). If a
// record points to a team member who no longer exists:
//   "required" fields  -> given to the admin who runs the restore
//   "optional" fields  -> become unassigned
const USER_FIELDS = {
  customers: { userId: "required" },
  leads: { assignedToId: "optional" },
  leadWorkNotes: { employeeId: "required" },
  campaigns: { createdById: "required" },
  deals: { createdById: "required", assignedToId: "optional" },
  dealActivities: { createdById: "required" },
  tasks: { createdById: "required", assignedToId: "required" },
  taskWorkNotes: { employeeId: "required" },
  tickets: { createdById: "required", assignedToId: "optional" },
  ticketWorkNotes: { employeeId: "required" },
};

// Optional links to things that are NOT part of a restore. If the target is
// gone (e.g. a WhatsApp number was disconnected), the link is cleared.
const LINK_FIELDS = {
  conversations: { whatsappAccountId: "waIds", facebookPageId: "fbPageIds" },
  campaigns: { whatsappAccountId: "waIds", templateId: "templateIds" },
  purchases: { integrationId: "integrationIds" },
};

// Every row must point to a parent that is also inside the snapshot.
// [table, field, parent table, optional?]
const PARENT_LINKS = [
  ["customerServices", "customerId", "customers"],
  ["purchases", "customerId", "customers"],
  ["conversations", "customerId", "customers", true],
  ["messages", "conversationId", "conversations"],
  ["leadWorkNotes", "leadId", "leads"],
  ["campaignRecipients", "campaignId", "campaigns"],
  ["campaignRecipients", "customerId", "customers"],
  ["templateRecipients", "customerId", "customers"],
  ["deals", "customerId", "customers"],
  ["dealActivities", "dealId", "deals"],
  ["taskWorkNotes", "taskId", "tasks"],
  ["tickets", "customerId", "customers"],
  ["ticketWorkNotes", "ticketId", "tickets"],
];

//////////////////////////////////////////////////////
// PURE LOGIC (no database) - easy to test
//////////////////////////////////////////////////////

/**
 * Throws RestoreError unless the snapshot is safe to restore into `companyId`.
 */
const checkSnapshot = (snapshot, companyId) => {
  if (snapshot.version !== SNAPSHOT_VERSION) {
    throw new RestoreError(
      "This backup was made by a different version of Vatup and cannot be restored.",
      422
    );
  }

  if (!snapshot.company || Number(snapshot.company.id) !== Number(companyId)) {
    throw new RestoreError("This backup does not belong to your company.", 403);
  }

  const ids = {};

  for (const table of TABLES) {
    const seen = new Set();

    for (const row of snapshot.tables[table.key]) {
      if (table.direct && Number(row.companyId) !== Number(companyId)) {
        throw new RestoreError(
          "This backup contains data of another company. Restore was stopped and nothing was changed.",
          422
        );
      }

      if (hasIdColumn(table)) {
        if (seen.has(row.id)) {
          throw new RestoreError(
            `Backup is inconsistent (duplicate record in ${table.label}).`,
            422
          );
        }
        seen.add(row.id);
      }
    }

    ids[table.key] = seen;
  }

  const byKey = Object.fromEntries(TABLES.map((t) => [t.key, t]));

  for (const [tableKey, field, parentKey, optional] of PARENT_LINKS) {
    for (const row of snapshot.tables[tableKey]) {
      const value = row[field];
      if (value === null || value === undefined) {
        if (optional) continue;
      }
      if (!ids[parentKey].has(value)) {
        throw new RestoreError(
          `Backup is inconsistent (${byKey[tableKey].label} point to missing ${byKey[parentKey].label.toLowerCase()}).`,
          422
        );
      }
    }
  }
};

/**
 * Turns the snapshot into the exact rows that will be inserted, after fixing
 * references to team members / numbers / templates that changed since the
 * backup. Pure function: no database access, no side effects.
 *
 * ctx = {
 *   userIds, fallbackUserId,
 *   waIds, fbPageIds, templateIds, serviceIds, integrationIds   (Sets)
 * }
 */
const planRestore = (snapshot, ctx) => {
  const report = {
    reassignedToAdmin: 0,
    unassigned: 0,
    clearedLinks: 0,
    skipped: {},
  };

  const rows = {};

  for (const table of TABLES) {
    let list = snapshot.tables[table.key].map((row) => ({ ...row }));

    // Rows that depend on things a restore does not bring back
    if (table.key === "customerServices") {
      const before = list.length;
      list = list.filter((r) => ctx.serviceIds.has(r.serviceId));
      if (before !== list.length) report.skipped[table.key] = before - list.length;
    }
    if (table.key === "templateRecipients") {
      const before = list.length;
      list = list.filter((r) => ctx.templateIds.has(r.templateId));
      if (before !== list.length) report.skipped[table.key] = before - list.length;
    }

    const userFields = USER_FIELDS[table.key] || {};
    const linkFields = LINK_FIELDS[table.key] || {};

    for (const row of list) {
      for (const [field, mode] of Object.entries(userFields)) {
        const value = row[field];
        if (value !== null && value !== undefined && ctx.userIds.has(value)) continue;

        if (mode === "required") {
          row[field] = ctx.fallbackUserId;
          report.reassignedToAdmin += 1;
        } else if (value !== null && value !== undefined) {
          row[field] = null;
          report.unassigned += 1;
        }
      }

      for (const [field, setName] of Object.entries(linkFields)) {
        const value = row[field];
        if (value !== null && value !== undefined && !ctx[setName].has(value)) {
          row[field] = null;
          report.clearedLinks += 1;
        }
      }
    }

    rows[table.key] = list;
  }

  const customerIds = new Set(rows.customers.map((c) => c.id));
  const proposalLinks = snapshot.proposalLinks.filter((l) =>
    customerIds.has(l.customerId)
  );

  return { rows, proposalLinks, report };
};

//////////////////////////////////////////////////////
// DATABASE HELPERS
//////////////////////////////////////////////////////

const idSet = (list) => new Set(list.map((r) => r.id));

// Which team members / numbers / templates exist RIGHT NOW (this company only)
const loadContext = async (db, companyId, fallbackUserId) => {
  const only = { where: { companyId }, select: { id: true } };

  const [users, wa, fb, templates, services, integrations] = await Promise.all([
    db.user.findMany(only),
    db.whatsAppAccount.findMany(only),
    db.facebookPage.findMany(only),
    db.template.findMany(only),
    db.service.findMany(only),
    db.integration.findMany(only),
  ]);

  const userIds = idSet(users);
  if (!userIds.has(fallbackUserId)) {
    throw new RestoreError("Your user account was not found in this company.", 403);
  }

  return {
    userIds,
    fallbackUserId,
    waIds: idSet(wa),
    fbPageIds: idSet(fb),
    templateIds: idSet(templates),
    serviceIds: idSet(services),
    integrationIds: idSet(integrations),
  };
};

const toDbRow = (table, row) => {
  if (!table.json) return row;
  const out = { ...row };
  for (const field of table.json) {
    if (out[field] === null) {
      const value = dbNull();
      if (value === null) delete out[field];
      else out[field] = value;
    }
  }
  return out;
};

// Backup row that can be restored: this company's, finished, has a snapshot.
const findRestorableBackup = async (companyId, backupId) => {
  const backup = await prisma.backup.findFirst({
    where: { id: backupId, companyId },
    select: {
      id: true,
      companyId: true,
      status: true,
      backupType: true,
      fileName: true,
      snapshotPath: true,
      createdAt: true,
    },
  });

  if (!backup) throw new RestoreError("Backup not found.", 404);

  if (backup.status !== "COMPLETED") {
    throw new RestoreError("Only completed backups can be restored.", 422);
  }

  if (!backup.snapshotPath) {
    throw new RestoreError(
      "This is an older backup that was saved as a readable Excel file only, so it cannot be restored. Create a new backup - new backups can be restored.",
      422
    );
  }

  return backup;
};

const loadSnapshot = async (backup, companyId) => {
  const buffer = await readBackupFile(backup.snapshotPath);

  if (!buffer) {
    throw new RestoreError(
      "The backup file could not be found in storage, so it cannot be restored.",
      404
    );
  }

  let snapshot;
  try {
    snapshot = parseSnapshot(buffer);
  } catch (err) {
    throw new RestoreError(err.message, 422);
  }

  checkSnapshot(snapshot, companyId);
  return snapshot;
};

//////////////////////////////////////////////////////
// PREVIEW (the data for the confirmation step - changes nothing)
//////////////////////////////////////////////////////

const previewRestore = async ({ companyId, backupId, requestedById }) => {
  const backup = await findRestorableBackup(companyId, backupId);
  const snapshot = await loadSnapshot(backup, companyId);

  const ctx = await loadContext(prisma, companyId, requestedById);
  const plan = planRestore(snapshot, ctx);

  const tables = [];
  for (const table of TABLES) {
    const current = await prisma[table.model].count({
      where: table.where(companyId),
    });
    tables.push({
      key: table.key,
      label: table.label,
      current,
      afterRestore: plan.rows[table.key].length,
    });
  }

  const notes = [];
  if (plan.report.reassignedToAdmin > 0) {
    notes.push(
      `${plan.report.reassignedToAdmin} record(s) belonged to team members who no longer exist. They will be assigned to you.`
    );
  }
  if (plan.report.unassigned > 0) {
    notes.push(
      `${plan.report.unassigned} record(s) were assigned to team members who no longer exist. They will become unassigned.`
    );
  }
  if (plan.report.clearedLinks > 0) {
    notes.push(
      `${plan.report.clearedLinks} link(s) to a WhatsApp number, page, template or integration that no longer exists will be cleared.`
    );
  }
  Object.entries(plan.report.skipped).forEach(([key, n]) => {
    const label = TABLES.find((t) => t.key === key).label.toLowerCase();
    notes.push(`${n} ${label} entr${n === 1 ? "y" : "ies"} will be skipped because what they refer to no longer exists.`);
  });

  return {
    backup: {
      id: backup.id,
      fileName: backup.fileName,
      backupType: backup.backupType,
      createdAt: backup.createdAt,
    },
    snapshotCreatedAt: snapshot.createdAt,
    tables,
    notes,
    unchanged: [
      "Team members and passwords",
      "Company profile, plan and billing",
      "WhatsApp, Facebook and integration connections",
      "Message templates",
      "Audit log and notifications",
    ],
  };
};

//////////////////////////////////////////////////////
// RESTORE
//////////////////////////////////////////////////////

const running = new Set(); // one restore per company at a time (this server)

// Runs inside the transaction. Throws -> everything is rolled back.
const applyPlan = async (tx, companyId, plan) => {
  // Deleting customers clears the customer link on proposals (proposals are not
  // restored). Remember the links first so they can be put back.
  const currentLinks = await tx.proposal.findMany({
    where: { companyId, customerId: { not: null } },
    select: { id: true, customerId: true },
  });

  // 1. delete this company's data, children before parents
  for (const table of [...TABLES].reverse()) {
    await tx[table.model].deleteMany({ where: table.where(companyId) });
  }

  // 2. insert the backup's data, parents before children
  const restored = {};
  for (const table of TABLES) {
    const list = plan.rows[table.key];
    let inserted = 0;

    for (let i = 0; i < list.length; i += INSERT_BATCH) {
      const chunk = list.slice(i, i + INSERT_BATCH).map((r) => toDbRow(table, r));
      const result = await tx[table.model].createMany({ data: chunk });
      inserted += result.count;
    }

    restored[table.key] = inserted;
  }

  // 3. re-attach proposals to their customers
  const customerIds = new Set(plan.rows.customers.map((c) => c.id));
  const relinked = new Set();

  for (const link of currentLinks) {
    if (!customerIds.has(link.customerId)) continue;
    await tx.proposal.updateMany({
      where: { id: link.id, companyId, customerId: null },
      data: { customerId: link.customerId },
    });
    relinked.add(link.id);
  }
  for (const link of plan.proposalLinks) {
    if (relinked.has(link.id)) continue;
    await tx.proposal.updateMany({
      where: { id: link.id, companyId, customerId: null },
      data: { customerId: link.customerId },
    });
  }

  // 4. verify BEFORE committing: what is in the database must be exactly the plan
  for (const table of TABLES) {
    const actual = await tx[table.model].count({ where: table.where(companyId) });
    const expected = plan.rows[table.key].length;
    if (actual !== expected || restored[table.key] !== expected) {
      throw new RestoreError(
        `Restore check failed for ${table.label} (expected ${expected}, found ${actual}). Nothing was changed.`,
        500
      );
    }
  }

  return restored;
};

// Keep only the newest safety backups so storage does not grow forever.
const pruneSafetyBackups = async (companyId) => {
  try {
    const list = await prisma.backup.findMany({
      where: { companyId, backupType: "PRE_RESTORE", status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
      select: { id: true, storagePath: true, snapshotPath: true },
    });

    for (const old of list.slice(KEEP_SAFETY_BACKUPS)) {
      await deleteBackupFile(old.storagePath);
      await deleteBackupFile(old.snapshotPath);
      await prisma.backup.delete({ where: { id: old.id } });
    }
  } catch (err) {
    console.error("Safety backup clean-up failed:", err.message);
  }
};

/**
 * @param companyId     from the JWT (never the request body)
 * @param backupId      backup chosen from the history
 * @param requestedById the admin confirming the restore
 */
const restoreBackup = async ({ companyId, backupId, requestedById }) => {
  if (running.has(companyId)) {
    throw new RestoreError("A restore is already running for your company.", 409);
  }
  running.add(companyId);

  let restoreRow = null;
  let safetyBackupId = null;

  try {
    const backup = await findRestorableBackup(companyId, backupId);

    // Another server instance may be restoring this company
    const other = await prisma.backupRestore.findFirst({
      where: {
        companyId,
        status: "IN_PROGRESS",
        startedAt: { gte: new Date(Date.now() - STALE_RESTORE_MS) },
      },
      select: { id: true },
    });
    if (other) {
      throw new RestoreError("A restore is already running for your company.", 409);
    }

    // Validate everything BEFORE changing anything
    await loadSnapshot(backup, companyId);

    restoreRow = await prisma.backupRestore.create({
      data: {
        companyId,
        backupId: backup.id,
        requestedById,
        status: "IN_PROGRESS",
      },
    });

    // Safety net: back up the CURRENT data first so this restore can be undone
    const safety = await createManualBackup(companyId, requestedById, {
      backupType: "PRE_RESTORE",
    });
    safetyBackupId = safety.backup.id;

    if (!safety.backup.snapshotPath) {
      throw new RestoreError(
        "Could not create a safety backup of your current data, so nothing was changed. Please try again.",
        500
      );
    }

    // Read again after the safety backup so the plan reflects the latest team
    // members / numbers, then apply it all-or-nothing.
    const snapshot = await loadSnapshot(backup, companyId);
    const ctx = await loadContext(prisma, companyId, requestedById);
    const plan = planRestore(snapshot, ctx);

    const restored = await prisma.$transaction(
      (tx) => applyPlan(tx, companyId, plan),
      { maxWait: 15000, timeout: TRANSACTION_TIMEOUT_MS }
    );

    const summary = { restored, ...plan.report };

    await prisma.backupRestore.update({
      where: { id: restoreRow.id },
      data: {
        status: "COMPLETED",
        safetyBackupId,
        summary,
        completedAt: new Date(),
      },
    });

    await pruneSafetyBackups(companyId);

    return {
      restoreId: restoreRow.id,
      backupId: backup.id,
      safetyBackupId,
      summary,
    };
  } catch (error) {
    if (restoreRow) {
      try {
        await prisma.backupRestore.update({
          where: { id: restoreRow.id },
          data: {
            status: "FAILED",
            errorMessage: String(error.message || "Restore failed").slice(0, 500),
            safetyBackupId,
            completedAt: new Date(),
          },
        });
      } catch (updateError) {
        console.error("Could not mark restore as failed:", updateError.message);
      }
    }
    throw error;
  } finally {
    running.delete(companyId);
  }
};

const listRestores = async (companyId) => {
  const list = await prisma.backupRestore.findMany({
    where: { companyId },
    orderBy: { startedAt: "desc" },
    take: 20,
    select: {
      id: true,
      backupId: true,
      safetyBackupId: true,
      status: true,
      summary: true,
      errorMessage: true,
      startedAt: true,
      completedAt: true,
    },
  });
  return list;
};

module.exports = {
  RestoreError,
  checkSnapshot,
  planRestore,
  previewRestore,
  restoreBackup,
  listRestores,
};
