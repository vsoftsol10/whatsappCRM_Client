

// const express = require("express");
// const authMiddleware = require("../middleware/authMiddleware");
// const { checkUserLimit } = require("../middleware/planLimitMiddleware");

// const {
//   createEmployee,
//   getEmployees,
//   getEmployeeById,
//   updateEmployee,
//   deleteEmployee,
// } = require("../controllers/employeeController");

// const router = express.Router();

// router.post("/", authMiddleware, checkUserLimit, createEmployee);

// router.get("/", authMiddleware, getEmployees);

// router.get("/:id", authMiddleware, getEmployeeById);

// router.put("/:id", authMiddleware, updateEmployee);

// router.delete("/:id", authMiddleware, deleteEmployee);

// module.exports = router;


const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const allowWriteAccess = require("../middleware/allowWriteAccess");
const { checkUserLimit } = require("../middleware/planLimitMiddleware");
const adminOnly = require("../middleware/adminOnly");

const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeeController");

const router = express.Router();

// Expired / inactive companies cannot add, edit or delete employees.
router.post("/", authMiddleware, adminOnly, allowWriteAccess, checkUserLimit, createEmployee);

router.get("/", authMiddleware, getEmployees);

router.get("/:id", authMiddleware, getEmployeeById);

router.put("/:id", authMiddleware, adminOnly, allowWriteAccess, updateEmployee);

router.delete("/:id", authMiddleware, adminOnly, allowWriteAccess, deleteEmployee);

module.exports = router;