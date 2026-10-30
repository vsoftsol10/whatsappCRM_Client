// ============================================
// AUTO-ASSIGN NEW LEADS
// ============================================
// Shares new leads fairly between all active employees (role USER):
// the employee who received a lead the longest time ago gets the next
// one. An employee who never got a lead is picked first.

const prisma = require("../../config/prisma");

// One at a time per company, so two leads created at the same moment
// are not given to the same employee.
const locks = new Map();

const withCompanyLock = async (companyId, task) => {
  const previous = locks.get(companyId) || Promise.resolve();

  let release;
  const current = new Promise((resolve) => {
    release = resolve;
  });

  const chain = previous.then(() => current);
  locks.set(companyId, chain);

  await previous;

  try {
    return await task();
  } finally {
    release();
    if (locks.get(companyId) === chain) locks.delete(companyId);
  }
};

const pickNextEmployee = async (companyId) => {
  const employees = await prisma.user.findMany({
    where: { companyId, role: "USER", status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { createdAt: "asc" },
  });

  if (employees.length === 0) return null;
  if (employees.length === 1) return employees[0];

  const lastAssigned = await prisma.lead.groupBy({
    by: ["assignedToId"],
    where: {
      companyId,
      assignedToId: { in: employees.map((employee) => employee.id) },
    },
    _max: { createdAt: true },
  });

  const lastTime = new Map(
    lastAssigned.map((row) => [
      row.assignedToId,
      row._max.createdAt ? row._max.createdAt.getTime() : 0,
    ])
  );

  let best = employees[0];
  let bestTime = lastTime.get(best.id) || 0;

  for (const employee of employees) {
    const time = lastTime.get(employee.id) || 0;

    if (time < bestTime) {
      best = employee;
      bestTime = time;
    }
  }

  return best;
};

module.exports = { pickNextEmployee, withCompanyLock };