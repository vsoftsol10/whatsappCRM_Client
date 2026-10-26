const prisma = require("../config/prisma");

// Include block that loads a customer's services (used by customer queries).
const customerServiceInclude = {
  customerServices: {
    include: {
      service: {
        select: { id: true, name: true, isActive: true },
      },
    },
  },
};

// Turns a customer row (with customerServices) into the same row plus a
// flat `services: [{ id, name, isActive }]` array. All old fields are kept.
const withServices = (customer) => {
  if (!customer) return customer;

  const { customerServices, ...rest } = customer;

  return {
    ...rest,
    services: (customerServices || [])
      .map((item) => item.service)
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
};

// Cleans a list of service ids and makes sure every id belongs to this
// company. Throws an error with statusCode 400 when something is invalid.
const resolveServiceIds = async (companyId, serviceIds) => {
  if (serviceIds === undefined || serviceIds === null) return [];

  const list = Array.isArray(serviceIds) ? serviceIds : [serviceIds];

  const ids = [...new Set(list.filter(Boolean).map((id) => String(id)))];

  if (ids.length === 0) return [];

  const found = await prisma.service.findMany({
    where: { id: { in: ids }, companyId },
    select: { id: true },
  });

  if (found.length !== ids.length) {
    const error = new Error("One or more selected services are invalid.");
    error.statusCode = 400;
    throw error;
  }

  return ids;
};

module.exports = {
  customerServiceInclude,
  withServices,
  resolveServiceIds,
};
