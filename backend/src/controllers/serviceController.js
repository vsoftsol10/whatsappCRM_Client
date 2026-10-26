const prisma = require("../config/prisma");

const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

const cleanText = (value) =>
  typeof value === "string" ? value.trim() : "";

// ===============================
// GET ALL SERVICES (with customer count)
// ===============================
const getServices = async (req, res) => {
  try {
    const { activeOnly } = req.query;

    const where = { companyId: req.user.companyId };

    if (activeOnly === "true") {
      where.isActive = true;
    }

    const services = await prisma.service.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: { select: { customers: true } },
      },
    });

    return res.status(200).json({
      success: true,
      services: services.map(({ _count, ...service }) => ({
        ...service,
        customerCount: _count.customers,
      })),
    });
  } catch (error) {
    console.error("Get services error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ===============================
// CREATE SERVICE
// ===============================
const createService = async (req, res) => {
  try {
    const { companyId } = req.user;

    const name = cleanText(req.body.name);
    const description = cleanText(req.body.description);

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Service name is required",
      });
    }

    if (name.length > MAX_NAME_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Service name must be ${MAX_NAME_LENGTH} characters or less`,
      });
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`,
      });
    }

    const duplicate = await prisma.service.findFirst({
      where: {
        companyId,
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "A service with this name already exists",
      });
    }

    const service = await prisma.service.create({
      data: {
        companyId,
        name,
        description: description || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      service: { ...service, customerCount: 0 },
    });
  } catch (error) {
    console.error("Create service error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ===============================
// UPDATE SERVICE
// ===============================
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const existing = await prisma.service.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const data = {};

    if (req.body.name !== undefined) {
      const name = cleanText(req.body.name);

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Service name is required",
        });
      }

      if (name.length > MAX_NAME_LENGTH) {
        return res.status(400).json({
          success: false,
          message: `Service name must be ${MAX_NAME_LENGTH} characters or less`,
        });
      }

      const duplicate = await prisma.service.findFirst({
        where: {
          companyId,
          id: { not: id },
          name: { equals: name, mode: "insensitive" },
        },
      });

      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "A service with this name already exists",
        });
      }

      data.name = name;
    }

    if (req.body.description !== undefined) {
      const description = cleanText(req.body.description);

      if (description.length > MAX_DESCRIPTION_LENGTH) {
        return res.status(400).json({
          success: false,
          message: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`,
        });
      }

      data.description = description || null;
    }

    if (req.body.isActive !== undefined) {
      data.isActive = Boolean(req.body.isActive);
    }

    const service = await prisma.service.update({
      where: { id },
      data,
      include: { _count: { select: { customers: true } } },
    });

    const { _count, ...rest } = service;

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      service: { ...rest, customerCount: _count.customers },
    });
  } catch (error) {
    console.error("Update service error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ===============================
// DELETE SERVICE
// Customers are NOT deleted. They only lose this service tag.
// Old campaigns are not affected (they store their own recipients).
// ===============================
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const existing = await prisma.service.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    await prisma.service.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully",
    });
  } catch (error) {
    console.error("Delete service error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ===============================
// GET CUSTOMER IDS OF A SERVICE
// ===============================
const getServiceCustomers = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const service = await prisma.service.findFirst({
      where: { id, companyId },
      select: { id: true },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    const rows = await prisma.customerService.findMany({
      where: { serviceId: id },
      select: { customerId: true },
    });

    return res.status(200).json({
      success: true,
      customerIds: rows.map((row) => row.customerId),
    });
  } catch (error) {
    console.error("Get service customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ===============================
// SET THE CUSTOMERS OF A SERVICE (replaces membership of THIS service only)
// ===============================
const setServiceCustomers = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId } = req.user;

    const service = await prisma.service.findFirst({
      where: { id, companyId },
      select: { id: true },
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    let { customerIds } = req.body;

    if (!Array.isArray(customerIds)) {
      return res.status(400).json({
        success: false,
        message: "customerIds must be an array",
      });
    }

    customerIds = [
      ...new Set(customerIds.filter(Boolean).map((cid) => String(cid))),
    ];

    if (customerIds.length > 0) {
      const valid = await prisma.customer.findMany({
        where: { id: { in: customerIds }, companyId },
        select: { id: true },
      });

      if (valid.length !== customerIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more selected customers are invalid.",
        });
      }
    }

    await prisma.$transaction([
      prisma.customerService.deleteMany({ where: { serviceId: id } }),
      prisma.customerService.createMany({
        data: customerIds.map((customerId) => ({
          customerId,
          serviceId: id,
        })),
        skipDuplicates: true,
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Service customers updated successfully",
      customerCount: customerIds.length,
    });
  } catch (error) {
    console.error("Set service customers error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  getServices,
  createService,
  updateService,
  deleteService,
  getServiceCustomers,
  setServiceCustomers,
};
