// A tiny in-memory stand-in for the Prisma client.
//
// WHY not simple jest-style mocks?  Because the point of the isolation tests
// is to catch a controller that forgets `companyId` in a query. This fake
// really APPLIES the `where` filter to its rows, so a missing companyId makes
// the test fail (the other company's row would be returned/changed).
//
// Unsupported Prisma features throw loudly instead of being ignored silently.

const crypto = require("crypto");

const INT_ID_MODELS = new Set(["lead", "leadWorkNote", "company"]);

// Relation filters used by the code under test, e.g.
//   prisma.message.findFirst({ where: { conversation: { companyId } } })
const RELATIONS = {
  message: { conversation: { table: "conversation", localKey: "conversationId" } },
  leadWorkNote: { lead: { table: "lead", localKey: "leadId" } },
};

// To-one relations that controllers load with `include: { company: true }`.
const INCLUDES = {
  user: { company: { table: "company", localKey: "companyId" } },
  conversation: { customer: { table: "customer", localKey: "customerId" } },
  lead: { assignedTo: { table: "user", localKey: "assignedToId" } },
};

const clone = (v) => (v === undefined ? v : structuredClone(v));
const isPlainObject = (v) =>
  v !== null && typeof v === "object" && !(v instanceof Date) && !Array.isArray(v);
const same = (a, b) =>
  a instanceof Date && b instanceof Date ? a.getTime() === b.getTime() : a === b;

function matchesValue(value, cond, path) {
  if (!isPlainObject(cond)) return same(value, cond === undefined ? undefined : cond);
  for (const [op, arg] of Object.entries(cond)) {
    switch (op) {
      case "equals": if (!same(value, arg)) return false; break;
      case "in": if (!arg.some((x) => same(value, x))) return false; break;
      case "notIn": if (arg.some((x) => same(value, x))) return false; break;
      case "not": if (matchesValue(value, arg, path)) return false; break;
      case "gt": if (!(value > arg)) return false; break;
      case "gte": if (!(value >= arg)) return false; break;
      case "lt": if (!(value < arg)) return false; break;
      case "lte": if (!(value <= arg)) return false; break;
      case "contains":
      case "startsWith":
      case "endsWith": {
        if (typeof value !== "string") return false;
        const insensitive = cond.mode === "insensitive";
        const v = insensitive ? value.toLowerCase() : value;
        const a = insensitive ? String(arg).toLowerCase() : String(arg);
        const ok = op === "contains" ? v.includes(a) : op === "startsWith" ? v.startsWith(a) : v.endsWith(a);
        if (!ok) return false;
        break;
      }
      case "mode": break; // handled together with contains
      default:
        throw new Error(`FakePrisma: unsupported filter "${op}" on "${path}"`);
    }
  }
  return true;
}

function createDb() {
  const tables = {};
  const counters = {};
  const table = (name) => (tables[name] = tables[name] || []);

  const matches = (model, row, where) => {
    if (!where) return true;
    for (const [key, cond] of Object.entries(where)) {
      if (cond === undefined) continue; // Prisma ignores undefined filters
      if (key === "AND") { if (![].concat(cond).every((c) => matches(model, row, c))) return false; continue; }
      if (key === "OR") { if (!cond.some((c) => matches(model, row, c))) return false; continue; }
      if (key === "NOT") { if ([].concat(cond).some((c) => matches(model, row, c))) return false; continue; }
      const rel = RELATIONS[model] && RELATIONS[model][key];
      if (rel) {
        const target = table(rel.table).find((r) => r.id === row[rel.localKey]);
        if (!target || !matches(rel.table, target, cond)) return false;
        continue;
      }
      // compound unique keys such as { companyId_email: { companyId, email } }
      if (key.includes("_") && isPlainObject(cond) && !("equals" in cond) && !("in" in cond)) {
        if (!matches(model, row, cond)) return false;
        continue;
      }
      if (!matchesValue(row[key], cond, `${model}.${key}`)) return false;
    }
    return true;
  };

  const project = (row, args, name) => {
    if (!row) return row;
    const out = clone(row);
    if (args && args.include && name && INCLUDES[name]) {
      for (const [key, rel] of Object.entries(INCLUDES[name])) {
        if (args.include[key]) {
          const target = table(rel.table).find((r) => r.id === row[rel.localKey]);
          out[key] = target ? clone(target) : null;
        }
      }
    }
    if (args && args.select) {
      const picked = {};
      for (const [k, v] of Object.entries(args.select)) if (v === true) picked[k] = out[k];
      return picked;
    }
    return out;
  };

  const nextId = (name) => {
    if (INT_ID_MODELS.has(name)) {
      counters[name] = Math.max(counters[name] || 0, ...table(name).map((r) => r.id || 0)) + 1;
      return counters[name];
    }
    return crypto.randomUUID();
  };

  const assertScalarData = (name, data) => {
    for (const [k, v] of Object.entries(data)) {
      if (isPlainObject(v)) {
        throw new Error(`FakePrisma: nested write on ${name}.${k} is not supported by the fake`);
      }
    }
  };

  const model = (name) => ({
    async findUnique(args) { return project(table(name).find((r) => matches(name, r, args.where)), args, name) || null; },
    async findFirst(args = {}) { return project(table(name).find((r) => matches(name, r, args.where)), args, name) || null; },
    async findMany(args = {}) { return table(name).filter((r) => matches(name, r, args.where)).map((r) => project(r, args, name)); },
    async count(args = {}) { return table(name).filter((r) => matches(name, r, args.where)).length; },
    async create(args) {
      assertScalarData(name, args.data);
      const now = new Date();
      const row = { id: nextId(name), createdAt: now, updatedAt: now, ...clone(args.data) };
      table(name).push(row);
      return project(row, args, name);
    },
    async update(args) {
      const row = table(name).find((r) => matches(name, r, args.where));
      if (!row) throw Object.assign(new Error("Record to update not found."), { code: "P2025" });
      assertScalarData(name, args.data);
      Object.assign(row, clone(args.data), { updatedAt: new Date() });
      return project(row, args, name);
    },
    async updateMany(args) {
      assertScalarData(name, args.data);
      const rows = table(name).filter((r) => matches(name, r, args.where));
      rows.forEach((r) => Object.assign(r, clone(args.data), { updatedAt: new Date() }));
      return { count: rows.length };
    },
    async delete(args) {
      const i = table(name).findIndex((r) => matches(name, r, args.where));
      if (i === -1) throw Object.assign(new Error("Record to delete does not exist."), { code: "P2025" });
      return table(name).splice(i, 1)[0];
    },
    async deleteMany(args = {}) {
      const keep = [], gone = [];
      table(name).forEach((r) => (matches(name, r, args.where) ? gone : keep).push(r));
      tables[name] = keep;
      return { count: gone.length };
    },
  });

  const MODELS = [
    "user", "company", "customer", "lead", "leadWorkNote", "conversation", "message",
    "ticket", "deal", "task", "service", "customerService", "whatsAppAccount",
    "userNotification", "subscription",
  ];

  const db = {
    __isFake: true,
    $transaction: async (arg) => (typeof arg === "function" ? arg(db) : Promise.all(arg)),
    // ---- test helpers ----
    reset() { Object.keys(tables).forEach((k) => delete tables[k]); Object.keys(counters).forEach((k) => delete counters[k]); },
    rows: (name) => table(name),
    insert(name, row) { const r = { createdAt: new Date(), updatedAt: new Date(), ...row }; table(name).push(r); return r; },
    get: (name, id) => table(name).find((r) => r.id === id) || null,
  };
  MODELS.forEach((m) => (db[m] = model(m)));
  return db;
}

module.exports = { createDb };
