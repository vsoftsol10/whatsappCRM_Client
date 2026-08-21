
const prisma = require("../config/prisma");
const { validateCustomer } = require("../validations/customerValidation");
const { normalizeIndianPhone } = require("../utils/phoneUtils");

const createCustomer = async (req, res) => {
  try {
    const validation = validateCustomer(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const { name, phone, email, company, source, requirements, status } = req.body;

    //console.log("req.user:", req.user);

    const normalizedPhone = normalizeIndianPhone(phone);

    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid Indian mobile number.",
      });
    }

    const { userId, companyId } = req.user;

    const customer = await prisma.customer.create({
      data: {
        name,
        phone: normalizedPhone,
        email,
        companyName: company,
        source,
        requirements,
        status,

        userId,
        companyId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
      error,
    });
  }
};

const getCustomers = async (req, res) => {
  try {
    const { status, search } = req.query;

    const where = {
      companyId: req.user.companyId
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Search by name, phone, or email
    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          phone: {
            contains: search,
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      customer,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const validation = validateCustomer(req.body);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const { name, phone, email, company, source, requirements, status } = req.body;

    const updatedCustomer = await prisma.customer.update({
      where: {
        id,
      },
      data: {
        name,
        phone,
        email,
        companyName: company,
        source,
        requirements,
        status,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Check customer exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id,
        companyId: req.user.companyId
      }
    });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check if customer has any tickets
    const ticket = await prisma.ticket.findFirst({
      where: {
        customerId: id,
      },
    });

    if (ticket) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete customer. Delete associated tickets first.",
      });
    }

    // Find customer's conversation
    const conversation = await prisma.conversation.findUnique({
      where: {
        customerId: id,
      },
    });

    // Delete messages first, then conversation
    if (conversation) {
      await prisma.message.deleteMany({
        where: {
          conversationId: conversation.id,
        },
      });

      await prisma.conversation.delete({
        where: {
          id: conversation.id,
        },
      });
    }

    // Delete customer
    await prisma.customer.delete({
      where: {
        id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};