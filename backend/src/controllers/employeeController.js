
const prisma = require("../config/prisma");
const bcrypt = require("bcryptjs");
const generatePassword = require("../utils/generatePassword");
const sendEmployeeCredentials = require("../services/emailService");

// CREATE EMPLOYEE
// CREATE EMPLOYEE
const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      department,
      designation,
      address,
      role,
      status,
    } = req.body;

    // ==========================================
    // CHECK DUPLICATE EMAIL
    // ==========================================

    const existingUser = await prisma.user.findFirst({
      where: {
        companyId: req.user.companyId,
        email: email.trim().toLowerCase(),
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Employee with this email already exists",
      });
    }

    // ==========================================
    // GENERATE PASSWORD
    // ==========================================

    const tempPassword = generatePassword();

    const hashedPassword = await bcrypt.hash(
      tempPassword,
      10
    );

    // ==========================================
    // CREATE EMPLOYEE
    // ==========================================

    const employee = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: "USER",
        status: status || "ACTIVE",
        phone,
        department,
        designation,
        address,
        companyId: req.user.companyId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        designation: true,
        address: true,
        role: true,
        status: true,
      },
    });

    console.log(
      "Employee created successfully:",
      employee.id
    );

    // ==========================================
    // SEND EMAIL
    // ==========================================

    let emailSent = false;

    try {
      await sendEmployeeCredentials(
        employee.name,
        employee.email,
        tempPassword
      );

      emailSent = true;

      console.log(
        "Employee credentials email sent successfully"
      );

    } catch (emailError) {

      console.error(
        "Employee created, but email sending failed:",
        emailError
      );

      // IMPORTANT:
      // Do NOT return 500 here.
      // Employee has already been created.
      emailSent = false;
    }

    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================

    return res.status(201).json({
      success: true,

      message: emailSent
        ? "Employee created successfully"
        : "Employee created successfully, but email could not be sent",

      employee,

      emailSent,
    });

  } catch (error) {

    console.error(
      "Create Employee Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create employee",
    });
  }
};

// GET ALL EMPLOYEES
const getEmployees = async (req, res) => {
  try {
    const employees = await prisma.user.findMany({
      where: {
        role: "USER",
        status: "ACTIVE",
        companyId: req.user.companyId
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        designation: true,
        address: true,
        role: true,
        status: true,
      },
    });

    res.status(200).json({
      success: true,
      employees,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// GET EMPLOYEE BY ID
// GET EMPLOYEE BY ID
const getEmployeeById = async (req, res) => {
  try {
    const employee = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
        role: "USER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        designation: true,
        address: true,
        role: true,
        status: true,
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    return res.status(200).json({
      success: true,
      employee,
    });
  } catch (error) {
    console.error("Get Employee By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


// UPDATE EMPLOYEE
const updateEmployee = async (req, res) => {
  try {

    const {
      name,
      email,
      phone,
      department,
      designation,
      address,
      role,
      status,
    } = req.body;



    // Check employee belongs to logged-in company
    const existingEmployee = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        companyId: req.user.companyId,
        role: "USER",
      }
    });


    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // Check whether another employee already uses this email
    const duplicateEmail = await prisma.user.findFirst({
      where: {
        companyId: req.user.companyId,
        email,
        NOT: {
          id: req.params.id,
        },
      },
    });

    if (duplicateEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }


    // Update employee
    const employee = await prisma.user.update({

      where: {
        id: req.params.id
      },

      data: {
        name,
        email,
        phone,
        department,
        designation,
        address,
        role,
        status,
      },

      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        department: true,
        designation: true,
        address: true,
        role: true,
        status: true,
      }

    });


    return res.status(200).json({

      success: true,
      message: "Employee updated successfully",
      employee

    });


  } catch (error) {

    console.error("Update Employee Error:", error);

    return res.status(500).json({

      success: false,
      message: "Internal Server Error"

    });

  }

};

// DELETE EMPLOYEE
const deleteEmployee = async (req, res) => {
  try {
    const employeeId = req.params.id;

    const employee = await prisma.user.findFirst({
      where: {
        id: employeeId,
        companyId: req.user.companyId,
        role: "USER",
      },
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Check assigned tasks
    const taskCount = await prisma.task.count({
      where: {
        assignedToId: employeeId,
      },
    });

    if (taskCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete employee. ${taskCount} task(s) are still assigned.`,
      });
    }

    // Check assigned deals
    const dealCount = await prisma.deal.count({
      where: {
        assignedToId: employeeId,
      },
    });

    if (dealCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete employee. ${dealCount} deal(s) are still assigned.`,
      });
    }

    await prisma.user.delete({
      where: {
        id: employeeId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
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
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
};