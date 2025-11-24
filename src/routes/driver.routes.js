const express = require("express");
const router = express.Router();

const {
  createDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver
} = require("../controllers/driver.controller");

const { authenticate } = require("../middlewares/auth");

// Admin-only CRUD
router.post("/", authenticate, createDriver);
router.get("/", authenticate, getDrivers);
router.get("/:id", authenticate, getDriverById);
router.put("/:id", authenticate, updateDriver);
router.delete("/:id", authenticate, deleteDriver);

module.exports = router;
