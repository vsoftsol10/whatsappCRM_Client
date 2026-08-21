

const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { checkUserLimit } = require("../middleware/planLimitMiddleware");

const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeeController");

const router = express.Router();

router.post("/", authMiddleware, checkUserLimit, createEmployee);

router.get("/", authMiddleware, getEmployees);

router.get("/:id", authMiddleware, getEmployeeById);

router.put("/:id", authMiddleware, updateEmployee);

router.delete("/:id", authMiddleware, deleteEmployee);

module.exports = router;