const express = require("express");
const router = express.Router();

const { getAllLocations, getLocationByDriver } = require("../controllers/location.controller");
const { authenticate } = require("../middlewares/auth");

// Admin only
router.get("/", authenticate, getAllLocations);
router.get("/:driverId", authenticate, getLocationByDriver);

module.exports = router;
