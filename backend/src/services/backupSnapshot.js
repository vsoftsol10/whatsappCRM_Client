// Machine-readable backup ("snapshot") used by RESTORE.
//
// WHY this exists:
//   The Excel backup is made for people to READ. It shows names instead of IDs,
//   "In Progress" instead of IN_PROGRESS, IST dates, and skips some columns - so
//   it cannot be turned back into real database rows safely.
//   The snapshot is the exact opposite: raw rows, real IDs, nothing prettified.
//
// WHAT is in it (only the company's CRM data):
//   customers, chats + messages, leads (+notes), deals (+activities),
//   tasks (+notes), tickets (+notes), campaigns (+recipients), template sends,
//   customer<->service links, purchases.
//
// WHAT is NOT in it (and is never touched by a restore):
//   team members / passwords, company profile, subscription & billing,
//   WhatsApp / Facebook / integration credentials, message templates (they live
//   at Meta too), AI settings, knowledge base, audit logs, notifications.
//
// Stored as gzipped JSON next to the Excel file (same private bucket).

const zlib = require("zlib");

const SNAPSHOT_VERSION = 1;

// Order matters: parents first. Restore inserts in this order and deletes in
// the reverse order.
//   where(companyId) -> Prisma filter that scopes the table to ONE company
//   direct           -> the table has its own companyId column
const TABLES = [
  {
    key: "customers",
    label: "Customers",
    model: "customer",
    direct: true,
    where: (companyId) => ({ companyId }),
    dates: ["createdAt", "updatedAt"],
  },
  {
    key: "customerServices",
    label: "Customer services",
    model: "customerService",
    where: (companyId) => ({ customer: { companyId } }),
    dates: ["createdAt"],
  },
  {
    key: "purchases",
    label: "Purchases",
    model: "purchase",
    direct: true,
    where: (companyId) => ({ companyId }),
    dates: ["purchaseDate", "createdAt", "updatedAt"],
  },
  {
    key: "conversations",
    label: "Chats",
    model: "conversation",
    direct: true,
    where: (companyId) => ({ companyId }),
    dates: ["createdAt", "updatedAt"],
  },
  {
    key: "messages",
    label: "Messages",
    model: "message",
    where: (companyId) => ({ conversation: { companyId } }),
    dates: ["createdAt", "updatedAt"],
    json: ["buttons"],
  },
  {
    key: "leads",
    label: "Leads",
    model: "lead",
    direct: true,
    where: (companyId) => ({ companyId }),
    dates: ["createdAt", "updatedAt"],
  },
  {
    key: "leadWorkNotes",
    label: "Lead notes",
    model: "leadWorkNote",
    where: (companyId) => ({ lead: { companyId } }),
    dates: ["createdAt", "updatedAt"],
  },
  {
    key: "campaigns",
    label: "Campaigns",
    model: "campaign",
    direct: true,
    where: (companyId) => ({ companyId }),
    dates: ["scheduledAt", "startedAt", "completedAt", "createdAt", "updatedAt"],
  },
  {
    key: "campaignRecipients",
    label: "Campaign recipients",
    model: "campaignRecipient",
    where: (companyId) => ({ campaign: { companyId } }),
    dates: ["sentAt", "deliveredAt", "readAt", "failedAt", "createdAt"],
  },
  {
    key: "templateRecipients",
    label: "Template sends",
    model: "templateRecipient",
    where: (companyId) => ({ template: { companyId } }),
    dates: ["sentAt", "deliveredAt", "readAt", "createdAt", "updatedAt"],
  },
  {
    key: "deals",
    label: "Deals",
    model: "deal",
    direct: true,
    where: (companyId) => ({ companyId }),
    dates: ["createdAt", "updatedAt"],
  },
  {
    key: "dealActivities",
    label: "Deal activities",
    model: "dealActivity",
    where: (companyId) => ({ deal: { companyId } }),
    dates: ["createdAt"],
  },
  {
    key: "tasks",
    label: "Tasks",
    model: "task",
    direct: true,
    where: (companyId) => ({ companyId }),
    dates: ["dueDate", "createdAt", "updatedAt"],
  },
  {
    key: "taskWorkNotes",
    label: "Task notes",
    model: "taskWorkNote",
    where: (companyId) => ({ task: { companyId } }),
    dates: ["createdAt", "updatedAt"],
  },
  {
    key: "tickets",
    label: "Tickets",
    model: "ticket",
    direct: true,
    where: (companyId) => ({ companyId }),
    dates: ["createdAt", "updatedAt"],
  },
  {
    key: "ticketWorkNotes",
    label: "Ticket notes",
    model: "ticketWorkNote",
    where: (companyId) => ({ ticket: { companyId } }),
    dates: ["createdAt", "updatedAt"],
  },
];

// customerServices has a composite key (no `id` column)
const hasIdColumn = (table) => table.key !== "customerServices";

//////////////////////////////////////////////////////
// BUILD
//////////////////////////////////////////////////////

/**
 * Reads ALL restorable data of ONE company and returns the gzipped snapshot.
 * Read inside a single REPEATABLE READ transaction so every table comes from
 * the same moment (no half-old / half-new backup while people keep chatting).
 *
 * @param prisma    Prisma client (injected so tests can use a fake)
 * @param companyId numeric Company.id (never taken from the request body)
 */
const buildSnapshot = async (prisma, companyId) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, companyId: true },
  });
  if (!company) throw new Error("Company not found");

  const tables = {};
  const proposalLinks = [];

  await prisma.$transaction(
    async (tx) => {
      for (const table of TABLES) {
        tables[table.key] = await tx[table.model].findMany({
          where: table.where(companyId),
        });
      }

      // Proposals are NOT restored, but deleting a customer clears the
      // proposal's customer link. We keep the links so they can be re-attached.
      const proposals = await tx.proposal.findMany({
        where: { companyId, customerId: { not: null } },
        select: { id: true, customerId: true },
      });
      proposals.forEach((p) => proposalLinks.push(p));
    },
    { isolationLevel: "RepeatableRead", maxWait: 15000, timeout: 120000 }
  );

  const counts = {};
  for (const table of TABLES) counts[table.key] = tables[table.key].length;

  const snapshot = {
    version: SNAPSHOT_VERSION,
    createdAt: new Date().toISOString(),
    company: { id: company.id, companyId: company.companyId },
    counts,
    tables,
    proposalLinks,
  };

  const buffer = zlib.gzipSync(Buffer.from(JSON.stringify(snapshot), "utf8"));
  return { buffer, counts };
};

//////////////////////////////////////////////////////
// READ
//////////////////////////////////////////////////////

/**
 * Gunzips + parses a snapshot buffer and turns ISO date strings back into Date
 * objects. Throws a plain Error for anything that is not a valid snapshot.
 * (gzip has a built-in checksum, so a damaged file fails here.)
 */
const parseSnapshot = (buffer) => {
  let snapshot;
  try {
    snapshot = JSON.parse(zlib.gunzipSync(buffer).toString("utf8"));
  } catch (err) {
    throw new Error("Backup data is damaged and cannot be read");
  }

  if (!snapshot || typeof snapshot !== "object" || !snapshot.tables) {
    throw new Error("Backup data is not in the expected format");
  }

  for (const table of TABLES) {
    const rows = snapshot.tables[table.key];
    if (!Array.isArray(rows)) {
      throw new Error(`Backup data is missing "${table.label}"`);
    }
    for (const row of rows) {
      for (const field of table.dates) {
        if (row[field] !== null && row[field] !== undefined) {
          const date = new Date(row[field]);
          if (Number.isNaN(date.getTime())) {
            throw new Error(`Backup data has an invalid date in "${table.label}"`);
          }
          row[field] = date;
        }
      }
    }
  }

  if (!Array.isArray(snapshot.proposalLinks)) snapshot.proposalLinks = [];

  return snapshot;
};

module.exports = {
  SNAPSHOT_VERSION,
  TABLES,
  hasIdColumn,
  buildSnapshot,
  parseSnapshot,
};