// A tiny in-memory stand-in for the Prisma client.
//
// WHY not simple jest-style mocks?  Because the point of the isolation tests
// is to catch a controller that forgets `companyId` in a query. This fake
// really APPLIES the `where` filter to its rows, so a missing companyId makes
// the test fail (the other company's row would be returned/changed).
//
// Unsupported Prisma features throw loudly instead of being ignored silently.

const crypto = require("crypto");

const INT_ID_MODELS = new Set(["lead", "leadWorkNote", "company", "integration", "whatsAppAccount"]);

// Relation filters used by the code under test, e.g.
//   prisma.message.findFirst({ where: { conversation: { companyId } } })
const RELATIONS = {
  message: { conversation: { table: "conversation", localKey: "conversationId" } },
  leadWorkNote: { lead: { table: "lead", localKey: "leadId" } },
  // tickets, ticket notes and campaigns
  ticket: { customer: { table: "customer", localKey: "customerId" } },
  ticketWorkNote: { ticket: { table: "ticket", localKey: "ticketId" } },
  campaignRecipient: { campaign: { table: "campaign", localKey: "campaignId" } },
};

// To-one relations that controllers load with `include: { company: true }`.
const INCLUDES = {
  user: { company: { table: "company", localKey: "companyId" } },
  conversation: { customer: { table: "customer", localKey: "customerId" } },
  lead: { assignedTo: { table: "user", localKey: "assignedToId" } },
  // tickets, ticket notes, campaigns and plans
  ticket: {
    customer: { table: "customer", localKey: "customerId" },
    createdBy: { table: "user", localKey: "createdById" },
    assignedTo: { table: "user", localKey: "assignedToId" },
  },
  ticketWorkNote: { employee: { table: "user", localKey: "employeeId" } },
  campaign: {
    createdBy: { table: "user", localKey: "createdById" },
    template: { table: "template", localKey: "templateId" },
  },
  campaignRecipient: { customer: { table: "customer", localKey: "customerId" } },
  subscription: { plan: { table: "subscriptionPlan", localKey: "planId" } },
};

// To-many relations that controllers load with `include`.
const INCLUDES_MANY = {
  company: { subscriptions: { table: "subscription", foreignKey: "companyId" } },
  campaign: { recipients: { table: "campaignRecipient", foreignKey: "campaignId" } },
};

// Nested writes the fake understands:
//   connect  -> { customer: { connect: { id } } }  becomes  customerId = id
//   create   -> { recipients: { create: [ ... ] } } creates child rows
const NESTED_CREATE = {
  campaign: { recipients: { table: "campaignRecipient", foreignKey: "campaignId" } },
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
    if (args && args.include && name) {
      for (const [key, rel] of Object.entries(INCLUDES[name] || {})) {
        if (args.include[key]) {
          const target = table(rel.table).find((r) => r.id === row[rel.localKey]);
          const sub = isPlainObject(args.include[key]) ? args.include[key] : null;
          out[key] = target ? project(target, sub && sub.include ? { include: sub.include } : null, rel.table) : null;
        }
      }
      for (const [key, rel] of Object.entries(INCLUDES_MANY[name] || {})) {
        if (args.include[key]) {
          const sub = isPlainObject(args.include[key]) ? args.include[key] : {};
          let children = table(rel.table).filter(
            (r) => r[rel.foreignKey] === row.id && matches(rel.table, r, sub.where)
          );
          if (sub.take) children = children.slice(0, sub.take);
          out[key] = children.map((c) => project(c, sub.include ? { include: sub.include } : null, rel.table));
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

  // Turns { customer: { connect: { id } } } into { customerId: id } and
  // pulls out { recipients: { create: [...] } } so it can be created afterwards.
  const prepareCreateData = (name, data) => {
    const flat = {};
    const children = [];
    for (const [k, v] of Object.entries(data)) {
      if (isPlainObject(v) && v.connect && Object.keys(v).length === 1) {
        flat[`${k}Id`] = v.connect.id;
      } else if (isPlainObject(v) && v.create !== undefined && NESTED_CREATE[name] && NESTED_CREATE[name][k]) {
        children.push({ rel: NESTED_CREATE[name][k], rows: [].concat(v.create) });
      } else {
        flat[k] = v;
      }
    }
    assertScalarData(name, flat);
    return { flat, children };
  };

  // Applies an update to a row. Supports { increment: n } / { decrement: n }.
  const applyUpdate = (name, row, data) => {
    const plain = {};
    for (const [k, v] of Object.entries(data)) {
      if (isPlainObject(v) && (v.increment !== undefined || v.decrement !== undefined)) {
        plain[k] = (row[k] || 0) + (v.increment || 0) - (v.decrement || 0);
      } else {
        plain[k] = v;
      }
    }
    assertScalarData(name, plain);
    Object.assign(row, clone(plain), { updatedAt: new Date() });
  };

  const model = (name) => ({
    async findUnique(args) { return project(table(name).find((r) => matches(name, r, args.where)), args, name) || null; },
    async findFirst(args = {}) { return project(table(name).find((r) => matches(name, r, args.where)), args, name) || null; },
    async findMany(args = {}) { return table(name).filter((r) => matches(name, r, args.where)).map((r) => project(r, args, name)); },
    async count(args = {}) { return table(name).filter((r) => matches(name, r, args.where)).length; },
    async create(args) {
      const { flat, children } = prepareCreateData(name, args.data);
      const now = new Date();
      const row = { id: nextId(name), createdAt: now, updatedAt: now, ...clone(flat) };
      table(name).push(row);
      for (const { rel, rows } of children) {
        for (const child of rows) {
          table(rel.table).push({
            id: nextId(rel.table), createdAt: now, updatedAt: now, status: "PENDING",
            ...clone(child), [rel.foreignKey]: row.id,
          });
        }
      }
      return project(row, args, name);
    },
    async createMany(args) {
      const now = new Date();
      const list = [].concat(args.data);
      list.forEach((d) => {
        assertScalarData(name, d);
        table(name).push({ id: nextId(name), createdAt: now, updatedAt: now, ...clone(d) });
      });
      return { count: list.length };
    },
    async update(args) {
      const row = table(name).find((r) => matches(name, r, args.where));
      if (!row) throw Object.assign(new Error("Record to update not found."), { code: "P2025" });
      applyUpdate(name, row, args.data);
      return project(row, args, name);
    },
    async updateMany(args) {
      const rows = table(name).filter((r) => matches(name, r, args.where));
      rows.forEach((r) => applyUpdate(name, r, args.data));
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
    // added for the WhatsApp / lead / campaign / ticket tests
    "ticketWorkNote", "campaign", "campaignRecipient", "template", "integration",
    "subscriptionPlan", "aiSettings",
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